import { supabase, isSupabaseConfigured } from "../config/supabase";

/**
 * High-performance Supabase service layer.
 * Replaces the Express backend server with direct client-side Supabase calls.
 */

// ─────────────────────────────────────────────────────────────
// 1. EVENTS SERVICE
// ─────────────────────────────────────────────────────────────

export interface EventRecord {
  id: number;
  title: string;
  slug: string;
  date: string;
  end_date?: string | null;
  venue: string;
  description: string;
  summary?: string;
  image?: string;
  registration_link?: string;
  tags?: string[] | string;
  status: string;
  featured?: number | boolean;
  capacity?: number;
  webhook_url?: string;
  created_at?: string;
  updated_at?: string;
}

function parseTags(tags: unknown): string[] {
  if (Array.isArray(tags)) return tags;
  if (typeof tags === "string") {
    try {
      const parsed = JSON.parse(tags);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      return tags.split(",").map((s) => s.trim()).filter(Boolean);
    }
  }
  return [];
}

export async function getEvents(options: { scope?: string; limit?: number } = {}) {
  if (!isSupabaseConfigured) return { success: true, data: [] };

  let query = supabase.from("events").select("*");

  if (options.scope === "upcoming") {
    query = query
      .gte("date", new Date().toISOString())
      .order("date", { ascending: true });
  } else if (options.scope === "past") {
    query = query
      .lt("date", new Date().toISOString())
      .order("date", { ascending: false });
  } else {
    query = query.order("date", { ascending: false });
  }

  if (options.limit && options.limit > 0) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[Supabase] getEvents error:", error.message);
    throw error;
  }

  // Count registrations for each event from Supabase
  const { data: allRegs } = await supabase
    .from("event_registrations")
    .select("event_id");

  const countMap: Record<number, number> = {};
  if (allRegs) {
    for (const r of allRegs) {
      countMap[r.event_id] = (countMap[r.event_id] || 0) + 1;
    }
  }

  const normalized = (data || []).map((e) => {
    const regCount = countMap[e.id] || 0;
    return {
      ...e,
      tags: parseTags(e.tags),
      registrationCount: regCount,
      registration_count: regCount,
      webhookUrl: e.webhook_url || "",
      registrationLink: e.registration_link || "",
      endDate: e.end_date || null,
    };
  });

  return { success: true, data: normalized };
}

export async function getEventByIdOrSlug(idOrSlug: string | number) {
  if (!isSupabaseConfigured) return { success: false, error: "Supabase not configured" };

  const isNumeric = !isNaN(Number(idOrSlug));
  const query = isNumeric
    ? supabase.from("events").select("*").eq("id", Number(idOrSlug)).single()
    : supabase.from("events").select("*").eq("slug", String(idOrSlug)).single();

  const { data, error } = await query;
  if (error) throw error;

  const { count } = await supabase
    .from("event_registrations")
    .select("*", { count: "exact", head: true })
    .eq("event_id", data.id);

  return {
    success: true,
    data: {
      ...data,
      tags: parseTags(data.tags),
      registrationCount: count || 0,
      registration_count: count || 0,
      webhookUrl: data.webhook_url || "",
      registrationLink: data.registration_link || "",
      endDate: data.end_date || null,
    },
  };
}

