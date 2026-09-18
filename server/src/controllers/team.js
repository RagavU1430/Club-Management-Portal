import { db, rowToJSON } from "../config/db.js";
import { ApiError } from "../utils/http.js";
import { saveTeamMemberToFirestore, deleteTeamMemberFromFirestore, clearAllTeamFromFirestore } from "../services/firestoreService.js";

const FIELDS = ["name", "role", "department", "photo", "email", "phone", "linkedin", "github", "bio", "order", "active"];

function pickBody(body = {}) {
  const out = {};
  for (const k of FIELDS) if (body[k] !== undefined) out[k] = body[k];
  return out;
}

function decorate(member) {
  const json = rowToJSON(member);
  json.id = json.id;
  return json;
}

// ── GET /api/team ──
export async function list(req, res) {
  const { q = "", role = "" } = req.query;
  let all = db.prepare("SELECT * FROM team_members WHERE active = 1 ORDER BY \"order\", name").all();
  if (role) all = all.filter(m => m.role.toLowerCase() === role.toLowerCase());
  if (q) { const rx = q.toLowerCase(); all = all.filter(m => `${m.name} ${m.role} ${m.bio} ${m.department}`.toLowerCase().includes(rx)); }
  res.json({ success: true, data: all.map(decorate) });
}

// ── GET /api/team/roles ──
export async function roles(req, res) {
  const all = db.prepare("SELECT DISTINCT role FROM team_members WHERE active = 1").all();
  res.json({ success: true, data: all.map(r => r.role).filter(Boolean).sort() });
}

// ── POST /api/team ──
export async function create(req, res) {
  const raw = pickBody(req.body);
  if (!raw.name || !raw.role) throw new ApiError(400, "Name and role are required.");
  const payload = {
    name: String(raw.name).trim(),
    role: String(raw.role || "Coordinator").trim(),
    department: raw.department ? String(raw.department).trim() : "Artificial Intelligence & Data Science",
    photo: raw.photo ? String(raw.photo).trim() : "",
    email: raw.email ? String(raw.email).trim() : "",
    phone: raw.phone ? String(raw.phone).trim() : "",
    linkedin: raw.linkedin ? String(raw.linkedin).trim() : "",
    github: raw.github ? String(raw.github).trim() : "",
    bio: raw.bio ? String(raw.bio).trim() : "",
    order: Number(raw.order) || 0,
    active: raw.active !== undefined ? (raw.active ? 1 : 0) : 1,
  };
  const result = db.prepare(`INSERT INTO team_members (name, role, department, photo, email, phone, linkedin, github, bio, "order", active) VALUES (@name, @role, @department, @photo, @email, @phone, @linkedin, @github, @bio, @order, @active)`).run(payload);
  const created = decorate(db.prepare("SELECT * FROM team_members WHERE id = ?").get(result.lastInsertRowid));
  saveTeamMemberToFirestore(created, created.id).catch(err => console.warn("[Firestore] save team member failed:", err.message));
  res.status(201).json({ success: true, data: created });
}

// ── PUT /api/team/:id ──
export async function update(req, res) {
  const id = Number(req.params.id);
  const existing = db.prepare("SELECT * FROM team_members WHERE id = ?").get(id);
  if (!existing) throw new ApiError(404, "That team member doesn't exist.");
  const body = pickBody(req.body);
  const entries = Object.entries(body);
  if (entries.length === 0) {
    return res.json({ success: true, data: decorate(existing) });
  }
  const set = entries.map(([k]) => `"${k}" = ?`).join(", ");
  const vals = entries.map(([, v]) => v ?? "");
  vals.push(id);
  db.prepare(`UPDATE team_members SET ${set} WHERE id = ?`).run(...vals);
  const updated = decorate(db.prepare("SELECT * FROM team_members WHERE id = ?").get(id));
  saveTeamMemberToFirestore(updated, id).catch(err => console.warn("[Firestore] update team member failed:", err.message));
  res.json({ success: true, data: updated });
}

// ── DELETE /api/team/:id ──
export async function remove(req, res) {
  const id = Number(req.params.id);
  if (!db.prepare("SELECT id FROM team_members WHERE id = ?").get(id)) throw new ApiError(404, "That team member doesn't exist.");
  db.prepare("DELETE FROM team_members WHERE id = ?").run(id);
  deleteTeamMemberFromFirestore(id).catch(err => console.warn("[Firestore] delete team member failed:", err.message));
  res.json({ success: true, data: { id, deleted: true } });
}

// ── DELETE /api/team (Clear All) ──
export async function clearAll(req, res) {
  const result = db.prepare("DELETE FROM team_members").run();
  clearAllTeamFromFirestore().catch(err => console.warn("[Firestore] clear team failed:", err.message));
  res.json({ success: true, deleted: result.changes, message: "All coordinators cleared successfully." });
}

