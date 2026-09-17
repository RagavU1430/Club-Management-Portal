import { db, rowToJSON } from "../config/db.js";
import { ApiError } from "../utils/http.js";
import { createEventSheet, recordRegistration } from "../services/googleSheets.js";
import { sendRegistrationEmail } from "../services/emailService.js";
import { saveEventToFirestore, deleteEventFromFirestore, saveRegistrationToFirestore } from "../services/firestoreService.js";
import XLSX from "xlsx";

function pickBody(body = {}) {
  const out = {};

  if (body.title !== undefined) out.title = String(body.title).trim();
  if (body.venue !== undefined) out.venue = String(body.venue).trim();
  if (body.description !== undefined) out.description = String(body.description).trim();
  if (body.summary !== undefined) out.summary = String(body.summary).trim();
  if (body.image !== undefined) out.image = String(body.image).trim();
  if (body.status !== undefined) out.status = String(body.status).trim();

  // date & end_date
  if (body.date) {
    try {
      out.date = new Date(body.date).toISOString();
    } catch {
      out.date = String(body.date);
    }
  }
  const rawEndDate = body.endDate !== undefined ? body.endDate : body.end_date;
  if (rawEndDate) {
    try {
      out.end_date = new Date(rawEndDate).toISOString();
    } catch {
      out.end_date = String(rawEndDate);
    }
  } else if (rawEndDate === null || rawEndDate === "") {
    out.end_date = null;
  }

  // registration_link
  const rawReg = body.registrationLink !== undefined ? body.registrationLink : body.registration_link;
  if (rawReg !== undefined) out.registration_link = String(rawReg).trim();

  // webhook_url
  const rawWebhook = body.webhookUrl !== undefined ? body.webhookUrl : body.webhook_url;
  if (rawWebhook !== undefined) out.webhook_url = String(rawWebhook).trim();

  // capacity & featured
  if (body.capacity !== undefined) out.capacity = Number(body.capacity) || 0;
  if (body.featured !== undefined) out.featured = body.featured ? 1 : 0;

  // tags MUST be stringified JSON for SQLite TEXT column
  if (body.tags !== undefined) {
    if (Array.isArray(body.tags)) {
      out.tags = JSON.stringify(body.tags.map(t => String(t).trim()).filter(Boolean));
    } else if (typeof body.tags === "string") {
      const arr = body.tags.split(",").map(t => t.trim()).filter(Boolean);
      out.tags = JSON.stringify(arr);
    } else {
      out.tags = "[]";
    }
  }

  return out;
}

function slugify(input = "") {
  return String(input).normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}

