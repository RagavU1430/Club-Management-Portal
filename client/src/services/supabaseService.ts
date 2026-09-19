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

export async function registerForEvent(eventId: number | string, input: RegistrationInput) {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase is not configured yet. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
  }

  const numericId = await resolveNumericEventId(eventId);

  // 1. Check event capacity & status
  const { data: event, error: eventErr } = await supabase.from("events").select("*").eq("id", numericId).single();
  if (eventErr || !event) throw new Error("Event not found.");

  if (event.capacity && event.capacity > 0) {
    const { count } = await supabase
      .from("event_registrations")
      .select("*", { count: "exact", head: true })
      .eq("event_id", numericId);
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
    .eq("event_id", numericId)
    .ilike("email", cleanEmail)
    .maybeSingle();

  if (existing) {
    const regCode = `AIF-${numericId}-${existing.id}`;

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
          email: existing.email,
          member2Email: existing.member2_phone,
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
    event_id: numericId,
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

  const regCode = `AIF-${numericId}-${data.id}`;

  // Trigger official confirmation email via serverless dispatcher (background non-blocking)
  const recipientEmails = [payload.email, payload.member2_phone].filter(
    (e) => e && e.includes("@")
  );
  fetch("/api/send-confirmation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      to: recipientEmails,
      email: payload.email,
      member2Email: payload.member2_phone,
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

  // Google Sheets automatic real-time live sync (background non-blocking)
  syncSingleRegistrationToGoogleSheet(event, {
    ...payload,
    id: data.id,
    registrationCode: regCode,
  }).catch((err) => console.warn("[Google Sheets Live Sync]", err?.message));

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

export async function resolveNumericEventId(eventId: number | string): Promise<number> {
  const num = Number(eventId);
  if (!isNaN(num) && num > 0) return num;
  const { data: ev } = await supabase
    .from("events")
    .select("id")
    .eq("slug", String(eventId))
    .maybeSingle();
  if (ev?.id) return ev.id;
  return 4; // default event ID fallback if nothing matches
}

export async function getEventRegistrations(eventId: number | string) {
  const numericId = await resolveNumericEventId(eventId);
  let { data, error } = await supabase
    .from("event_registrations")
    .select("*")
    .eq("event_id", numericId)
    .order("id", { ascending: true });

  if (error) {
    console.warn("[Supabase] getEventRegistrations error:", error.message);
  }

  if (!data || data.length === 0) {
    const { data: fallbackList } = await supabase
      .from("event_registrations")
      .select("*")
      .order("id", { ascending: true });
    if (fallbackList && fallbackList.length > 0) {
      data = fallbackList;
    }
  }

  const list = (data || []).map((r) => ({
    ...r,
    registrationCode: `AIF-${numericId || r.event_id || 4}-${r.id}`,
    attended: Boolean(r.attended),
    checked_in_at: r.checked_in_at || "",
  }));
  return { success: true, data: list };
}

export async function getAttendance(eventId: number | string) {
  const numericId = await resolveNumericEventId(eventId);

  const { data: event, error: evErr } = await supabase
    .from("events")
    .select("id, title, date, venue, capacity")
    .eq("id", numericId)
    .maybeSingle();

  if (evErr) console.warn("[Supabase] getAttendance event query:", evErr.message);

  let { data: list, error } = await supabase
    .from("event_registrations")
    .select("*")
    .eq("event_id", numericId)
    .order("id", { ascending: true });

  if (error) {
    console.warn("[Supabase] getAttendance registrations query error:", error.message);
  }

  if (!list || list.length === 0) {
    const { data: fallbackList } = await supabase
      .from("event_registrations")
      .select("*")
      .order("id", { ascending: true });
    if (fallbackList && fallbackList.length > 0) {
      list = fallbackList;
    }
  }

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
    event: event || { id: numericId, title: "AI Frontiers Club" },
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
      registrationCode: `AIF-${numericId}-${r.id}`,
      attended: Boolean(r.attended),
      checked_in_at: r.checked_in_at || "",
    })),
  };
}

export async function toggleAttendance(eventId: number | string, regId: number, attended?: boolean) {
  const numericId = await resolveNumericEventId(eventId);
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
      registrationCode: `AIF-${numericId}-${regId}`,
      attended: Boolean(newAttended),
      checked_in_at: checkInTime || "",
    },
    message: newAttended === 1 ? "Attendee marked PRESENT." : "Attendee marked ABSENT.",
  };
}

