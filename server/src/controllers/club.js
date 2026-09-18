import { db, rowToJSON } from "../config/db.js";
import { ApiError } from "../utils/http.js";
import { saveClubDetailsToFirestore, saveActivityToFirestore, deleteActivityFromFirestore } from "../services/firestoreService.js";

// ── GET /api/club-details ──
export async function getClubDetails(_req, res) {
  const row = db.prepare("SELECT * FROM club_details WHERE id = 1").get();
  if (!row) {
    return res.json({
      success: true,
      data: {
        id: 1,
        name: "AI Frontier Club",
        department: "Artificial Intelligence & Data Science",
        tagline: "Where Artificial Intelligence Meets Legal Innovation",
        description: "",
        vision: "",
        mission: "",
        founded_year: "2021",
        email: "",
        phone: "",
        location: "",
        social_links: {},
      },
    });
  }
  res.json({ success: true, data: rowToJSON(row) });
}

// ── PUT /api/club-details ──
export async function updateClubDetails(req, res) {
  const body = req.body || {};
  const current = db.prepare("SELECT * FROM club_details WHERE id = 1").get();
  
  const payload = {
    name: body.name !== undefined ? String(body.name).trim() : (current?.name || "AI Frontier Club"),
    department: body.department !== undefined ? String(body.department).trim() : (current?.department || "Artificial Intelligence & Data Science"),
    tagline: body.tagline !== undefined ? String(body.tagline).trim() : (current?.tagline || ""),
    description: body.description !== undefined ? String(body.description).trim() : (current?.description || ""),
    vision: body.vision !== undefined ? String(body.vision).trim() : (current?.vision || ""),
    mission: body.mission !== undefined ? String(body.mission).trim() : (current?.mission || ""),
    founded_year: body.founded_year !== undefined ? String(body.founded_year).trim() : (current?.founded_year || "2021"),
    email: body.email !== undefined ? String(body.email).trim() : (current?.email || ""),
    phone: body.phone !== undefined ? String(body.phone).trim() : (current?.phone || ""),
    location: body.location !== undefined ? String(body.location).trim() : (current?.location || ""),
    social_links: typeof body.social_links === "object" ? JSON.stringify(body.social_links) : (body.social_links || "{}"),
  };

  if (!current) {
    db.prepare(`
      INSERT INTO club_details (id, name, department, tagline, description, vision, mission, founded_year, email, phone, location, social_links, updated_at)
      VALUES (1, @name, @department, @tagline, @description, @vision, @mission, @founded_year, @email, @phone, @location, @social_links, strftime('%Y-%m-%dT%H:%M:%S','now'))
    `).run(payload);
  } else {
    db.prepare(`
      UPDATE club_details SET
        name = @name,
        department = @department,
        tagline = @tagline,
        description = @description,
        vision = @vision,
        mission = @mission,
        founded_year = @founded_year,
        email = @email,
        phone = @phone,
        location = @location,
        social_links = @social_links,
        updated_at = strftime('%Y-%m-%dT%H:%M:%S','now')
      WHERE id = 1
    `).run(payload);
  }

  const updated = db.prepare("SELECT * FROM club_details WHERE id = 1").get();
  const formatted = rowToJSON(updated);
  saveClubDetailsToFirestore(formatted).catch(err => console.warn("[Firestore] save club details failed:", err.message));
  res.json({ success: true, data: formatted });
}

// ── GET /api/activities ──
export async function listActivities(_req, res) {
  const rows = db.prepare("SELECT * FROM club_activities ORDER BY date DESC, id DESC").all();
  res.json({ success: true, data: rows.map(rowToJSON) });
}

// ── POST /api/activities ──
export async function createActivity(req, res) {
  const body = req.body || {};
  if (!body.name) throw new ApiError(400, "Activity name is required.");

  const payload = {
    name: String(body.name).trim(),
    photo: body.photo ? String(body.photo).trim() : "",
    date: body.date ? String(body.date).trim() : new Date().toISOString().split("T")[0],
    category: body.category ? String(body.category).trim() : "Workshop",
    description: body.description ? String(body.description).trim() : "",
    order: Number(body.order) || 0,
  };

  const result = db.prepare(`
    INSERT INTO club_activities (name, photo, date, category, description, "order")
    VALUES (@name, @photo, @date, @category, @description, @order)
  `).run(payload);

  const inserted = rowToJSON(db.prepare("SELECT * FROM club_activities WHERE id = ?").get(result.lastInsertRowid));
  saveActivityToFirestore(inserted, inserted.id).catch(err => console.warn("[Firestore] save activity failed:", err.message));
  res.status(201).json({ success: true, data: inserted });
}

// ── PUT /api/activities/:id ──
export async function updateActivity(req, res) {
  const id = Number(req.params.id);
  const existing = db.prepare("SELECT * FROM club_activities WHERE id = ?").get(id);
  if (!existing) throw new ApiError(404, "Club activity not found.");

  const body = req.body || {};
  const fields = ["name", "photo", "date", "category", "description", "order"];
  const updates = [];
  const vals = [];

  for (const f of fields) {
    if (body[f] !== undefined) {
      updates.push(`"${f}" = ?`);
      vals.push(f === "order" ? Number(body[f]) || 0 : String(body[f]).trim());
    }
  }

  if (updates.length > 0) {
    updates.push("updated_at = strftime('%Y-%m-%dT%H:%M:%S','now')");
    vals.push(id);
    db.prepare(`UPDATE club_activities SET ${updates.join(", ")} WHERE id = ?`).run(...vals);
  }

  const updated = rowToJSON(db.prepare("SELECT * FROM club_activities WHERE id = ?").get(id));
  saveActivityToFirestore(updated, id).catch(err => console.warn("[Firestore] update activity failed:", err.message));
  res.json({ success: true, data: updated });
}

// ── DELETE /api/activities/:id ──
export async function deleteActivity(req, res) {
  const id = Number(req.params.id);
  const existing = db.prepare("SELECT id FROM club_activities WHERE id = ?").get(id);
  if (!existing) throw new ApiError(404, "Club activity not found.");

  db.prepare("DELETE FROM club_activities WHERE id = ?").run(id);
  deleteActivityFromFirestore(id).catch(err => console.warn("[Firestore] delete activity failed:", err.message));
  res.json({ success: true, message: "Activity deleted successfully." });
}