function csvCell(value) {
  let str = value === null || value === undefined ? "" : Array.isArray(value) ? value.join("; ") : String(value);
  // Neutralize CSV Formula Injection (=, +, -, @, tab)
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  return /[",\n\r]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

function isUpcoming(e) {
  const end = e.end_date ? new Date(e.end_date) : new Date(e.date);
  if (typeof e.date === "string" && !e.date.includes("T") && !e.date.includes(":") && !e.end_date) {
    end.setHours(23, 59, 59, 999);
  }
  return (e.status === "published" || !e.status) && end.getTime() >= Date.now();
}

function decorate(event) {
  const json = rowToJSON(event);
  json.id = json.id;
  json.computedStatus = isUpcoming(json) ? "upcoming" : "past";
  json.webhookUrl = json.webhook_url || "";
  json.registrationLink = json.registration_link || "";
  json.endDate = json.end_date || null;
  try {
    const regCount = db.prepare("SELECT COUNT(*) as count FROM event_registrations WHERE event_id = ?").get(event.id);
    json.registrationCount = regCount ? regCount.count : 0;
  } catch {
    json.registrationCount = 0;
  }
  return json;
}

// ── GET /api/events ──
export async function list(req, res) {
  const { scope = "all", q = "", tag = "", page = 1, limit = 50 } = req.query;
  const lim = Math.min(Number(limit), 100);
  const pg = Math.max(Number(page), 1);
  let all = db.prepare("SELECT * FROM events ORDER BY date DESC").all();
  if (scope === "upcoming") {
    all = all.filter(isUpcoming).sort((a, b) => new Date(a.date) - new Date(b.date));
  } else if (scope === "past") {
    all = all.filter(e => e.status === "published" && !isUpcoming(e));
  }
  if (tag) all = all.filter(e => JSON.stringify(e.tags || []).includes(tag));
  if (q) { const rx = q.toLowerCase(); all = all.filter(e => `${e.title} ${e.description} ${e.venue}`.toLowerCase().includes(rx)); }
  const total = all.length;
  const items = all.slice((pg - 1) * lim, pg * lim);
  res.json({ success: true, data: items.map(decorate), meta: { total, page: pg, limit: lim, pages: Math.ceil(total / lim) } });
}

// ── GET /api/events/stats ──
export async function stats(req, res) {
  const all = db.prepare("SELECT * FROM events").all();
  const upcomingEvents = all.filter(isUpcoming).sort((a, b) => new Date(a.date) - new Date(b.date));
  const upcoming = upcomingEvents.length;
  const past = all.filter(e => e.status === "published" && !isUpcoming(e)).length;
  const next = upcomingEvents[0];
  res.json({ success: true, data: { upcoming, past, total: all.length, nextEvent: next ? { title: next.title, date: next.date, slug: next.slug } : null } });
}

// ── GET /api/events/:idOrSlug ──
export async function getOne(req, res) {
  const id = Number(req.params.idOrSlug);
  const event = db.prepare("SELECT * FROM events WHERE id = ? OR slug = ?").get(id, req.params.idOrSlug);
  if (!event) throw new ApiError(404, "That event doesn't exist.");
  res.json({ success: true, data: decorate(event) });
}

// ── POST /api/events ──
export async function create(req, res) {
  const body = pickBody(req.body);
  if (!body.title) throw new ApiError(400, "Title is required.");
  if (!body.date) throw new ApiError(400, "Event date is required.");
  let slug = body.slug || slugify(body.title) || `event-${Date.now()}`;
  let n = 2;
  while (db.prepare("SELECT id FROM events WHERE slug = ?").get(slug)) slug = `${slug}-${n++}`;
  body.slug = slug;
  const cols = Object.keys(body);
  const vals = Object.values(body);
  const placeholders = cols.map(() => "?").join(", ");
  const colNames = cols.join(", ");
  const result = db.prepare(`INSERT INTO events (${colNames}) VALUES (${placeholders})`).run(...vals);
  const row = db.prepare("SELECT * FROM events WHERE id = ?").get(result.lastInsertRowid);
  // Persist to Firebase Cloud Firestore
  saveEventToFirestore(row, row.id).catch(err => console.warn("[Firestore] save event failed:", err.message));
  // Automatically create a new tab in the connected Google Sheet
  createEventSheet(row).catch(err => console.warn("[googleSheets] create tab failed:", err.message));
  res.status(201).json({ success: true, data: decorate(row) });
}

// ── PUT /api/events/:id ──
export async function update(req, res) {
  const id = Number(req.params.id);
  const existing = db.prepare("SELECT * FROM events WHERE id = ?").get(id);
  if (!existing) throw new ApiError(404, "That event doesn't exist.");
  const body = pickBody(req.body);
  if (body.title && body.title !== existing.title) {
    let slug = body.slug || slugify(body.title) || `event-${Date.now()}`;
    let n = 2;
    while (db.prepare("SELECT id FROM events WHERE slug = ? AND id != ?").get(slug, id)) slug = `${slug}-${n++}`;
    body.slug = slug;
  }
  const entries = Object.entries(body).filter(([k]) => k !== "endDate");
  const set = entries.map(([k]) => `${k} = ?`).join(", ");
  const vals = entries.map(([, v]) => v);
  vals.push(id);
  db.prepare(`UPDATE events SET ${set} WHERE id = ?`).run(...vals);
  const updatedRow = db.prepare("SELECT * FROM events WHERE id = ?").get(id);
  saveEventToFirestore(updatedRow, id).catch(err => console.warn("[Firestore] update event failed:", err.message));
  res.json({ success: true, data: decorate(updatedRow) });
}

// ── DELETE /api/events/:id ──
export async function remove(req, res) {
  const id = Number(req.params.id);
  if (!db.prepare("SELECT id FROM events WHERE id = ?").get(id)) throw new ApiError(404, "That event doesn't exist.");
  db.prepare("DELETE FROM events WHERE id = ?").run(id);
  deleteEventFromFirestore(id).catch(err => console.warn("[Firestore] delete event failed:", err.message));
  res.json({ success: true, data: { id, deleted: true } });
}

// ── GET /api/events/export.csv ──
export async function exportCSV(req, res) {
  const all = db.prepare("SELECT * FROM events ORDER BY date DESC").all();
  const header = ["title", "date", "venue", "status", "registration_link", "tags"];
  const rows = all.map(e => [e.title, e.date || "", e.venue, e.status, e.registration_link, JSON.stringify(e.tags || [])].map(csvCell).join(","));
  res.type("text/csv").set("Content-Disposition", 'attachment; filename="events.csv"').send([header.join(","), ...rows].join("\n"));
}

// ── POST /api/events/:id/register (Public Registration Form) ──
export async function registerForEvent(req, res) {
  const eventId = Number(req.params.id);
  const event = db.prepare("SELECT * FROM events WHERE id = ?").get(eventId);
  if (!event) throw new ApiError(404, "Event not found.");

  // 1. Check Event Deadline (Past event check)
  if (event.date) {
    const eventTime = new Date(event.date).getTime();
    // Allow up to 1 day after event date before hard close
    if (!isNaN(eventTime) && eventTime < Date.now() - 86400000) {
      throw new ApiError(400, "Registrations for this event have closed because the event has already concluded.");
    }
  }

  // 2. Check Event Capacity Limits
  if (event.capacity && Number(event.capacity) > 0) {
    const currentCount = db.prepare("SELECT COUNT(*) as count FROM event_registrations WHERE event_id = ?").get(eventId)?.count || 0;
    if (currentCount >= Number(event.capacity)) {
      throw new ApiError(400, `Registration is closed. Maximum capacity (${event.capacity} seats) has been reached.`);
    }
  }

  const {
    teamName = "",
    member1 = "",
    member2 = "",
    name = "",
    email,
    phone = "",
    member2Phone = "",
    member2_phone = "",
    department = "",
    college = "",
    rollNumber = "",
    year = "",
    notes = ""
  } = req.body || {};

  const leadName = (member1 || name || "").trim();
  const m1 = leadName;
  const m2 = (member2 || "").trim();
  const tName = (teamName || "").trim();
  const p1 = String(phone || "").trim();
  const p2 = String(member2Phone || member2_phone || "").trim();
  const dept = String(department || college || "Artificial Intelligence and Data Science").trim();

  if (!leadName) throw new ApiError(400, "Member 1 (or Full Name) is required.");
  if (!email || !email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    throw new ApiError(400, "A valid email address is required (e.g. user@domain.edu).");
  }

  // 3. Check for Duplicate Registration
  const existing = db.prepare("SELECT id FROM event_registrations WHERE event_id = ? AND LOWER(email) = ?").get(eventId, email.trim().toLowerCase());
  if (existing) {
    return res.json({
      success: true,
      message: "You are already registered for this event!",
      data: { registrationId: `AIF-${eventId}-${existing.id}`, alreadyRegistered: true }
    });
  }

  // 4. Insert registration response
  const result = db.prepare(`
    INSERT INTO event_registrations (event_id, team_name, member1, member2, name, email, phone, member2_phone, department, college, roll_number, year, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(eventId, tName, m1, m2, leadName, email.trim().toLowerCase(), p1, p2, dept, dept, rollNumber.trim(), year.trim(), notes.trim());

  const regId = result.lastInsertRowid;
  const registrationCode = `AIF-${eventId}-${regId}`;

  const regRecord = {
    id: regId,
    registrationCode,
    teamName: tName,
    member1: m1,
    member2: m2,
    name: leadName,
    email: email.trim().toLowerCase(),
    phone: p1,
    member2_phone: p2,
    member2Email: p2,
    department: dept,
    college: dept,
    rollNumber: rollNumber.trim(),
    year: year.trim(),
    notes: notes.trim(),
    created_at: new Date().toISOString()
  };

  // 5. Asynchronous Integrations (Never block user response if external cloud is slow)
  saveRegistrationToFirestore(regRecord).catch(err => console.warn("[Firestore] async sync error:", err.message));
  recordRegistration(event, regRecord).catch(err => console.warn("[googleSheets] async sync error:", err.message));

  // 6. Automatically dispatch official registration confirmation email via Gmail
  const emailResult = await sendRegistrationEmail({ event, registration: regRecord });

  res.status(201).json({
    success: true,
    message: `Registration confirmed for ${event.title}! Official confirmation pass sent to ${regRecord.email}.`,
    data: {
      id: regId,
      registrationId: registrationCode,
      teamName: tName,
      member1: m1,
      member2: m2,
      name: leadName,
      email: email.trim().toLowerCase(),
      phone: p1,
      member2Phone: p2,
      department: dept,
      year: year.trim(),
      eventTitle: event.title,
      eventDate: event.date,
      venue: event.venue,
      emailResult,
      emailSent: emailResult.sent,
      emailSubject: emailResult.subject,
      emailText: emailResult.previewText,
      gmailUrl: `https://mail.google.com/mail/u/0/#search/${encodeURIComponent(event.title)}`,
    }
  });
}

