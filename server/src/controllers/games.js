import { db, rowToJSON } from "../config/db.js";
import { ApiError } from "../utils/http.js";

function formatGame(row) {
  if (!row) return row;
  const g = rowToJSON(row);
  g.is_active = Number(g.is_active ?? 1);
  g.order = Number(g.order ?? 0);
  if (g.event_id !== null && g.event_id !== undefined) g.event_id = Number(g.event_id);
  return g;
}

// ── GET /api/games (?scope=all includes inactive; default active only) ──
export async function listGames(req, res) {
  const scope = String(req.query?.scope || "");
  const rows =
    scope === "all"
      ? db.prepare('SELECT * FROM games ORDER BY "order" ASC, id ASC').all()
      : db.prepare('SELECT * FROM games WHERE is_active = 1 ORDER BY "order" ASC, id ASC').all();
  res.json({ success: true, data: rows.map(formatGame) });
}

// ── POST /api/games (admin) ──
export async function createGame(req, res) {
  const body = req.body || {};
  if (!body.title || !String(body.title).trim()) throw new ApiError(400, "Game title is required.");
  if (!body.game_url || !String(body.game_url).trim()) throw new ApiError(400, "Game URL is required.");

  const payload = {
    title: String(body.title).trim(),
    description: body.description ? String(body.description).trim() : "",
    game_url: String(body.game_url).trim(),
    event_id: body.event_id === null || body.event_id === undefined || body.event_id === "" ? null : Number(body.event_id),
    is_active: body.is_active === undefined ? 1 : Number(body.is_active) ? 1 : 0,
    order: Number(body.order) || 0,
  };

  const result = db.prepare(`
    INSERT INTO games (title, description, game_url, event_id, is_active, "order")
    VALUES (@title, @description, @game_url, @event_id, @is_active, @order)
  `).run(payload);

  const inserted = formatGame(db.prepare("SELECT * FROM games WHERE id = ?").get(result.lastInsertRowid));
  res.status(201).json({ success: true, data: inserted });
}

// ── PUT /api/games/:id (admin) ──
export async function updateGame(req, res) {
  const id = Number(req.params.id);
  const existing = db.prepare("SELECT * FROM games WHERE id = ?").get(id);
  if (!existing) throw new ApiError(404, "Game not found.");

  const body = req.body || {};
  const updates = [];
  const vals = [];

  for (const f of ["title", "description", "game_url"]) {
    if (body[f] !== undefined) {
      updates.push(`"${f}" = ?`);
      vals.push(String(body[f]).trim());
    }
  }
  if (body.event_id !== undefined) {
    updates.push("event_id = ?");
    vals.push(body.event_id === null || body.event_id === "" ? null : Number(body.event_id));
  }
  if (body.is_active !== undefined) {
    updates.push("is_active = ?");
    vals.push(Number(body.is_active) ? 1 : 0);
  }
  if (body.order !== undefined) {
    updates.push(`"order" = ?`);
    vals.push(Number(body.order) || 0);
  }

  if (updates.length > 0) {
    updates.push("updated_at = strftime('%Y-%m-%dT%H:%M:%S','now')");
    vals.push(id);
    db.prepare(`UPDATE games SET ${updates.join(", ")} WHERE id = ?`).run(...vals);
  }

  const updated = formatGame(db.prepare("SELECT * FROM games WHERE id = ?").get(id));
  res.json({ success: true, data: updated });
}

// ── DELETE /api/games/:id (admin) ──
export async function deleteGame(req, res) {
  const id = Number(req.params.id);
  const existing = db.prepare("SELECT id FROM games WHERE id = ?").get(id);
  if (!existing) throw new ApiError(404, "Game not found.");

  db.prepare("DELETE FROM games WHERE id = ?").run(id);
  res.json({ success: true, message: "Game deleted successfully." });
}