export async function quickCheckIn(eventId: number | string, codeOrEmail: string) {
  const numericId = await resolveNumericEventId(eventId);
  const clean = String(codeOrEmail || "").trim();
  if (!clean) throw new Error("Please enter a Ticket ID, Email, Team Name, or Attendee Name.");

  let query = supabase.from("event_registrations").select("*").eq("event_id", numericId);

  const codeMatch = clean.match(/AIF-(\d+)-(\d+)/i);
  if (codeMatch && Number(codeMatch[1]) === numericId) {
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
      registrationCode: `AIF-${numericId}-${updated.id}`,
      attended: true,
      checked_in_at: checkInTime,
    },
    message: `Checked in ${data.team_name ? `Team "${data.team_name}" (${data.member1 || data.name})` : (data.name || data.member1)}!`,
  };
}

export async function bulkAttendance(eventId: number | string, payload: any) {
  const numericId = await resolveNumericEventId(eventId);
  const action = payload?.action;
  if (action === "mark_all_present") {
    const { data, error } = await supabase
      .from("event_registrations")
      .update({
        attended: 1,
        checked_in_at: new Date().toISOString(),
      })
      .eq("event_id", numericId)
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
      .eq("event_id", numericId)
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

async function compressImageToDataUrl(file: File, maxWidth = 1280, quality = 0.82): Promise<string> {
  if (typeof window === "undefined" || !file.type.startsWith("image/")) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          let { width, height } = img;
          if (width > maxWidth || height > maxWidth) {
            if (width > height) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxWidth) / height);
              height = maxWidth;
            }
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL(file.type === "image/png" ? "image/png" : "image/jpeg", quality));
            return;
          }
        } catch {}
        resolve(e.target?.result as string);
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });
}

export async function uploadToSupabase(file: File, bucket = "club-uploads"): Promise<string> {
  if (!isSupabaseConfigured) {
    return compressImageToDataUrl(file);
  }

  const fileExt = file.name.split(".").pop();
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
  const filePath = `uploads/${fileName}`;

  try {
    const { error } = await supabase.storage.from(bucket).upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

    if (error) {
      console.warn("[Supabase Storage] Storage RLS or bucket notice:", error.message, "Using optimized Data URL fallback.");
      return await compressImageToDataUrl(file);
    }

    const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return publicUrlData.publicUrl;
  } catch (err: any) {
    console.warn("[Supabase Storage] Storage exception:", err?.message, "Using optimized Data URL fallback.");
    return await compressImageToDataUrl(file);
  }
}

// ─────────────────────────────────────────────────────────────
// 7. GOOGLE SHEETS LIVE SYNC & SETTINGS
// ─────────────────────────────────────────────────────────────

export const DEFAULT_SPREADSHEET_URL = "https://docs.google.com/spreadsheets/d/1MUkixf7X2_5cYzZJm1dL1atzRK2sIPxLpgKDGV7rTYk/edit?usp=sharing";
export const DEFAULT_SPREADSHEET_ID = "1MUkixf7X2_5cYzZJm1dL1atzRK2sIPxLpgKDGV7rTYk";

export function getSafeSheetName(eventTitle?: string): string {
  let title = (eventTitle || "Event").trim();
  title = title.replace(/[:\\/?*\[\]]/g, "-").trim();
  if (title.length <= 4 || /^[A-Za-z]{1,3}\d*$/i.test(title)) {
    title = `${title} - Registrations`;
  }
  return title.slice(0, 80);
}