// ── POST /api/events/lookup-ticket (Public Self-Service Ticket Lookup) ──
export async function lookupTicket(req, res) {
  const { email, eventId } = req.body || {};
  if (!email || !email.trim() || !email.includes("@")) {
    throw new ApiError(400, "Valid email address is required to look up registration passes.");
  }
  const cleanEmail = email.trim().toLowerCase();

  let sql = `
    SELECT r.*, e.title as event_title, e.date as event_date, e.venue as event_venue
    FROM event_registrations r
    JOIN events e ON r.event_id = e.id
    WHERE LOWER(r.email) = ? OR LOWER(r.member2_phone) = ?
  `;
  const params = [cleanEmail, cleanEmail];

  if (eventId) {
    sql += " AND r.event_id = ?";
    params.push(Number(eventId));
  }
  sql += " ORDER BY r.created_at DESC";

  const matches = db.prepare(sql).all(...params);
  if (!matches || matches.length === 0) {
    return res.json({
      success: true,
      found: false,
      message: `No registration passes found matching email "${cleanEmail}".`,
      data: []
    });
  }

  const tickets = matches.map(r => ({
    id: r.id,
    registrationId: `AIF-${r.event_id}-${r.id}`,
    teamName: r.team_name,
    member1: r.member1 || r.name,
    member2: r.member2,
    email: r.email,
    member2Email: r.member2_phone,
    department: r.department || r.college,
    year: r.year,
    eventTitle: r.event_title,
    eventDate: r.event_date,
    venue: r.event_venue,
    registeredAt: r.created_at,
  }));

  res.json({
    success: true,
    found: true,
    count: tickets.length,
    message: `Found ${tickets.length} registration ticket(s)!`,
    data: tickets,
  });
}

