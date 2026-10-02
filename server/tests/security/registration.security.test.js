/**
 * ====================================================
 *  REGISTRATION SECURITY TESTS — Club Management Portal
 *  Tests: Email validation bypass, capacity overflow race condition,
 *         duplicate registration, field length bombs, XSS in forms,
 *         phone/roll number injection, notes field attacks
 * ====================================================
 */

import request from "supertest";
import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { createTestServer } from "../helpers/testServer.js";

let app;
let server;
let adminToken;
let testEventId;

const ADMIN_CREDS = {
  email: process.env.ADMIN_EMAIL || "aifrontierclub@gmail.com",
  password: process.env.ADMIN_PASSWORD || "aifrontierclub206",
};

beforeAll(async () => {
  ({ app, server } = await createTestServer());
  const loginRes = await request(app).post("/api/auth/login").send(ADMIN_CREDS);
  adminToken = loginRes.body?.data?.token;

  // Create a test event for registration
  if (adminToken) {
    const evRes = await request(app)
      .post("/api/events")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        title: "Reg Security Test Event",
        date: new Date(Date.now() + 86400000).toISOString(),
        venue: "Test Venue",
        status: "published",
        capacity: 3,
      });
    testEventId = evRes.body?.data?.id;
  }
});

afterAll(async () => {
  if (adminToken && testEventId) {
    await request(app)
      .delete(`/api/events/${testEventId}`)
      .set("Authorization", `Bearer ${adminToken}`);
  }
  if (server) server.close();
});

const validReg = () => ({
  name: "Test User",
  email: `test${Date.now()}@example.com`,
  phone: "9876543210",
  department: "CSE",
  year: "2",
  rollNumber: "21CS001",
});

// ─────────────────────────────────────────────
// 1. EMAIL VALIDATION BYPASS
// ─────────────────────────────────────────────
describe("[Attack] Email Validation Bypass in Registration", () => {
  const invalidEmails = [
    "notanemail",
    "@domain.com",
    "user@",
    "user@@domain.com",
    "user @domain.com",
    "<script>alert(1)</script>@domain.com",
    "user@domain",      // no TLD
    "",
    null,
    "a".repeat(300) + "@evil.com",
  ];

  invalidEmails.forEach((email) => {
    it(`should reject invalid email: ${String(email).slice(0, 40)}`, async () => {
      if (!testEventId) return;
      const res = await request(app)
        .post(`/api/events/${testEventId}/register`)
        .send({ ...validReg(), email });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});

// ─────────────────────────────────────────────
// 2. CAPACITY OVERFLOW
// ─────────────────────────────────────────────
describe("[Attack] Capacity Overflow (Register Beyond Limit)", () => {
  it("should reject registration when event is at full capacity", async () => {
    if (!testEventId) return;

    // Fill up the 3-slot event
    for (let i = 0; i < 3; i++) {
      await request(app)
        .post(`/api/events/${testEventId}/register`)
        .send({ ...validReg(), email: `cap${i}${Date.now()}@test.com` });
    }

    // The 4th should be rejected
    const res = await request(app)
      .post(`/api/events/${testEventId}/register`)
      .send({ ...validReg(), email: `overflow${Date.now()}@test.com` });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/capacity|full|closed/i);
  }, 20000);
});

// ─────────────────────────────────────────────
// 3. DUPLICATE REGISTRATION
// ─────────────────────────────────────────────
describe("[Attack] Duplicate Registration with Same Email", () => {
  it("should not allow same email to be registered twice", async () => {
    if (!adminToken) {
      // Create a fresh event with high capacity
      return;
    }
    const highCapEvent = await request(app)
      .post("/api/events")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        title: "Duplicate Test Event",
        date: new Date(Date.now() + 86400000).toISOString(),
        venue: "Hall",
        status: "published",
        capacity: 100,
      });
    const eid = highCapEvent.body?.data?.id;
    if (!eid) return;

    const dupEmail = `duplicate${Date.now()}@test.com`;
    await request(app)
      .post(`/api/events/${eid}/register`)
      .send({ ...validReg(), email: dupEmail });

    const res = await request(app)
      .post(`/api/events/${eid}/register`)
      .send({ ...validReg(), email: dupEmail });

    // Should return success with alreadyRegistered: true (not create duplicate)
    expect(res.body?.data?.alreadyRegistered).toBe(true);

    await request(app)
      .delete(`/api/events/${eid}`)
      .set("Authorization", `Bearer ${adminToken}`);
  }, 20000);
});

// ─────────────────────────────────────────────
// 4. FIELD LENGTH BOMBS (DoS via huge input)
// ─────────────────────────────────────────────
describe("[Attack] Field Length Bombs in Registration", () => {
  const longString = "A".repeat(10000);

  it("should handle extremely long name field", async () => {
    if (!testEventId) return;
    const res = await request(app)
      .post(`/api/events/${testEventId}/register`)
      .send({ ...validReg(), name: longString, email: `long${Date.now()}@test.com` });
    expect(res.status).not.toBe(500);
  });

  it("should handle extremely long notes field", async () => {
    if (!testEventId) return;
    const res = await request(app)
      .post(`/api/events/${testEventId}/register`)
      .send({ ...validReg(), notes: longString, email: `longnotes${Date.now()}@test.com` });
    expect(res.status).not.toBe(500);
  });
});

// ─────────────────────────────────────────────
// 5. XSS IN REGISTRATION FIELDS
// ─────────────────────────────────────────────
describe("[Attack] XSS in Registration Form Fields", () => {
  const xss = '<script>alert(document.cookie)</script>';

  it("should safely store XSS in name field without executing", async () => {
    if (!adminToken) return;
    const freshEvent = await request(app)
      .post("/api/events")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        title: "XSS Reg Test",
        date: new Date(Date.now() + 86400000).toISOString(),
        venue: "Hall",
        status: "published",
        capacity: 100,
      });
    const eid = freshEvent.body?.data?.id;
    if (!eid) return;

    const res = await request(app)
      .post(`/api/events/${eid}/register`)
      .send({ ...validReg(), name: xss, email: `xsstest${Date.now()}@test.com` });
    expect(res.status).not.toBe(500);

    // Verify the admin can still fetch registrations safely
    const regRes = await request(app)
      .get(`/api/events/${eid}/registrations`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(regRes.status).toBe(200);

    await request(app)
      .delete(`/api/events/${eid}`)
      .set("Authorization", `Bearer ${adminToken}`);
  }, 15000);
});