export function getGoogleAppsScriptTemplate(spreadsheetId = DEFAULT_SPREADSHEET_ID): string {
  return `/**
 * AI FRONTIER CLUB - GOOGLE SHEETS LIVE SYNC
 * Spreadsheet ID: ${spreadsheetId}
 * 
 * SETUP INSTRUCTIONS:
 * 1. Open your Google Spreadsheet:
 *    https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit
 * 2. In top menu click: Extensions -> Apps Script
 * 3. Delete any existing code and PASTE THIS ENTIRE SCRIPT.
 * 4. Click "Deploy" (top right) -> "New deployment"
 * 5. Click the gear icon (Select type) -> choose "Web app"
 * 6. Set Description: "AI Frontier Sync"
 * 7. Set "Execute as": "Me"
 * 8. Set "Who has access": "Anyone"  <-- CRITICAL!
 * 9. Click "Deploy" -> "Authorize access" (choose your Google account, click Advanced -> Go to Untitled project)
 * 10. Copy the "Web app URL" (ends in /exec) and paste it into the Admin Console!
 */

function doPost(e) {
  try {
    var raw = e && e.postData && e.postData.contents ? e.postData.contents : "{}";
    var data = JSON.parse(raw);
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    var rawTitle = (data.sheetName || data.eventTitle || "Event Registrations").trim();
    var sheetName = rawTitle.replace(/[:\\\\/?*\\[\\]]/g, "-").trim();
    if (sheetName.length <= 4 || /^[A-Za-z]{1,3}\\d*$/i.test(sheetName)) {
      sheetName = sheetName + " - Registrations";
    }
    sheetName = sheetName.substring(0, 80);

    var sheet = ss.getSheetByName(sheetName);

    var headers = [
      "Registration ID",
      "Team Name",
      "Department",
      "Member 1 (Lead)",
      "Lead Email",
      "Year of Study",
      "Notes / Queries",
      "Registered At"
    ];

    function ensureHeaders(targetSheet) {
      var lastCol = targetSheet.getLastColumn();
      var needHeaders = false;
      if (lastCol < headers.length) {
        needHeaders = true;
      } else {
        var firstRow = targetSheet.getRange(1, 1, 1, Math.min(headers.length, lastCol)).getValues()[0];
        if (firstRow[3] !== "Member 1 (Lead)" && firstRow[2] !== "Member 1 (Lead)") {
          needHeaders = true;
        }
      }

      if (needHeaders) {
        targetSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
        var headerRange = targetSheet.getRange(1, 1, 1, headers.length);
        headerRange.setFontWeight("bold");
        headerRange.setBackground("#0f172a");
        headerRange.setFontColor("#38bdf8");
        targetSheet.setFrozenRows(1);
        for (var i = 1; i <= headers.length; i++) {
          targetSheet.autoResizeColumn(i);
        }
      }
    }

    if (data.action === "create_event_sheet" || !sheet) {
      if (!sheet) {
        sheet = ss.insertSheet(sheetName);
      }
      ensureHeaders(sheet);

      if (data.action === "create_event_sheet") {
        return ContentService.createTextOutput(JSON.stringify({
          success: true,
          message: "Sheet ready: " + sheetName,
          sheetName: sheetName
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }

    ensureHeaders(sheet);

    if (data.action === "add_registration" || data.name || data.email || data.member1) {
      var regId = String(data.registrationId || "").trim();
      var leadEmail = String(data.email || "").trim().toLowerCase();
      var member2Email = String(data.member2Email || data.member2_phone || data.member2Phone || "").trim().toLowerCase();
      var teamName = String(data.teamName || data.team_name || "").trim();
      var member1 = String(data.member1 || data.name || "").trim();
      var member2 = String(data.member2 || "").trim();
      var dept = String(data.department || data.college || "").trim();
      var year = String(data.year || "").trim();
      var notes = String(data.notes || "").trim();
      var timestamp = data.timestamp || new Date().toLocaleString();

      var regIdStr = regId ? "'" + regId : "";

      var lastRow = sheet.getLastRow();
      if (lastRow > 1 && regId) {
        var values = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
        for (var r = 0; r < values.length; r++) {
          var existingRegId = String(values[r][0] || "").trim();
          if (existingRegId === regId) {
            return ContentService.createTextOutput(JSON.stringify({
              success: true,
              message: "Already synced: " + regId,
              sheetName: sheetName,
              alreadySynced: true
            })).setMimeType(ContentService.MimeType.JSON);
          }
        }
      }

      if (member1) {
        sheet.appendRow([
          regIdStr,
          teamName || (member1 + "'s Team"),
          dept,
          member1,
          leadEmail,
          year,
          notes,
          timestamp
        ]);
      }

      if (member2 && member2 !== "-" && member2.toLowerCase() !== "none") {
        sheet.appendRow([
          regIdStr,
          teamName || (member1 + "'s Team"),
          dept,
          member2,
          member2Email || leadEmail || "-",
          year,
          notes,
          timestamp
        ]);
      }

      for (var col = 1; col <= headers.length; col++) {
        sheet.autoResizeColumn(col);
      }

      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: "Registration recorded in " + sheetName,
        sheetName: sheetName,
        email: leadEmail,
        member1: member1,
        member2: member2
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: "Webhook acknowledged"
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput("AI Frontier Live Sync Webhook is Active!");
}
`;
}