// ── GET /api/events/:id/registrations (Admin Responses List) ──
export async function getEventRegistrations(req, res) {
  const eventId = Number(req.params.id);
  const event = db.prepare("SELECT id, title, date FROM events WHERE id = ?").get(eventId);
  if (!event) throw new ApiError(404, "Event not found.");

  const list = db.prepare("SELECT * FROM event_registrations WHERE event_id = ? ORDER BY created_at DESC").all(eventId);
  res.json({
    success: true,
    data: list.map(r => ({
      ...rowToJSON(r),
      registrationCode: `AIF-${eventId}-${r.id}`
    })),
    event
  });
}

// ── GET /api/events/:id/registrations/export.xlsx (Genuine Microsoft Excel .xlsx Export) ──
export async function exportEventRegistrationsExcel(req, res) {
  const eventId = Number(req.params.id);
  const event = db.prepare("SELECT id, title, date FROM events WHERE id = ?").get(eventId);
  if (!event) throw new ApiError(404, "Event not found.");

  const registrations = db.prepare("SELECT * FROM event_registrations WHERE event_id = ? ORDER BY created_at ASC").all(eventId);

  const formattedRows = registrations.map(r => {
    let formattedDate = "";
    try {
      formattedDate = new Date(r.created_at).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      });
    } catch {
      formattedDate = r.created_at || "";
    }

    return {
      "Registration ID": `AIF-${eventId}-${r.id}`,
      "Team Name": r.team_name || "",
      "Member 1 (Lead)": r.member1 || r.name || "",
      "Lead Email": r.email || "",
      "Member 2": r.member2 || "",
      "Member 2 Email": r.member2_phone || r.member2Phone || "",
      "Department": r.department || r.college || "",
      "Year of Study": r.year || "",
      "Notes / Requirements": r.notes || "",
      "Registered At": formattedDate
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(formattedRows);

  // Set professional auto-fit column widths
  worksheet["!cols"] = [
    { wch: 18 }, // Registration ID
    { wch: 22 }, // Team Name
    { wch: 24 }, // Member 1
    { wch: 30 }, // Lead Email
    { wch: 24 }, // Member 2
    { wch: 30 }, // Member 2 Email
    { wch: 36 }, // Department
    { wch: 22 }, // Year
    { wch: 32 }, // Notes
    { wch: 24 }, // Registered At
  ];

  const workbook = XLSX.utils.book_new();
  const safeSheetName = (event.title || "Registrations").replace(/[:\\/?*\[\]]/g, "-").slice(0, 31);
  XLSX.utils.book_append_sheet(workbook, worksheet, safeSheetName);

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  const safeTitle = event.title.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 30);
  const filename = `${safeTitle}_Registrations_${new Date().toISOString().slice(0, 10)}.xlsx`;

  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(buffer);
}