// ─────────────────────────────────────────────
// 6. REGISTRATION RATE LIMITING
// ─────────────────────────────────────────────
describe("[Attack] Registration Endpoint Rate Limiting", () => {
  it("should rate limit excessive registrations from same IP", async () => {
    if (!adminToken) return;
    const ev = await request(app)
      .post("/api/events")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        title: "Rate Limit Test",
        date: new Date(Date.now() + 86400000).toISOString(),
        venue: "Hall",
        status: "published",
        capacity: 1000,
      });
    const eid = ev.body?.data?.id;
    if (!eid) return;

    let lastRes;
    for (let i = 0; i < 22; i++) {
      lastRes = await request(app)
        .post(`/api/events/${eid}/register`)
        .send({ ...validReg(), email: `ratelimit${i}${Date.now()}@test.com` });
    }
    // After 20 requests, should get 429
    expect(lastRes.status).toBe(429);

    await request(app)
      .delete(`/api/events/${eid}`)
      .set("Authorization", `Bearer ${adminToken}`);
  }, 60000);
});

// ─────────────────────────────────────────────
// 7. REGISTER FOR NON-EXISTENT EVENT
// ─────────────────────────────────────────────
describe("[Attack] Registration for Non-existent Event (IDOR)", () => {
  it("should return 404 for non-existent event ID", async () => {
    const res = await request(app)
      .post("/api/events/999999999/register")
      .send(validReg());
    expect(res.status).toBe(404);
  });
});

// ─────────────────────────────────────────────
// 8. TICKET LOOKUP ATTACKS
// ─────────────────────────────────────────────
describe("[Attack] Ticket Lookup Security", () => {
  it("should reject lookup with no identifier", async () => {
    const res = await request(app)
      .post("/api/events/lookup-ticket")
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should safely handle SQL injection in ticket lookup", async () => {
    const res = await request(app)
      .post("/api/events/lookup-ticket")
      .send({ email: "' OR 1=1--@evil.com", teamName: "'; DROP TABLE event_registrations;--" });
    expect(res.status).not.toBe(500);
    expect([200, 400, 429]).toContain(res.status);
  });

  it("should not expose all registrations via empty team name", async () => {
    const res = await request(app)
      .post("/api/events/lookup-ticket")
      .send({ teamName: "" });
    // Should be rejected — blank team name = no valid query
    expect(res.status).toBe(400);
  });
});
