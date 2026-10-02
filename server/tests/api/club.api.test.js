/**
 * ====================================================
 *  CLUB DETAILS & ACTIVITIES API TESTS
 *  /api/club-details, /api/activities/*
 *  Tests: get, update, create activity, update activity,
 *         delete activity, auth requirements, response schema
 * ====================================================
 */

import request from "supertest";
import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { createTestServer } from "../helpers/testServer.js";

let app, server, adminToken, createdActivityId;

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
  if (adminToken && createdActivityId) {
    await request(app)
      .delete(`/api/activities/${createdActivityId}`)
      .set("Authorization", `Bearer ${adminToken}`);
  }
  server?.close();
});

// ─────────────────────────────────────────────
// GET /api/club-details
// ─────────────────────────────────────────────
describe("GET /api/club-details", () => {
  it("returns 200 and club details object", async () => {
    const res = await request(app).get("/api/club-details");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.name).toBeDefined();
  });

  it("is publicly accessible without auth", async () => {
    const res = await request(app).get("/api/club-details");
    expect(res.status).toBe(200);
  });

  it("response includes expected fields", async () => {
    const res = await request(app).get("/api/club-details");
    const d = res.body.data;
    expect(d.name).toBeDefined();
    expect(d.department).toBeDefined();
    // tagline, description, vision, mission should exist (may be empty)
    expect("tagline" in d).toBe(true);
    expect("description" in d).toBe(true);
  });
});

// ─────────────────────────────────────────────
// PUT /api/club-details
// ─────────────────────────────────────────────
describe("PUT /api/club-details", () => {
  let originalName;

  it("updates club details and returns new data", async () => {
    const getRes = await request(app).get("/api/club-details");
    originalName = getRes.body.data.name;

    const res = await request(app)
      .put("/api/club-details")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ tagline: "API Test Updated Tagline", founded_year: "2021" });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.tagline).toBe("API Test Updated Tagline");
  });

  it("preserves existing fields when partial update sent", async () => {
    const res = await request(app)
      .put("/api/club-details")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ founded_year: "2021" });
    expect(res.status).toBe(200);
    // Name should not be wiped out
    expect(res.body.data.name).toBeTruthy();
  });

  it("accepts social_links as object", async () => {
    const res = await request(app)
      .put("/api/club-details")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ social_links: { instagram: "https://instagram.com/test", linkedin: "https://linkedin.com/test" } });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("returns 401 without auth", async () => {
    const res = await request(app).put("/api/club-details").send({ tagline: "Hack" });
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────
// GET /api/activities
// ─────────────────────────────────────────────
describe("GET /api/activities", () => {
  it("returns 200 with activities array", async () => {
    const res = await request(app).get("/api/activities");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("is publicly accessible", async () => {
    const res = await request(app).get("/api/activities");
    expect(res.status).toBe(200);
  });
});

// ─────────────────────────────────────────────
// POST /api/activities
// ─────────────────────────────────────────────
describe("POST /api/activities", () => {
  it("creates an activity and returns 201", async () => {
    const res = await request(app)
      .post("/api/activities")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "API Test Workshop",
        category: "Workshop",
        date: "2026-09-01",
        description: "Test activity created by API tests",
        order: 99,
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe("API Test Workshop");
    expect(res.body.data.category).toBe("Workshop");
    expect(res.body.data.id).toBeDefined();
    createdActivityId = res.body.data.id;
  });

  it("returns 400 when name is missing", async () => {
    const res = await request(app)
      .post("/api/activities")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ category: "Workshop", date: "2026-09-01" });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/name/i);
  });

  it("returns 401 without auth", async () => {
    const res = await request(app).post("/api/activities").send({ name: "Unauthorized" });
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────
// PUT /api/activities/:id
// ─────────────────────────────────────────────
describe("PUT /api/activities/:id", () => {
  it("updates an activity successfully", async () => {
    if (!createdActivityId) return;
    const res = await request(app)
      .put(`/api/activities/${createdActivityId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ description: "Updated description via API test", order: 50 });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.description).toBe("Updated description via API test");
  });

  it("returns 404 for non-existent activity", async () => {
    const res = await request(app)
      .put("/api/activities/9999999")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Ghost Activity" });
    expect(res.status).toBe(404);
  });

  it("returns 401 without auth", async () => {
    const res = await request(app).put(`/api/activities/${createdActivityId}`).send({ name: "Hack" });
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────
// DELETE /api/activities/:id
// ─────────────────────────────────────────────
describe("DELETE /api/activities/:id", () => {
  it("deletes the activity and returns success", async () => {
    if (!createdActivityId) return;
    const res = await request(app)
      .delete(`/api/activities/${createdActivityId}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    createdActivityId = null;
  });

  it("returns 404 for non-existent activity", async () => {
    const res = await request(app)
      .delete("/api/activities/9999999")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(404);
  });

  it("returns 401 without auth", async () => {
    const res = await request(app).delete("/api/activities/1");
    expect(res.status).toBe(401);
  });
});