// ── GET /api/events/:id/registrations/export.csv (Excel-Compatible CSV Export) ──
export async function exportEventRegistrationsCSV(req, res) {
  const eventId = Number(req.params.id);
  const event = db.prepare("SELECT id, title, date FROM events WHERE id = ?").get(eventId);
  if (!event) throw new ApiError(404, "Event not found.");

  const registrations = db.prepare("SELECT * FROM event_registrations WHERE event_id = ? ORDER BY created_at ASC").all(eventId);

  const header = [
    "Registration ID",
    "Team Name",
    "Member 1 (Lead)",
    "Lead Email",
    "Member 2",
    "Member 2 Email",
    "Department",
    "Year of Study",
    "Notes / Requirements",
    "Registration Timestamp"
  ];

  const rows = registrations.map(r => {
    let formattedDate = "";
    try {
      formattedDate = new Date(r.created_at).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      });
    } catch {
      formattedDate = r.created_at || "";
    }

    return [
      `AIF-${eventId}-${r.id}`,
      r.team_name || "",
      r.member1 || r.name || "",
      r.email || "",
      r.member2 || "",
      r.member2_phone || "",
      r.department || r.college || "",
      r.year || "",
      r.notes || "",
      formattedDate
    ].map(csvCell).join(",");
  });

  const safeTitle = event.title.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 30);
  const filename = `${safeTitle}_Registrations_${new Date().toISOString().slice(0, 10)}.csv`;

  // UTF-8 BOM (\uFEFF) ensures Excel automatically opens with proper UTF-8 column mapping
  const csvContent = "\uFEFF" + [header.join(","), ...rows].join("\r\n");

  res.type("text/csv; charset=utf-8")
     .set("Content-Disposition", `attachment; filename="${filename}"`)
     .send(csvContent);
}

// ── DELETE /api/events/:id/registrations/:regId (Remove Response) ──
export async function deleteEventRegistration(req, res) {
  const eventId = Number(req.params.id);
  const regId = Number(req.params.regId);
  db.prepare("DELETE FROM event_registrations WHERE id = ? AND event_id = ?").run(regId, eventId);
  res.json({ success: true, message: "Registration deleted." });
}

