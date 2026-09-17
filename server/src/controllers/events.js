import { db, rowToJSON } from "../config/db.js";
import { ApiError } from "../utils/http.js";
import { createEventSheet, recordRegistration } from "../services/googleSheets.js";
import { sendAutomatedMobileInvitation } from "../services/messenger.js";
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
  res.json({ success: true, data: decorate(db.prepare("SELECT * FROM events WHERE id = ?").get(id)) });
}

// ── DELETE /api/events/:id ──
export async function remove(req, res) {
  const id = Number(req.params.id);
  if (!db.prepare("SELECT id FROM events WHERE id = ?").get(id)) throw new ApiError(404, "That event doesn't exist.");
  db.prepare("DELETE FROM events WHERE id = ?").run(id);
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

  const {
    teamName = "",
    member1 = "",
    member2 = "",
    name = "",
    email,
    phone = "",
    member2Phone = "",
    member2_phone = "",
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

  if (!leadName) throw new ApiError(400, "Member 1 (or Full Name) is required.");
  if (!email || !email.trim() || !email.includes("@")) throw new ApiError(400, "Valid Email address is required.");

  // Check if already registered
  const existing = db.prepare("SELECT id FROM event_registrations WHERE event_id = ? AND LOWER(email) = ?").get(eventId, email.trim().toLowerCase());
  if (existing) {
    return res.json({
      success: true,
      message: "You are already registered for this event!",
      data: { registrationId: `AIF-${eventId}-${existing.id}`, alreadyRegistered: true }
    });
  }

  // Insert registration response with both phone numbers
  const result = db.prepare(`
    INSERT INTO event_registrations (event_id, team_name, member1, member2, name, email, phone, member2_phone, college, roll_number, year, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(eventId, tName, m1, m2, leadName, email.trim().toLowerCase(), p1, p2, college.trim(), rollNumber.trim(), year.trim(), notes.trim());

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
    college: college.trim(),
    rollNumber: rollNumber.trim(),
    year: year.trim(),
    notes: notes.trim(),
    created_at: new Date().toISOString()
  };

  // Automatically record response row into connected Google Sheet
  recordRegistration(event, regRecord).catch(err => console.warn("[googleSheets] record row failed:", err.message));

  // Automatically dispatch mobile invitation & confirmation message to both participants
  const msgResult = await sendAutomatedMobileInvitation({ event, registration: regRecord });

  res.status(201).json({
    success: true,
    message: "Registration successful! Automated mobile invitation dispatched.",
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
      eventTitle: event.title,
      eventDate: event.date,
      venue: event.venue,
      invitationMessage: msgResult.message,
      member1WhatsappUrl: msgResult.member1WhatsappUrl,
      member2WhatsappUrl: msgResult.member2WhatsappUrl
    }
  });
}

// ── GET /api/events/:id/registrations (Admin Responses List) ──
export async function getEventRegistrations(req, res) {
  const eventId = Number(req.params.id);
  const event = db.prepare("SELECT id, title, date, venue FROM events WHERE id = ?").get(eventId);
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
      "Member 1 Phone": r.phone ? String(r.phone).trim() : "",
      "Member 2": r.member2 || "",
      "Member 2 Phone": r.member2_phone ? String(r.member2_phone).trim() : "",
      "Email Address": r.email || "",
      "Institution / College": r.college || "",
      "Roll Number": r.roll_number ? String(r.roll_number).trim() : "",
      "Year / Department": r.year || "",
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
    { wch: 20 }, // Member 1 Phone
    { wch: 24 }, // Member 2
    { wch: 20 }, // Member 2 Phone
    { wch: 30 }, // Email Address
    { wch: 28 }, // College
    { wch: 18 }, // Roll Number
    { wch: 20 }, // Year
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
    "Member 1 Phone",
    "Member 2",
    "Member 2 Phone",
    "Email Address",
    "Institution / College",
    "Roll Number",
    "Year / Department",
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
      r.phone || "",
      r.member2 || "",
      r.member2_phone || "",
      r.email,
      r.college || "",
      r.roll_number || "",
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