export async function createEvent(eventData: Partial<EventRecord>) {
  const payload = {
    ...eventData,
    tags: Array.isArray(eventData.tags) ? eventData.tags : parseTags(eventData.tags),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase.from("events").insert(payload).select().single();
  if (error) throw error;
  return { success: true, data: { ...data, tags: parseTags(data.tags) } };
}

export async function updateEvent(id: number, eventData: Partial<EventRecord>) {
  const payload = {
    ...eventData,
    tags: Array.isArray(eventData.tags) ? eventData.tags : parseTags(eventData.tags),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase.from("events").update(payload).eq("id", id).select().single();
  if (error) throw error;
  return { success: true, data: { ...data, tags: parseTags(data.tags) } };
}

export async function deleteEvent(id: number) {
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) throw error;
  return { success: true, data: { id, deleted: true } };
}

// ─────────────────────────────────────────────────────────────
// 2. TEAM MEMBERS SERVICE
// ─────────────────────────────────────────────────────────────

export interface TeamMember {
  id: number;
  name: string;
  role: string;
  department: string;
  photo: string;
  email: string;
  phone: string;
  linkedin: string;
  github: string;
  bio: string;
  order: number;
  active: number | boolean;
}

export async function getTeamMembers() {
  if (!isSupabaseConfigured) return { success: true, data: [] };

  const { data, error } = await supabase
    .from("team_members")
    .select("*")
    .order("order", { ascending: true })
    .order("id", { ascending: true });

  if (error) throw error;
  return { success: true, data: data || [] };
}

export async function createTeamMember(memberData: Partial<TeamMember>) {
  const { data, error } = await supabase.from("team_members").insert(memberData).select().single();
  if (error) throw error;
  return { success: true, data };
}

export async function updateTeamMember(id: number, memberData: Partial<TeamMember>) {
  const { data, error } = await supabase.from("team_members").update(memberData).eq("id", id).select().single();
  if (error) throw error;
  return { success: true, data };
}

export async function deleteTeamMember(id: number) {
  const { error } = await supabase.from("team_members").delete().eq("id", id);
  if (error) throw error;
  return { success: true, data: { id, deleted: true } };
}

// ─────────────────────────────────────────────────────────────
// 3. EVENT REGISTRATIONS & TICKETS
// ─────────────────────────────────────────────────────────────

export interface RegistrationInput {
  teamName?: string;
  member1: string;
  member2?: string;
  email: string;
  phone?: string;
  member2Phone?: string;
  member2_phone?: string;
  department?: string;
  college?: string;
  rollNumber?: string;
  year?: string;
  notes?: string;
}

export async function registerForEvent(eventId: number, input: RegistrationInput) {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase is not configured yet. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
  }

  // 1. Check event capacity & status
  const { data: event, error: eventErr } = await supabase.from("events").select("*").eq("id", eventId).single();
  if (eventErr || !event) throw new Error("Event not found.");

  if (event.capacity && event.capacity > 0) {
    const { count } = await supabase
      .from("event_registrations")
      .select("*", { count: "exact", head: true })
      .eq("event_id", eventId);
    if ((count || 0) >= event.capacity) {
      throw new Error(`Registration is full. Capacity of ${event.capacity} has been reached.`);
    }
  }

  function getStoredEmailCredentials() {
    try {
      const raw = localStorage.getItem("aif_email_settings");
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return {
        gmailUser: parsed.gmailUser || undefined,
        gmailAppPassword: parsed.gmailAppPassword || undefined,
      };
    } catch {
      return {};
    }
  }

  // 2. Duplicate check
  const cleanEmail = input.email.trim().toLowerCase();
  const { data: existing } = await supabase
    .from("event_registrations")
    .select("*")
    .eq("event_id", eventId)
    .ilike("email", cleanEmail)
    .maybeSingle();

  if (existing) {
    const regCode = `AIF-${eventId}-${existing.id}`;

    // Re-dispatch confirmation pass to participant
    const recipientEmails = [existing.email, existing.member2_phone].filter(
      (e) => e && e.includes("@")
    );
    if (recipientEmails.length > 0) {
      fetch("/api/send-confirmation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: recipientEmails,
          eventTitle: event.title,
          eventDate: event.date,
          venue: event.venue,
          registrationCode: regCode,
          name: existing.name || existing.member1,
          teamName: existing.team_name,
          member1: existing.member1,
          member2: existing.member2,
          department: existing.department,
          year: existing.year,
          ...getStoredEmailCredentials(),
        }),
      }).catch((err) => console.warn("[Email Dispatch]", err.message));
    }

    return {
      success: true,
      message: "You are already registered for this event! Ticket pass retrieved.",
      data: {
        id: existing.id,
        registrationId: regCode,
        teamName: existing.team_name,
        member1: existing.member1,
        member2: existing.member2,
        name: existing.name || existing.member1,
        email: existing.email,
        phone: existing.phone,
        department: existing.department,
        year: existing.year,
        eventTitle: event.title,
        eventDate: event.date,
        venue: event.venue,
        alreadyRegistered: true,
      },
    };
  }

  // 3. Insert registration
  const payload = {
    event_id: eventId,
    team_name: (input.teamName || "").trim(),
    member1: (input.member1 || "").trim(),
    member2: (input.member2 || "").trim(),
    name: (input.member1 || "").trim(),
    email: cleanEmail,
    phone: String(input.phone || "").trim(),
    member2_phone: String(input.member2Phone || input.member2_phone || "").trim(),
    department: String(input.department || input.college || "AI & Data Science").trim(),
    college: String(input.college || input.department || "AI & Data Science").trim(),
    roll_number: String(input.rollNumber || "").trim(),
    year: String(input.year || "").trim(),
    notes: String(input.notes || "").trim(),
    attended: 0,
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabase.from("event_registrations").insert(payload).select().single();
  if (error) throw error;

  const regCode = `AIF-${eventId}-${data.id}`;

  // Trigger official confirmation email via serverless dispatcher (background non-blocking)
  const recipientEmails = [payload.email, payload.member2_phone].filter(
    (e) => e && e.includes("@")
  );
  fetch("/api/send-confirmation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      to: recipientEmails,
      eventTitle: event.title,
      eventDate: event.date,
      venue: event.venue,
      registrationCode: regCode,
      name: payload.name,
      teamName: payload.team_name,
      member1: payload.member1,
      member2: payload.member2,
      department: payload.department,
      year: payload.year,
      ...getStoredEmailCredentials(),
    }),
  }).catch((err) => console.warn("[Email Dispatch]", err.message));

  return {
    success: true,
    message: `Registration confirmed for ${event.title}!`,
    data: {
      id: data.id,
      registrationId: regCode,
      teamName: payload.team_name,
      member1: payload.member1,
      member2: payload.member2,
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      department: payload.department,
      year: payload.year,
      eventTitle: event.title,
      eventDate: event.date,
      venue: event.venue,
    },
  };
}