// ── GET /api/events/:id/attendance (Attendance Overview & List) ──
export async function getAttendance(req, res) {
  const eventId = Number(req.params.id);
  const event = db.prepare("SELECT id, title, date, venue, capacity FROM events WHERE id = ?").get(eventId);
  if (!event) throw new ApiError(404, "Event not found.");

  const list = db.prepare("SELECT * FROM event_registrations WHERE event_id = ? ORDER BY id ASC").all(eventId);
  const total = list.length;
  const present = list.filter(r => r.attended === 1).length;
  const absent = total - present;
  const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

  res.json({
    success: true,
    event,
    stats: { total, present, absent, percentage },
    data: list.map(r => ({
      ...rowToJSON(r),
      registrationCode: `AIF-${eventId}-${r.id}`,
      attended: Boolean(r.attended),
      checked_in_at: r.checked_in_at || ""
    }))
  });
}

// ── PATCH /api/events/:id/attendance/:regId (Toggle / Set Attendance) ──
export async function toggleAttendance(req, res) {
  const eventId = Number(req.params.id);
  const regId = Number(req.params.regId);
  const reg = db.prepare("SELECT * FROM event_registrations WHERE id = ? AND event_id = ?").get(regId, eventId);
  if (!reg) throw new ApiError(404, "Registration record not found.");

  const newStatus = req.body && req.body.attended !== undefined ? (req.body.attended ? 1 : 0) : (reg.attended === 1 ? 0 : 1);
  const checkInTime = newStatus === 1 ? new Date().toISOString() : "";

  db.prepare("UPDATE event_registrations SET attended = ?, checked_in_at = ? WHERE id = ? AND event_id = ?")
    .run(newStatus, checkInTime, regId, eventId);

  const updated = db.prepare("SELECT * FROM event_registrations WHERE id = ?").get(regId);
  res.json({
    success: true,
    message: newStatus === 1 ? "Attendee marked PRESENT." : "Attendee marked ABSENT.",
    data: {
      ...rowToJSON(updated),
      registrationCode: `AIF-${eventId}-${regId}`,
      attended: Boolean(newStatus),
      checked_in_at: checkInTime
    }
  });
}

// ── POST /api/events/:id/attendance/quick-checkin (Quick Check-In by Ticket Code / Email / Name) ──
export async function quickCheckIn(req, res) {
  const eventId = Number(req.params.id);
  const { query = "" } = req.body || {};
  const q = String(query).trim();
  if (!q) throw new ApiError(400, "Please provide a ticket code, email, or attendee name.");

  let regId = null;
  const codeMatch = q.match(/AIF-(\d+)-(\d+)/i);
  if (codeMatch && Number(codeMatch[1]) === eventId) {
    regId = Number(codeMatch[2]);
  } else if (/^\d+$/.test(q)) {
    regId = Number(q);
  }

  let record = null;
  if (regId) {
    record = db.prepare("SELECT * FROM event_registrations WHERE id = ? AND event_id = ?").get(regId, eventId);
  }

  if (!record) {
    record = db.prepare(`
      SELECT * FROM event_registrations 
      WHERE event_id = ? AND (
        LOWER(email) = LOWER(?) OR 
        LOWER(name) = LOWER(?) OR 
        LOWER(member1) = LOWER(?) OR 
        LOWER(member2) = LOWER(?) OR
        LOWER(team_name) = LOWER(?)
      ) LIMIT 1
    `).get(eventId, q, q, q, q, q);
  }

  if (!record) {
    throw new ApiError(404, `No registration found matching "${q}" for this event.`);
  }

  const checkInTime = new Date().toISOString();
  db.prepare("UPDATE event_registrations SET attended = 1, checked_in_at = ? WHERE id = ?")
    .run(checkInTime, record.id);

  const updated = db.prepare("SELECT * FROM event_registrations WHERE id = ?").get(record.id);
  res.json({
    success: true,
    message: `Check-in confirmed for ${updated.member1 || updated.name}!`,
    data: {
      ...rowToJSON(updated),
      registrationCode: `AIF-${eventId}-${updated.id}`,
      attended: true,
      checked_in_at: checkInTime
    }
  });
}

