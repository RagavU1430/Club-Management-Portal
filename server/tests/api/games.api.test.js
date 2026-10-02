/**
 * ====================================================
 *  GAMES API TESTS — /api/games/*
 *  CRUD: list, create, update, delete
 *  Tests: happy paths, validation, auth requirements,
 *         public read vs admin write, response schema
 * ====================================================
 */

import request from "supertest";
import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { createTestServer } from "../helpers/testServer.js";

let app, server, adminToken, createdGameId;

const CREDS = {
  email: process.env.ADMIN_EMAIL || "aifrontierclub@gmail.com",
  password: process.env.ADMIN_PASSWORD || "aifrontierclub206",
};

beforeAll(async () => {
  ({ app, server } = await createTestServer({ skipRateLimiting: true }));
  const r = await request(app).post("/api/auth/login").send(CREDS);
  adminToken = r.body?.data?.token;
});

afterAll(async () => {
  if (adminToken && createdGameId) {
    await request(app)
      .delete(`/api/games/${createdGameId}`)
      .set("Authorization", `Bearer ${adminToken}`);
  }
  server?.close();
});

// ─────────────────────────────────────────────
// GET /api/games
// ─────────────────────────────────────────────
describe("GET /api/games", () => {
  it("returns 200 with games array (publicly accessible)", async () => {
    const res = await request(app).get("/api/games");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("only returns active games by default", async () => {
    const res = await request(app).get("/api/games");
    expect(res.status).toBe(200);
    res.body.data.forEach((g) => {
      expect(g.is_active).toBe(1);
    });
  });

  it("returns all games when scope=all", async () => {
    const res = await request(app).get("/api/games?scope=all");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    // May include inactive games — just verify the shape
    res.body.data.forEach((g) => {
      expect(g.id).toBeDefined();
      expect(g.title).toBeDefined();
      expect(g.game_url).toBeDefined();
    });
  });

  it("returns games ordered by order field", async () => {
    const res = await request(app).get("/api/games?scope=all");
    const orders = res.body.data.map((g) => g.order);
    for (let i = 1; i < orders.length; i++) {
      expect(orders[i]).toBeGreaterThanOrEqual(orders[i - 1]);
    }
  });
});

// ─────────────────────────────────────────────
// POST /api/games
// ─────────────────────────────────────────────
describe("POST /api/games", () => {
  it("creates a game and returns 201 with full data", async () => {
    const payload = {
      title: "API Test Game",
      game_url: "https://game.example.com/test",
      description: "Test game created by API test suite",
      is_active: 1,
      is_live: 0,
      order: 99,
    };
    const res = await request(app)
      .post("/api/games")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(payload);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe("API Test Game");
    expect(res.body.data.game_url).toBe("https://game.example.com/test");
    expect(res.body.data.is_active).toBe(1);
    expect(res.body.data.is_live).toBe(0);
    expect(res.body.data.id).toBeDefined();
    createdGameId = res.body.data.id;
  });

  it("returns 400 when title is missing", async () => {
    const res = await request(app)
      .post("/api/games")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ game_url: "https://example.com" });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/title/i);
  });

  it("returns 400 when game_url is missing", async () => {
    const res = await request(app)
      .post("/api/games")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ title: "No URL Game" });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/url/i);
  });

  it("returns 401 without auth", async () => {
    const res = await request(app)
      .post("/api/games")
      .send({ title: "Unauthorized", game_url: "https://hack.com" });
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────
// PUT /api/games/:id
// ─────────────────────────────────────────────
describe("PUT /api/games/:id", () => {
  it("updates game fields and returns updated data", async () => {
    if (!createdGameId) return;
    const res = await request(app)
      .put(`/api/games/${createdGameId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ description: "Updated description", is_live: 1 });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.description).toBe("Updated description");
    expect(res.body.data.is_live).toBe(1);
  });

  it("can toggle is_active flag", async () => {
    if (!createdGameId) return;
    const res = await request(app)
      .put(`/api/games/${createdGameId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ is_active: 0 });
    expect(res.status).toBe(200);
    expect(res.body.data.is_active).toBe(0);
    // Restore
    await request(app)
      .put(`/api/games/${createdGameId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ is_active: 1 });
  });

  it("returns same data when no fields sent", async () => {
    if (!createdGameId) return;
    const res = await request(app)
      .put(`/api/games/${createdGameId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({});
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(createdGameId);
  });

  it("returns 404 for non-existent game", async () => {
    const res = await request(app)
      .put("/api/games/9999999")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ title: "Ghost" });
    expect(res.status).toBe(404);
  });

  it("returns 401 without auth", async () => {
    const res = await request(app)
      .put(`/api/games/${createdGameId}`)
      .send({ title: "Hack" });
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────
// DELETE /api/games/:id
// ─────────────────────────────────────────────
describe("DELETE /api/games/:id", () => {
  it("deletes the game and returns success message", async () => {
    if (!createdGameId) return;
    const res = await request(app)
      .delete(`/api/games/${createdGameId}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/deleted/i);
    createdGameId = null;
  });

  it("returns 404 for non-existent game", async () => {
    const res = await request(app)
      .delete("/api/games/9999999")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(404);
  });

  it("returns 401 without auth", async () => {
    const res = await request(app).delete("/api/games/1");
    expect(res.status).toBe(401);
  });
});