export async function lookupTicket(identifier: string) {
  const clean = String(identifier || "").trim().toLowerCase();
  if (!clean) throw new Error("Please enter your Registration ID or Email Address.");

  let query = supabase
    .from("event_registrations")
    .select("*, events (title, date, venue)");

  if (clean.startsWith("aif-")) {
    const parts = clean.split("-");
    const id = Number(parts[parts.length - 1]);
    if (!isNaN(id)) query = query.eq("id", id);
    else query = query.ilike("email", clean);
  } else {
    query = query.ilike("email", clean);
  }

  const { data, error } = await query;
  if (error) throw error;

  const tickets = (data || []).map((r) => ({
    id: r.id,
    registrationId: `AIF-${r.event_id}-${r.id}`,
    teamName: r.team_name,
    member1: r.member1,
    member2: r.member2,
    name: r.name,
    email: r.email,
    phone: r.phone,
    department: r.department,
    year: r.year,
    attended: Boolean(r.attended),
    checkedInAt: r.checked_in_at,
    eventTitle: r.events?.title || "AI Frontier Club Event",
    eventDate: r.events?.date,
    venue: r.events?.venue,
  }));

  return { success: true, count: tickets.length, tickets };
}

export async function getEventRegistrations(eventId: number) {
  const { data, error } = await supabase
    .from("event_registrations")
    .select("*")
    .eq("event_id", eventId)
    .order("id", { ascending: true });

  if (error) throw error;
  const list = (data || []).map((r) => ({
    ...r,
    registrationCode: `AIF-${eventId}-${r.id}`,
    attended: Boolean(r.attended),
    checked_in_at: r.checked_in_at || "",
  }));
  return { success: true, data: list };
}