// ── POST /api/events/:id/attendance/bulk (Bulk Attendance Actions) ──
export async function bulkAttendance(req, res) {
  const eventId = Number(req.params.id);
  const { action = "mark_all_present" } = req.body || {};

  if (action === "mark_all_present") {
    const now = new Date().toISOString();
    db.prepare("UPDATE event_registrations SET attended = 1, checked_in_at = ? WHERE event_id = ?").run(now, eventId);
  } else if (action === "mark_all_absent") {
    db.prepare("UPDATE event_registrations SET attended = 0, checked_in_at = '' WHERE event_id = ?").run(eventId);
  } else {
    throw new ApiError(400, "Invalid bulk action.");
  }

  res.json({ success: true, message: `Bulk action "${action}" applied successfully.` });
}

// ── GET /api/events/:id/attendance/export.xlsx (Official Attendance Generator) ──
export async function exportAttendanceExcel(req, res) {
  const eventId = Number(req.params.id);
  const event = db.prepare("SELECT id, title, date, venue FROM events WHERE id = ?").get(eventId);
  if (!event) throw new ApiError(404, "Event not found.");

  const registrations = db.prepare("SELECT * FROM event_registrations WHERE event_id = ? ORDER BY id ASC").all(eventId);

  const formattedRows = registrations.map((r, idx) => {
    let checkInStr = "-";
    if (r.attended === 1 && r.checked_in_at) {
      try {
        checkInStr = new Date(r.checked_in_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
      } catch {
        checkInStr = r.checked_in_at;
      }
    }

    return {
      "S.No": idx + 1,
      "Ticket Code": `AIF-${eventId}-${r.id}`,
      "Team Name": r.team_name || "-",
      "Member 1 (Lead)": r.member1 || r.name || "",
      "Lead Email": r.email || "",
      "Member 2": r.member2 || "-",
      "Member 2 Email": r.member2_phone || "-",
      "Department": r.department || r.college || "",
      "Year of Study": r.year || "",
      "Attendance Status": r.attended === 1 ? "PRESENT" : "ABSENT",
      "Check-in Time": checkInStr,
      "Attendee Signature": ""
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(formattedRows);
  worksheet["!cols"] = [
    { wch: 6 },
    { wch: 16 },
    { wch: 22 },
    { wch: 24 },
    { wch: 28 },
    { wch: 24 },
    { wch: 28 },
    { wch: 34 },
    { wch: 16 },
    { wch: 20 },
    { wch: 16 },
    { wch: 24 }
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance Sheet");

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  const safeTitle = event.title.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 30);
  const filename = `${safeTitle}_Official_Attendance_${new Date().toISOString().slice(0, 10)}.xlsx`;

  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(buffer);
}

// ── GET /api/events/:id/attendance/export-od.xlsx (On-Duty Academic List Generator) ──
export async function exportODListExcel(req, res) {
  const eventId = Number(req.params.id);
  const event = db.prepare("SELECT id, title, date, venue FROM events WHERE id = ?").get(eventId);
  if (!event) throw new ApiError(404, "Event not found.");

  const presentRegistrations = db.prepare("SELECT * FROM event_registrations WHERE event_id = ? AND attended = 1 ORDER BY department ASC, id ASC").all(eventId);

  const formattedRows = presentRegistrations.map((r, idx) => ({
    "S.No": idx + 1,
    "Ticket Code": `AIF-${eventId}-${r.id}`,
    "Participant Name": r.member1 || r.name || "",
    "Email ID": r.email || "",
    "Team Name": r.team_name || "-",
    "Department": r.department || r.college || "",
    "Year of Study": r.year || "",
    "OD Status": "PRESENT / ELIGIBLE",
    "Faculty In-charge Sign": ""
  }));

  const worksheet = XLSX.utils.json_to_sheet(formattedRows);
  worksheet["!cols"] = [
    { wch: 6 },
    { wch: 18 },
    { wch: 26 },
    { wch: 30 },
    { wch: 22 },
    { wch: 36 },
    { wch: 14 },
    { wch: 22 },
    { wch: 24 }
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "OD Approval List");

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  const safeTitle = event.title.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 30);
  const filename = `${safeTitle}_OD_Approval_List_${new Date().toISOString().slice(0, 10)}.xlsx`;

  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(buffer);
}

