/**
 * ====================================================
 *  AUTH API TESTS — /api/auth/*
 *  Covers: login, /me, change-password, logout
 *  Tests happy paths, validation, and response shapes
 * ====================================================
 */

import request from "supertest";
import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { createTestServer } from "../helpers/testServer.js";

let app, server, adminToken;

const CREDS = {
  email: process.env.ADMIN_EMAIL || "aifrontierclub@gmail.com",
  password: process.env.ADMIN_PASSWORD || "aifrontierclub206",
};

beforeAll(async () => {
  ({ app, server } = await createTestServer({ skipRateLimiting: true }));
  const r = await request(app).post("/api/auth/login").send(CREDS);
  adminToken = r.body?.data?.token;
});
afterAll(() => server?.close());

// ─────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────
describe("POST /api/auth/login", () => {
  it("returns 200 + token on valid credentials", async () => {
    const res = await request(app).post("/api/auth/login").send(CREDS);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(typeof res.body.data.token).toBe("string");
    expect(res.body.data.user).toBeDefined();
    expect(res.body.data.user.email).toBe(CREDS.email);
    // password_hash must NEVER be returned
    expect(res.body.data.user.password_hash).toBeUndefined();
  });

  it("returns 401 on wrong password", async () => {
    const res = await request(app).post("/api/auth/login").send({ ...CREDS, password: "wrongpassword" });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/incorrect|invalid/i);
  });

  it("returns 401 on unknown email", async () => {
    const res = await request(app).post("/api/auth/login").send({ email: "nobody@nobody.com", password: "anything" });
    expect(res.status).toBe(401);
  });

  it("returns 400 when email is missing", async () => {
    const res = await request(app).post("/api/auth/login").send({ password: "secret" });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("returns 400 when password is missing", async () => {
    const res = await request(app).post("/api/auth/login").send({ email: CREDS.email });
    expect(res.status).toBe(400);
  });

  it("returns 400 when body is empty", async () => {
    const res = await request(app).post("/api/auth/login").send({});
    expect(res.status).toBe(400);
  });
});

// ─────────────────────────────────────────────
// GET /api/auth/me
// ─────────────────────────────────────────────
describe("GET /api/auth/me", () => {
  it("returns user profile with valid token", async () => {
    const res = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user).toBeDefined();
    expect(res.body.data.user.email).toBe(CREDS.email);
    expect(res.body.data.user.password_hash).toBeUndefined();
    expect(res.body.data.user.role).toBeDefined();
  });

  it("returns 401 without token", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("returns 401 with malformed token", async () => {
    const res = await request(app).get("/api/auth/me").set("Authorization", "Bearer bad.token.here");
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────
// POST /api/auth/change-password
// ─────────────────────────────────────────────
describe("POST /api/auth/change-password", () => {
  it("returns 401 without auth token", async () => {
    const res = await request(app).post("/api/auth/change-password").send({ currentPassword: "x", newPassword: "y12345678" });
    expect(res.status).toBe(401);
  });

  it("returns 400 if currentPassword is missing", async () => {
    const res = await request(app)
      .post("/api/auth/change-password")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ newPassword: "newpass123" });
    expect(res.status).toBe(400);
  });

  it("returns 400 if new password < 8 characters", async () => {
    const res = await request(app)
      .post("/api/auth/change-password")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ currentPassword: CREDS.password, newPassword: "short" });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/8|character/i);
  });

  it("returns 401 if current password is wrong", async () => {
    const res = await request(app)
      .post("/api/auth/change-password")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ currentPassword: "wrongpassword", newPassword: "newSecure123!" });
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────
// POST /api/auth/logout
// ─────────────────────────────────────────────
describe("POST /api/auth/logout", () => {
  it("returns 200 and success message", async () => {
    const res = await request(app).post("/api/auth/logout");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