export async function getAttendance(eventId: number) {
  const { data: event, error: evErr } = await supabase
    .from("events")
    .select("id, title, date, venue, capacity")
    .eq("id", eventId)
    .maybeSingle();

  if (evErr) console.warn("[Supabase] getAttendance event query:", evErr.message);

  const { data: list, error } = await supabase
    .from("event_registrations")
    .select("*")
    .eq("event_id", eventId)
    .order("id", { ascending: true });

  if (error) throw error;

  const regs = list || [];
  const total = regs.length;
  const present = regs.filter((r) => r.attended === 1 || r.attended === true).length;
  const absent = total - present;
  const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

  const totalParticipants = regs.reduce((sum, r) => sum + 1 + (r.member2 && r.member2.trim() ? 1 : 0), 0);
  const presentParticipants = regs.filter((r) => r.attended === 1 || r.attended === true)
    .reduce((sum, r) => sum + 1 + (r.member2 && r.member2.trim() ? 1 : 0), 0);

  return {
    success: true,
    event,
    stats: {
      total,
      present,
      absent,
      percentage,
      totalParticipants,
      presentParticipants,
    },
    data: regs.map((r) => ({
      ...r,
      registrationCode: `AIF-${eventId}-${r.id}`,
      attended: Boolean(r.attended),
      checked_in_at: r.checked_in_at || "",
    })),
  };
}

export async function toggleAttendance(eventId: number, regId: number, attended?: boolean) {
  let newAttended: number;
  if (attended !== undefined) {
    newAttended = attended ? 1 : 0;
  } else {
    const { data: reg, error: getErr } = await supabase
      .from("event_registrations")
      .select("attended")
      .eq("id", regId)
      .single();
    if (getErr) throw getErr;
    newAttended = reg.attended ? 0 : 1;
  }

  const checkInTime = newAttended ? new Date().toISOString() : null;
  const { data, error } = await supabase
    .from("event_registrations")
    .update({
      attended: newAttended,
      checked_in_at: checkInTime,
    })
    .eq("id", regId)
    .select()
    .single();

  if (error) throw error;
  return {
    success: true,
    data: {
      ...data,
      registrationCode: `AIF-${eventId}-${regId}`,
      attended: Boolean(newAttended),
      checked_in_at: checkInTime || "",
    },
    message: newAttended === 1 ? "Attendee marked PRESENT." : "Attendee marked ABSENT.",
  };
}

export async function quickCheckIn(eventId: number, codeOrEmail: string) {
  const clean = String(codeOrEmail || "").trim();
  if (!clean) throw new Error("Please enter a Ticket ID, Email, Team Name, or Attendee Name.");

  let query = supabase.from("event_registrations").select("*").eq("event_id", eventId);

  const codeMatch = clean.match(/AIF-(\d+)-(\d+)/i);
  if (codeMatch && Number(codeMatch[1]) === eventId) {
    query = query.eq("id", Number(codeMatch[2]));
  } else if (/^\d+$/.test(clean)) {
    query = query.eq("id", Number(clean));
  } else {
    query = query.or(`email.ilike.%${clean}%,name.ilike.%${clean}%,member1.ilike.%${clean}%,member2.ilike.%${clean}%,team_name.ilike.%${clean}%`);
  }

  const { data: records, error } = await query;
  if (error || !records || records.length === 0) throw new Error("Attendee or Team not found for this event.");
  const data = records[0];

  const checkInTime = new Date().toISOString();
  const { data: updated, error: updateErr } = await supabase
    .from("event_registrations")
    .update({
      attended: 1,
      checked_in_at: checkInTime,
    })
    .eq("id", data.id)
    .select()
    .single();

  if (updateErr) throw updateErr;
  return {
    success: true,
    data: {
      ...updated,
      registrationCode: `AIF-${eventId}-${updated.id}`,
      attended: true,
      checked_in_at: checkInTime,
    },
    message: `Checked in ${data.team_name ? `Team "${data.team_name}" (${data.member1 || data.name})` : (data.name || data.member1)}!`,
  };
}

