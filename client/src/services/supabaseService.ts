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

export async function signInAdmin(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user || !data.session) throw new Error(error?.message || "Invalid email or password.");
  return {
    id: data.user.id,
    email: data.user.email || email,
    name: String(data.user.user_metadata?.name || data.user.email || "Administrator"),
    role: String(data.user.user_metadata?.role || "admin"),
    token: data.session.access_token,
  };
}

export async function getAdminUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("Not logged in.");
  return {
    id: data.user.id,
    email: data.user.email || "",
    name: String(data.user.user_metadata?.name || data.user.email || "Administrator"),
    role: String(data.user.user_metadata?.role || "admin"),
  };
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

function slugify(input = ""): string {
  return String(input)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function createEvent(eventData: Record<string, any>) {
  if (!eventData.title || !String(eventData.title).trim()) {
    throw new Error("Event title is required.");
  }
  if (!eventData.date) {
    throw new Error("Event date is required.");
  }

  // Generate unique slug
  let baseSlug =
    (eventData.slug && String(eventData.slug).trim()) ||
    slugify(eventData.title) ||
    `event-${Date.now()}`;
  let slug = baseSlug;
  let counter = 2;

  try {
    while (true) {
      const { data: existing } = await supabase
        .from("events")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();
      if (!existing) break;
      slug = `${baseSlug}-${counter++}`;
    }
  } catch {
    slug = `${baseSlug}-${Date.now().toString(36)}`;
  }

  let isoDate: string;
  try {
    isoDate = new Date(eventData.date).toISOString();
  } catch {
    isoDate = String(eventData.date);
  }

  let isoEndDate: string | null = null;
  const rawEndDate = eventData.endDate !== undefined ? eventData.endDate : eventData.end_date;
  if (rawEndDate) {
    try {
      isoEndDate = new Date(rawEndDate).toISOString();
    } catch {
      isoEndDate = String(rawEndDate);
    }
  }

  let tags = Array.isArray(eventData.tags) ? [...eventData.tags] : parseTags(eventData.tags);
  if (eventData.category && typeof eventData.category === "string" && !tags.includes(eventData.category)) {
    tags.unshift(eventData.category);
  }

  const rawWebhook = eventData.webhookUrl !== undefined ? eventData.webhookUrl : eventData.webhook_url;
  const rawReg = eventData.registrationLink !== undefined ? eventData.registrationLink : eventData.registration_link;

  const payload: Record<string, any> = {
    title: String(eventData.title).trim(),
    slug,
    date: isoDate,
    end_date: isoEndDate,
    venue: String(eventData.venue || "").trim(),
    description: String(eventData.description || "").trim(),
    summary: String(eventData.summary || "").trim(),
    image: String(eventData.image || "").trim(),
    registration_link: String(rawReg || "").trim(),
    tags,
    status: String(eventData.status || "published").trim(),
    featured: eventData.featured ? 1 : 0,
    capacity: Number(eventData.capacity) || 0,
    webhook_url: String(rawWebhook || "").trim(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase.from("events").insert(payload).select().single();
  if (error) {
    console.error("[Supabase createEvent Error]", error);
    throw new Error(error.message || "Failed to create event in Supabase.");
  }

  // Optionally trigger Google Sheet tab creation if webhook configured
  try {
    const cfg = await getGoogleSheetSettings();
    const targetUrl = payload.webhook_url || cfg.data?.webhookUrl;
    if (targetUrl && targetUrl.startsWith("http")) {
      callSheetWebhook(targetUrl, {
        action: "create_event_sheet",
        sheetName: getSafeSheetName(data.title),
        eventTitle: data.title,
        eventId: data.id,
      }).catch((e) => console.warn("[GoogleSheet Event Creation Tab]", e));
    }
  } catch {}

  return {
    success: true,
    data: {
      ...data,
      tags: parseTags(data.tags),
      registrationCount: 0,
      registration_count: 0,
      webhookUrl: data.webhook_url || "",
      registrationLink: data.registration_link || "",
      endDate: data.end_date || null,
    },
  };
}

export async function updateEvent(id: number, eventData: Record<string, any>) {
  const payload: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (eventData.title !== undefined) payload.title = String(eventData.title).trim();
  if (eventData.venue !== undefined) payload.venue = String(eventData.venue).trim();
  if (eventData.description !== undefined) payload.description = String(eventData.description).trim();
  if (eventData.summary !== undefined) payload.summary = String(eventData.summary).trim();
  if (eventData.image !== undefined) payload.image = String(eventData.image).trim();
  if (eventData.status !== undefined) payload.status = String(eventData.status).trim();
  if (eventData.capacity !== undefined) payload.capacity = Number(eventData.capacity) || 0;
  if (eventData.featured !== undefined) payload.featured = eventData.featured ? 1 : 0;

  if (eventData.date) {
    try {
      payload.date = new Date(eventData.date).toISOString();
    } catch {
      payload.date = String(eventData.date);
    }
  }

  const rawEndDate = eventData.endDate !== undefined ? eventData.endDate : eventData.end_date;
  if (rawEndDate) {
    try {
      payload.end_date = new Date(rawEndDate).toISOString();
    } catch {
      payload.end_date = String(rawEndDate);
    }
  } else if (rawEndDate === null || rawEndDate === "") {
    payload.end_date = null;
  }

  const rawReg = eventData.registrationLink !== undefined ? eventData.registrationLink : eventData.registration_link;
  if (rawReg !== undefined) payload.registration_link = String(rawReg).trim();

  const rawWebhook = eventData.webhookUrl !== undefined ? eventData.webhookUrl : eventData.webhook_url;
  if (rawWebhook !== undefined) payload.webhook_url = String(rawWebhook).trim();

  if (eventData.tags !== undefined) {
    let tags = Array.isArray(eventData.tags) ? [...eventData.tags] : parseTags(eventData.tags);
    if (eventData.category && typeof eventData.category === "string" && !tags.includes(eventData.category)) {
      tags.unshift(eventData.category);
    }
    payload.tags = tags;
  }

  const { data, error } = await supabase.from("events").update(payload).eq("id", id).select().single();
  if (error) {
    console.error("[Supabase updateEvent Error]", error);
    throw new Error(error.message || "Failed to update event in Supabase.");
  }
  return {
    success: true,
    data: {
      ...data,
      tags: parseTags(data.tags),
      webhookUrl: data.webhook_url || "",
      registrationLink: data.registration_link || "",
      endDate: data.end_date || null,
    },
  };
}

export async function deleteEvent(id: number) {
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) {
    console.error("[Supabase deleteEvent Error]", error);
    throw new Error(error.message || "Failed to delete event in Supabase.");
  }
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
  const payload: Record<string, any> = {
    name: String(memberData.name || "").trim(),
    role: String(memberData.role || "").trim(),
    department: String(memberData.department || "").trim(),
    photo: String(memberData.photo || "").trim(),
    email: String(memberData.email || "").trim(),
    phone: String(memberData.phone || "").trim(),
    linkedin: String(memberData.linkedin || "").trim(),
    github: String(memberData.github || "").trim(),
    bio: String(memberData.bio || "").trim(),
    order: typeof memberData.order === "number" ? memberData.order : Number(memberData.order) || 0,
    active: memberData.active !== undefined ? (memberData.active ? 1 : 0) : 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase.from("team_members").insert(payload).select().single();
  if (error) {
    console.error("[Supabase createTeamMember Error]", error);
    throw new Error(error.message || "Failed to create coordinator in Supabase.");
  }
  return { success: true, data };
}

export async function updateTeamMember(id: number, memberData: Partial<TeamMember>) {
  const payload: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };
  if (memberData.name !== undefined) payload.name = String(memberData.name).trim();
  if (memberData.role !== undefined) payload.role = String(memberData.role).trim();
  if (memberData.department !== undefined) payload.department = String(memberData.department).trim();
  if (memberData.photo !== undefined) payload.photo = String(memberData.photo).trim();
  if (memberData.email !== undefined) payload.email = String(memberData.email).trim();
  if (memberData.phone !== undefined) payload.phone = String(memberData.phone).trim();
  if (memberData.linkedin !== undefined) payload.linkedin = String(memberData.linkedin).trim();
  if (memberData.github !== undefined) payload.github = String(memberData.github).trim();
  if (memberData.bio !== undefined) payload.bio = String(memberData.bio).trim();
  if (memberData.order !== undefined) payload.order = Number(memberData.order) || 0;
  if (memberData.active !== undefined) payload.active = memberData.active ? 1 : 0;

  const { data, error } = await supabase.from("team_members").update(payload).eq("id", id).select().single();
  if (error) {
    console.error("[Supabase updateTeamMember Error]", error);
    throw new Error(error.message || "Failed to update coordinator in Supabase.");
  }
  return { success: true, data };
}

export async function deleteTeamMember(id: number) {
  const { error } = await supabase.from("team_members").delete().eq("id", id);
  if (error) {
    console.error("[Supabase deleteTeamMember Error]", error);
    throw new Error(error.message || "Failed to delete coordinator in Supabase.");
  }
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
  member2Email?: string;
  member2_email?: string;
  member2RollNumber?: string;
  member2_roll_number?: string;
  department?: string;
  section?: string;
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
    const recipientEmails = [existing.email, existing.member2_email].filter(
      (e) => e && e.includes("@")
    );
    if (recipientEmails.length > 0) {
      try {
        fetch("/api/send-confirmation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: recipientEmails,
            email: existing.email,
            member2Email: existing.member2_email,
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
        }).catch(() => {});
      } catch {}
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
    section: String(input.section || "").trim(),
    member2_email: String(input.member2Email || input.member2_email || "").trim().toLowerCase(),
    member2_roll_number: String(input.member2RollNumber || input.member2_roll_number || "").trim(),
    year: String(input.year || "").trim(),
    notes: String(input.notes || "").trim(),
    attended: 0,
    created_at: new Date().toISOString(),
  };

  let insertedData: any = null;
  const { data, error } = await supabase.from("event_registrations").insert(payload).select().single();

  if (error) {
    console.warn("[Register Fallback] Full payload insert failed:", error.message, "- Retrying with core schema...");
    const extraDetails = [
      input.section ? `Section: ${input.section}` : null,
      (input.member2Email || input.member2_email) ? `Member 2 Email: ${input.member2Email || input.member2_email}` : null,
      (input.member2RollNumber || input.member2_roll_number) ? `Member 2 Roll: ${input.member2RollNumber || input.member2_roll_number}` : null,
      input.notes ? input.notes : null,
    ].filter(Boolean).join(" | ");

    const corePayload = {
      event_id: numericId,
      team_name: (input.teamName || "").trim(),
      member1: (input.member1 || "").trim(),
      member2: (input.member2 || "").trim(),
      name: (input.member1 || "").trim(),
      email: cleanEmail,
      phone: String(input.phone || "").trim(),
      member2_phone: String(input.member2Phone || input.member2_phone || "").trim(),
      member2_email: String(input.member2Email || input.member2_email || "").trim().toLowerCase(),
      member2_roll_number: String(input.member2RollNumber || input.member2_roll_number || "").trim(),
      department: String(input.department || input.college || "AI & Data Science").trim(),
      college: String(input.college || input.department || "AI & Data Science").trim(),
      roll_number: String(input.rollNumber || "").trim(),
      year: String(input.year || "").trim(),
      notes: extraDetails,
      attended: 0,
      created_at: new Date().toISOString(),
    };

    const fallbackRes = await supabase.from("event_registrations").insert(corePayload).select().single();
    if (fallbackRes.error) {
      console.error("[Register Error]", fallbackRes.error);
      throw fallbackRes.error;
    }
    insertedData = fallbackRes.data;
  } else {
    insertedData = data;
  }

  const regCode = `AIF-${numericId}-${insertedData.id}`;

  // Trigger official confirmation email via serverless dispatcher (background non-blocking)
  const recipientEmails = [payload.email, payload.member2_email].filter(
    (e) => e && e.includes("@")
  );
  if (recipientEmails.length > 0) {
    try {
      fetch("/api/send-confirmation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: recipientEmails,
          email: payload.email,
          member2Email: payload.member2_email,
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
      }).catch(() => {});
    } catch {}
  }

  // Google Sheets automatic real-time live sync (background non-blocking)
  syncSingleRegistrationToGoogleSheet(event, {
    ...payload,
    id: insertedData.id,
    registrationCode: regCode,
  }).catch((err) => console.warn("[Google Sheets Live Sync]", err?.message));

  return {
    success: true,
    message: `Registration confirmed for ${event.title}!`,
    data: {
      id: insertedData.id,
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

export async function lookupTicket(identifier: string, eventId?: number | string) {
  const clean = String(identifier || "").trim().toLowerCase();
  if (!clean) throw new Error("Please enter your Registration ID or Email Address.");

  let numericEventId: number | null = null;
  if (eventId !== undefined && eventId !== null && String(eventId).trim() !== "") {
    try {
      numericEventId = await resolveNumericEventId(eventId);
    } catch {
      numericEventId = null;
    }
  }

  let rawList: any[] = [];
  let rpcSuccess = false;

  // 1. Try RPC function if present in Supabase
  try {
    const { data, error } = await supabase.rpc("lookup_registration_tickets", {
      lookup_identifier: clean,
      target_event_id: numericEventId,
    });
    if (!error && Array.isArray(data) && data.length > 0) {
      rawList = data;
      rpcSuccess = true;
    }
  } catch {
    // Ignore RPC failure and proceed with direct query fallback
  }

  // 2. Direct Supabase query fallback (handles case where RPC is missing from schema cache)
  if (!rpcSuccess) {
    const aifMatch = clean.match(/^aif-(?:\d+-)?(\d+)$/i);

    const queryRegistrations = async (targetId: number | null) => {
      let q = supabase
        .from("event_registrations")
        .select("*, events(id, title, date, venue)");

      if (targetId) {
        q = q.eq("event_id", targetId);
      }

      if (aifMatch) {
        q = q.eq("id", Number(aifMatch[1]));
      } else {
        q = q.or(`email.ilike.${clean},member2_email.ilike.${clean},roll_number.ilike.${clean},phone.ilike.${clean}`);
      }

      const { data, error } = await q.order("created_at", { ascending: false });
      if (error) {
        console.warn("[lookupTicket direct query warning]", error.message);
        return [];
      }
      return data || [];
    };

    if (numericEventId) {
      rawList = await queryRegistrations(numericEventId);
      // If none found for specific event, also look across all events
      if (rawList.length === 0) {
        rawList = await queryRegistrations(null);
      }
    } else {
      rawList = await queryRegistrations(null);
    }
  }

  const tickets = (rawList || []).map((r: any) => ({
    id: r.id,
    registrationId: `AIF-${r.event_id || numericEventId || ""}-${r.id}`,
    teamName: r.team_name || r.teamName || "Team",
    team_name: r.team_name || r.teamName || "Team",
    member1: r.member1 || r.name || "",
    member2: r.member2 || "",
    name: r.name || r.member1 || "",
    email: r.email || "",
    phone: r.phone || "",
    member2Phone: r.member2_phone || "",
    member2Email: r.member2_email || "",
    member2_email: r.member2_email || "",
    department: r.department || r.college || "",
    college: r.college || r.department || "",
    rollNumber: r.roll_number || r.rollNumber || "",
    roll_number: r.roll_number || r.rollNumber || "",
    member2RollNumber: r.member2_roll_number || r.member2RollNumber || "",
    member2_roll_number: r.member2_roll_number || r.member2RollNumber || "",
    section: r.section || "",
    year: r.year || "",
    notes: r.notes || "",
    attended: Boolean(r.attended),
    checkedInAt: r.checked_in_at || "",
    checked_in_at: r.checked_in_at || "",
    event_id: r.event_id || numericEventId,
    eventId: r.event_id || numericEventId,
    eventTitle: r.event_title || r.events?.title || "AI Frontier Club Event",
    eventDate: r.event_date || r.events?.date,
    venue: r.event_venue || r.events?.venue,
    registeredAt: r.created_at,
  }));

  return {
    success: true,
    found: tickets.length > 0,
    count: tickets.length,
    data: tickets,
    tickets,
    message: tickets.length > 0
      ? `Found ${tickets.length} registration ticket(s)!`
      : `No registered tickets found for "${clean}".`,
  };
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
  throw new Error("Event not found.");
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

  const list = (data || []).map((r) => ({
    ...r,
    registrationCode: `AIF-${numericId}-${r.id}`,
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
// 4b. EVENT GAMES
// ─────────────────────────────────────────────────────────────

export interface GameRecord {
  id: number;
  title: string;
  description?: string;
  game_url?: string;
  event_id?: number | null;
  is_active?: number | boolean;
  order?: number;
  created_at?: string;
  updated_at?: string;
}

export async function getGames(scope?: string) {
  if (!isSupabaseConfigured) return { success: true, data: [] };

  let query = supabase
    .from("games")
    .select("*")
    .order("order", { ascending: true })
    .order("id", { ascending: true });

  if (scope !== "all") {
    query = query.eq("is_active", 1);
  }

  const { data, error } = await query;
  if (error) throw error;
  return { success: true, data: data || [] };
}

export async function createGame(payload: Record<string, unknown>) {
  const { data, error } = await supabase.from("games").insert(payload).select().single();
  if (error) throw error;
  return { success: true, data };
}

export async function updateGame(id: number, payload: Record<string, unknown>) {
  const { data, error } = await supabase.from("games").update(payload).eq("id", id).select().single();
  if (error) throw error;
  return { success: true, data };
}

export async function deleteGame(id: number) {
  const { error } = await supabase.from("games").delete().eq("id", id);
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