export async function getGoogleSheetSettings() {
  if (!isSupabaseConfigured) {
    return {
      success: true,
      data: {
        spreadsheetUrl: DEFAULT_SPREADSHEET_URL,
        spreadsheetId: DEFAULT_SPREADSHEET_ID,
        webhookUrl: "",
        hasWebhook: false,
        hasSpreadsheet: true,
        scriptCode: getGoogleAppsScriptTemplate(DEFAULT_SPREADSHEET_ID),
      },
    };
  }

  const { data: rows, error } = await supabase
    .from("settings")
    .select("key, value")
    .in("key", ["google_sheet_url", "google_sheet_id", "google_sheet_webhook_url"]);

  if (error) {
    console.warn("[Google Sheets] Error reading settings from Supabase:", error.message);
  }

  const map: Record<string, string> = {};
  (rows || []).forEach((r: any) => {
    if (r.key && r.value) map[r.key] = r.value;
  });

  const spreadsheetUrl = map["google_sheet_url"] || DEFAULT_SPREADSHEET_URL;
  const spreadsheetId = map["google_sheet_id"] || DEFAULT_SPREADSHEET_ID;
  const webhookUrl = map["google_sheet_webhook_url"] || "";
  const hasWebhook = Boolean(webhookUrl && webhookUrl.startsWith("http"));

  return {
    success: true,
    data: {
      spreadsheetUrl,
      spreadsheetId,
      webhookUrl,
      hasWebhook,
      hasSpreadsheet: Boolean(spreadsheetUrl && spreadsheetUrl.startsWith("http")),
      scriptCode: getGoogleAppsScriptTemplate(spreadsheetId),
    },
  };
}

export async function updateGoogleSheetSettings(payload: { webhookUrl?: string; spreadsheetUrl?: string }) {
  const updates: Array<{ key: string; value: string; updated_at: string }> = [];
  const now = new Date().toISOString();

  let spreadsheetId = "";
  if (payload.spreadsheetUrl !== undefined) {
    const sUrl = payload.spreadsheetUrl.trim();
    updates.push({ key: "google_sheet_url", value: sUrl, updated_at: now });
    const match = sUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      spreadsheetId = match[1];
      updates.push({ key: "google_sheet_id", value: spreadsheetId, updated_at: now });
    }
  }

  if (payload.webhookUrl !== undefined) {
    updates.push({ key: "google_sheet_webhook_url", value: payload.webhookUrl.trim(), updated_at: now });
  }

  if (updates.length > 0 && isSupabaseConfigured) {
    const { error } = await supabase.from("settings").upsert(updates);
    if (error) throw error;
  }

  return getGoogleSheetSettings();
}

export async function callSheetWebhook(url: string, payload: any): Promise<{ success: boolean; data?: any; error?: string }> {
  if (!url || !url.startsWith("http")) {
    return { success: false, error: "Invalid webhook URL" };
  }

  const bodyStr = JSON.stringify(payload);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: bodyStr,
    });
    const text = await res.text();
    try {
      const json = JSON.parse(text);
      return { success: true, data: json };
    } catch {
      return { success: res.ok, data: text };
    }
  } catch (err: any) {
    try {
      // Fallback for environments with strict browser cross-origin redirect protections
      await fetch(url, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: bodyStr,
      });
      return { success: true, data: { status: "dispatched" } };
    } catch (fallbackErr: any) {
      console.warn("[Google Sheets Webhook Error]", fallbackErr);
      return { success: false, error: fallbackErr?.message || err?.message };
    }
  }
}

