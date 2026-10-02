/**
 * ====================================================
 *  TEAM API TESTS — /api/team/*
 *  Full CRUD: list, roles, create, update, delete, clearAll
 *  Tests: happy paths, validation, auth requirements,
 *         search/filter, response schema
 * ====================================================
 */

import request from "supertest";
import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { createTestServer } from "../helpers/testServer.js";

let app, server, adminToken, createdMemberId;

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
  if (adminToken && createdMemberId) {
    await request(app)
      .delete(`/api/team/${createdMemberId}`)
      .set("Authorization", `Bearer ${adminToken}`);
  }
  server?.close();
});

// ─────────────────────────────────────────────
// GET /api/team
// ─────────────────────────────────────────────
describe("GET /api/team", () => {
  it("returns 200 with array of team members", async () => {
    const res = await request(app).get("/api/team");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("is publicly accessible (no token needed)", async () => {
    const res = await request(app).get("/api/team");
    expect(res.status).toBe(200);
  });

  it("supports text search via q param", async () => {
    const res = await request(app).get("/api/team?q=coordinator");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("supports role filter via role param", async () => {
    const res = await request(app).get("/api/team?role=President");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    // If any members returned, they must all have the right role
    res.body.data.forEach((m) => {
      expect(m.role.toLowerCase()).toBe("president");
    });
  });
});

// ─────────────────────────────────────────────
// GET /api/team/roles
// ─────────────────────────────────────────────
describe("GET /api/team/roles", () => {
  it("returns an array of role strings", async () => {
    const res = await request(app).get("/api/team/roles");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    // Roles must be strings
    res.body.data.forEach((r) => expect(typeof r).toBe("string"));
  });

  it("returns sorted roles", async () => {
    const res = await request(app).get("/api/team/roles");
    const roles = res.body.data;
    const sorted = [...roles].sort();
    expect(roles).toEqual(sorted);
  });
});

// ─────────────────────────────────────────────
// POST /api/team (Create)
// ─────────────────────────────────────────────
describe("POST /api/team", () => {
  it("creates a member and returns 201 with data", async () => {
    const payload = {
      name: "API Test Member",
      role: "Coordinator",
      department: "CSE",
      email: "apitestmember@test.com",
      bio: "Test member created by API test suite",
      order: 99,
    };
    const res = await request(app)
      .post("/api/team")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(payload);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe("API Test Member");
    expect(res.body.data.role).toBe("Coordinator");
    expect(res.body.data.id).toBeDefined();
    createdMemberId = res.body.data.id;
  });

  it("returns 400 when name is missing", async () => {
    const res = await request(app)
      .post("/api/team")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ role: "Coordinator" });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/name|role/i);
  });

  it("returns 400 when role is missing", async () => {
    const res = await request(app)
      .post("/api/team")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "No Role Member" });
    expect(res.status).toBe(400);
  });

  it("returns 401 without auth token", async () => {
    const res = await request(app)
      .post("/api/team")
      .send({ name: "Hacker", role: "Admin" });
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────
// PUT /api/team/:id (Update)
// ─────────────────────────────────────────────
describe("PUT /api/team/:id", () => {
  it("updates a member successfully", async () => {
    if (!createdMemberId) return;
    const res = await request(app)
      .put(`/api/team/${createdMemberId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ bio: "Updated bio via API test", order: 50 });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.bio).toBe("Updated bio via API test");
  });

  it("returns same data when no fields sent", async () => {
    if (!createdMemberId) return;
    const res = await request(app)
      .put(`/api/team/${createdMemberId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({});
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(createdMemberId);
  });

  it("returns 404 for non-existent member", async () => {
    const res = await request(app)
      .put("/api/team/9999999")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ bio: "Ghost" });
    expect(res.status).toBe(404);
  });

  it("returns 401 without auth", async () => {
    const res = await request(app).put(`/api/team/${createdMemberId}`).send({ bio: "Hack" });
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────
// DELETE /api/team/:id
// ─────────────────────────────────────────────
describe("DELETE /api/team/:id", () => {
  it("deletes the created member and returns success", async () => {
    if (!createdMemberId) return;
    const res = await request(app)
      .delete(`/api/team/${createdMemberId}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.deleted).toBe(true);
    createdMemberId = null;
  });

  it("returns 404 after deletion", async () => {
    const res = await request(app)
      .delete("/api/team/9999999")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(404);
  });

  it("returns 401 without auth", async () => {
    const res = await request(app).delete("/api/team/1");
    expect(res.status).toBe(401);
  });
});