export async function bulkAttendance(eventId: number, payload: any) {
  const action = payload?.action;
  if (action === "mark_all_present") {
    const { data, error } = await supabase
      .from("event_registrations")
      .update({
        attended: 1,
        checked_in_at: new Date().toISOString(),
      })
      .eq("event_id", eventId)
      .select();
    if (error) throw error;
    return { success: true, message: "All attendees marked PRESENT.", updated: data?.length || 0 };
  } else if (action === "mark_all_absent") {
    const { data, error } = await supabase
      .from("event_registrations")
      .update({
        attended: 0,
        checked_in_at: null,
      })
      .eq("event_id", eventId)
      .select();
    if (error) throw error;
    return { success: true, message: "All attendees marked ABSENT.", updated: data?.length || 0 };
  } else if (Array.isArray(payload)) {
    for (const item of payload) {
      await supabase
        .from("event_registrations")
        .update({
          attended: item.attended ? 1 : 0,
          checked_in_at: item.attended ? new Date().toISOString() : null,
        })
        .eq("id", item.id);
    }
    return { success: true, updated: payload.length };
  } else if (payload?.items && Array.isArray(payload.items)) {
    for (const item of payload.items) {
      await supabase
        .from("event_registrations")
        .update({
          attended: item.attended ? 1 : 0,
          checked_in_at: item.attended ? new Date().toISOString() : null,
        })
        .eq("id", item.id);
    }
    return { success: true, updated: payload.items.length };
  }
  return { success: true };
}

export async function deleteEventRegistration(regId: number) {
  const { error } = await supabase.from("event_registrations").delete().eq("id", regId);
  if (error) throw error;
  return { success: true, data: { id: regId, deleted: true } };
}

// ─────────────────────────────────────────────────────────────
// 4. CLUB DETAILS & ACTIVITIES
// ─────────────────────────────────────────────────────────────

export async function getClubDetails() {
  if (!isSupabaseConfigured) return { success: true, data: null };

  const { data, error } = await supabase.from("club_details").select("*").eq("id", 1).maybeSingle();
  if (error) throw error;
  return { success: true, data };
}

export async function updateClubDetails(payload: Record<string, unknown>) {
  const { data, error } = await supabase
    .from("club_details")
    .upsert({ id: 1, ...payload, updated_at: new Date().toISOString() })
    .select()
    .single();

  if (error) throw error;
  return { success: true, data };
}

export async function getActivities() {
  if (!isSupabaseConfigured) return { success: true, data: [] };

  const { data, error } = await supabase
    .from("club_activities")
    .select("*")
    .order("order", { ascending: true })
    .order("id", { ascending: true });

  if (error) throw error;
  return { success: true, data: data || [] };
}

export async function createActivity(payload: Record<string, unknown>) {
  const { data, error } = await supabase.from("club_activities").insert(payload).select().single();
  if (error) throw error;
  return { success: true, data };
}

export async function updateActivity(id: number, payload: Record<string, unknown>) {
  const { data, error } = await supabase.from("club_activities").update(payload).eq("id", id).select().single();
  if (error) throw error;
  return { success: true, data };
}

export async function deleteActivity(id: number) {
  const { error } = await supabase.from("club_activities").delete().eq("id", id);
  if (error) throw error;
  return { success: true, data: { id, deleted: true } };
}

// ─────────────────────────────────────────────────────────────
// 5. NEWSLETTER SUBSCRIBERS
// ─────────────────────────────────────────────────────────────

export async function subscribeNewsletter(email: string) {
  const clean = String(email || "").trim().toLowerCase();
  if (!clean || !clean.includes("@")) throw new Error("Please provide a valid email address.");

  const { error } = await supabase.from("subscribers").upsert({ email: clean });
  if (error) throw error;
  return {
    success: true,
    message: "Subscribed! You will receive notifications whenever a new event is announced.",
  };
}

// ─────────────────────────────────────────────────────────────
// 6. STORAGE UPLOADS (DIRECT SUPABASE STORAGE)
// ─────────────────────────────────────────────────────────────

export async function uploadToSupabase(file: File, bucket = "club-uploads"): Promise<string> {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase is not configured yet.");
  }

  const fileExt = file.name.split(".").pop();
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
  const filePath = `uploads/${fileName}`;

  const { error } = await supabase.storage.from(bucket).upload(filePath, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) {
    // If bucket doesn't exist yet, throw clear instruction
    if (error.message.includes("Bucket not found") || error.message.includes("bucket")) {
      throw new Error(`Storage bucket '${bucket}' not found. Please create a public bucket named '${bucket}' in Supabase Dashboard ➔ Storage.`);
    }
    throw error;
  }

  const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return publicUrlData.publicUrl;
}