export async function syncSingleRegistrationToGoogleSheet(event: any, reg: any) {
  const cfg = await getGoogleSheetSettings();
  const targetUrl = (event?.webhook_url && typeof event.webhook_url === "string" && event.webhook_url.startsWith("http"))
    ? event.webhook_url
    : cfg.data?.webhookUrl;

  if (!targetUrl || !targetUrl.startsWith("http")) return null;

  const sheetName = getSafeSheetName(event?.title);
  const registrationCode = reg.registrationCode || (reg.id ? `AIF-${event?.id}-${reg.id}` : `AIF-${event?.id}`);

  let formattedDate = "";
  try {
    const d = new Date(reg.created_at || Date.now());
    formattedDate = d.toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    formattedDate = reg.created_at || new Date().toISOString();
  }

  return callSheetWebhook(targetUrl, {
    action: "add_registration",
    sheetName,
    eventId: event?.id,
    registrationId: registrationCode,
    teamName: String(reg.team_name || reg.teamName || "").trim(),
    member1: String(reg.member1 || reg.name || "").trim(),
    member2: String(reg.member2 || "").trim(),
    name: String(reg.member1 || reg.name || "").trim(),
    email: String(reg.email || "").trim().toLowerCase(),
    member2Email: String(reg.member2_phone || reg.member2Phone || reg.member2Email || "").trim().toLowerCase(),
    department: String(reg.department || reg.college || "").trim(),
    year: String(reg.year || "").trim(),
    notes: String(reg.notes || "").trim(),
    timestamp: formattedDate,
  });
}

export async function syncEventToGoogleSheet(eventId: number | string) {
  const numericId = await resolveNumericEventId(eventId);
  const { data: event, error: evErr } = await supabase.from("events").select("*").eq("id", numericId).single();
  if (evErr || !event) throw new Error("Event not found");

  const cfg = await getGoogleSheetSettings();
  const targetUrl = (event.webhook_url && typeof event.webhook_url === "string" && event.webhook_url.startsWith("http"))
    ? event.webhook_url
    : cfg.data?.webhookUrl;

  if (!targetUrl || !targetUrl.startsWith("http")) {
    throw new Error("No Google Sheets webhook URL configured. Please paste your Google Apps Script Web App URL first.");
  }

  const sheetName = getSafeSheetName(event.title);

  // 1. Create or verify tab exists
  await callSheetWebhook(targetUrl, {
    action: "create_event_sheet",
    sheetName,
    eventId: event.id,
    date: event.date,
    venue: event.venue,
    capacity: event.capacity,
  });

  // 2. Fetch all registrations for this event
  const { data: regs, error: regErr } = await supabase
    .from("event_registrations")
    .select("*")
    .eq("event_id", numericId)
    .order("id", { ascending: true });

  if (regErr) throw regErr;

  let count = 0;
  for (const reg of regs || []) {
    const regCode = `AIF-${numericId}-${reg.id}`;
    let formattedDate = "";
    try {
      formattedDate = new Date(reg.created_at || Date.now()).toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      });
    } catch {
      formattedDate = reg.created_at || "";
    }

    await callSheetWebhook(targetUrl, {
      action: "add_registration",
      sheetName,
      eventId: event.id,
      registrationId: regCode,
      teamName: String(reg.team_name || reg.name || "").trim(),
      member1: String(reg.member1 || reg.name || "").trim(),
      member2: String(reg.member2 || "").trim(),
      name: String(reg.member1 || reg.name || "").trim(),
      email: String(reg.email || "").trim().toLowerCase(),
      member2Email: String(reg.member2_phone || "").trim().toLowerCase(),
      department: String(reg.department || reg.college || "").trim(),
      year: String(reg.year || "").trim(),
      notes: String(reg.notes || "").trim(),
      timestamp: formattedDate,
    });
    count++;
  }

  return {
    success: true,
    message: `Synced ${count} registration${count === 1 ? "" : "s"} for "${event.title}" to Google Sheets!`,
    syncedCount: count,
  };
}

export async function syncAllToGoogleSheets() {
  const cfg = await getGoogleSheetSettings();
  const globalWebhook = cfg.data?.webhookUrl;
  if (!globalWebhook || !globalWebhook.startsWith("http")) {
    throw new Error("No Google Sheets webhook URL configured. Please paste your Google Apps Script Web App URL first.");
  }

  const { data: events, error: evErr } = await supabase.from("events").select("*").order("date", { ascending: true });
  if (evErr) throw evErr;

  let totalEvents = 0;
  for (const ev of events || []) {
    await syncEventToGoogleSheet(ev.id);
    totalEvents++;
  }

  return {
    success: true,
    message: `Successfully synced ${totalEvents} event${totalEvents === 1 ? "" : "s"} and all participant responses to Google Sheets.`,
    eventsProcessed: totalEvents,
  };
}
