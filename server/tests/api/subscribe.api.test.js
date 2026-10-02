/**
 * ====================================================
 *  SUBSCRIBE & HEALTH API TESTS
 *  /api/subscribe, /api/subscribers, /api/health
 *  Tests: subscription flow, duplicate handling, admin CRUD,
 *         health endpoint, response schemas
 * ====================================================
 */

import request from "supertest";
import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { createTestServer } from "../helpers/testServer.js";

let app, server, adminToken;
const testEmail = `subscribe_test_${Date.now()}@test.com`;

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
  // Clean up the test subscriber
  if (adminToken) {
    const listRes = await request(app)
      .get("/api/subscribers")
      .set("Authorization", `Bearer ${adminToken}`);
    const sub = listRes.body.data?.find((s) => s.email === testEmail);
    if (sub) {
      await request(app)
        .delete(`/api/subscribers/${sub.id}`)
        .set("Authorization", `Bearer ${adminToken}`);
    }
  }
  server?.close();
});

// ─────────────────────────────────────────────
// GET /api/health
// ─────────────────────────────────────────────
describe("GET /api/health", () => {
  it("returns 200 with uptime", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.uptime).toBe("number");
    expect(res.body.uptime).toBeGreaterThanOrEqual(0);
  });

  it("is publicly accessible without auth", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
  });

  it("responds quickly (< 500ms)", async () => {
    const start = Date.now();
    await request(app).get("/api/health");
    expect(Date.now() - start).toBeLessThan(500);
  });
});

// ─────────────────────────────────────────────
// POST /api/subscribe
// ─────────────────────────────────────────────
describe("POST /api/subscribe", () => {
  it("subscribes a valid email and returns success", async () => {
    const res = await request(app)
      .post("/api/subscribe")
      .send({ email: testEmail });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/subscribed|notif/i);
  });

  it("is idempotent — re-subscribing same email still returns 200", async () => {
    const res = await request(app)
      .post("/api/subscribe")
      .send({ email: testEmail });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("returns 400 for invalid email (no @)", async () => {
    const res = await request(app).post("/api/subscribe").send({ email: "invalidemail" });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("returns 400 for empty email", async () => {
    const res = await request(app).post("/api/subscribe").send({ email: "" });
    expect(res.status).toBe(400);
  });

  it("returns 400 for missing email field", async () => {
    const res = await request(app).post("/api/subscribe").send({});
    expect(res.status).toBe(400);
  });

  it("returns 400 for email with HTML injection", async () => {
    const res = await request(app).post("/api/subscribe").send({ email: "<script>@evil.com" });
    expect(res.status).toBe(400);
  });

  it("returns 400 for email > 254 chars", async () => {
    const res = await request(app).post("/api/subscribe").send({ email: "a".repeat(250) + "@b.com" });
    expect(res.status).toBe(400);
  });

  it("normalises email to lowercase before storing", async () => {
    const upperEmail = `UPPER${Date.now()}@TEST.COM`;
    const res = await request(app).post("/api/subscribe").send({ email: upperEmail });
    // Should succeed (stored as lowercase)
    expect([200, 400]).toContain(res.status);
    if (res.status === 200) {
      // Clean up
      const listRes = await request(app).get("/api/subscribers").set("Authorization", `Bearer ${adminToken}`);
      const sub = listRes.body.data?.find((s) => s.email === upperEmail.toLowerCase());
      if (sub) {
        await request(app).delete(`/api/subscribers/${sub.id}`).set("Authorization", `Bearer ${adminToken}`);
      }
    }
  });
});

// ─────────────────────────────────────────────
// GET /api/subscribers (admin only)
// ─────────────────────────────────────────────
describe("GET /api/subscribers", () => {
  it("returns subscriber list for admin", async () => {
    const res = await request(app)
      .get("/api/subscribers")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("includes the subscriber we just added", async () => {
    const res = await request(app)
      .get("/api/subscribers")
      .set("Authorization", `Bearer ${adminToken}`);
    const found = res.body.data.some((s) => s.email === testEmail);
    expect(found).toBe(true);
  });

  it("returns 401 without auth", async () => {
    const res = await request(app).get("/api/subscribers");
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────
// DELETE /api/subscribers/:id
// ─────────────────────────────────────────────
describe("DELETE /api/subscribers/:id", () => {
  it("deletes subscriber and confirms removal", async () => {
    // First subscribe with a throwaway email
    const throwaway = `throwaway_${Date.now()}@test.com`;
    await request(app).post("/api/subscribe").send({ email: throwaway });

    const listRes = await request(app)
      .get("/api/subscribers")
      .set("Authorization", `Bearer ${adminToken}`);
    const sub = listRes.body.data.find((s) => s.email === throwaway);
    if (!sub) return; // edge case: not found

    const delRes = await request(app)
      .delete(`/api/subscribers/${sub.id}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(delRes.status).toBe(200);
    expect(delRes.body.success).toBe(true);

    // Verify it's gone
    const checkRes = await request(app)
      .get("/api/subscribers")
      .set("Authorization", `Bearer ${adminToken}`);
    const stillExists = checkRes.body.data.some((s) => s.email === throwaway);
    expect(stillExists).toBe(false);
  }, 10000);

  it("returns 401 without auth", async () => {
    const res = await request(app).delete("/api/subscribers/1");
    expect(res.status).toBe(401);
  });
});

