/**
 * ====================================================
 *  AUTH SECURITY TESTS — Club Management Portal
 *  Tests: Brute force, JWT attacks, credential stuffing,
 *         token tampering, bypass attempts, privilege escalation
 * ====================================================
 */

import request from "supertest";
import jwt from "jsonwebtoken";
import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { createTestServer } from "../helpers/testServer.js";

let app;
let server;
let validToken;

const ADMIN_CREDS = {
  email: process.env.ADMIN_EMAIL || "aifrontierclub@gmail.com",
  password: process.env.ADMIN_PASSWORD || "aifrontierclub206",
};

beforeAll(async () => {
  ({ app, server } = await createTestServer());
  const res = await request(app).post("/api/auth/login").send(ADMIN_CREDS);
  validToken = res.body?.data?.token;
});

afterAll(() => {
  if (server) server.close();
});

// ─────────────────────────────────────────────
// 1. BRUTE FORCE & RATE LIMITING
// ─────────────────────────────────────────────
describe("[Attack] Brute Force Login", () => {
  it("should return 429 after 10 failed login attempts from same IP", async () => {
    const fakeCreds = { email: "hacker@evil.com", password: "wrongpassword" };
    let lastRes;
    for (let i = 0; i < 12; i++) {
      lastRes = await request(app).post("/api/auth/login").send(fakeCreds);
    }
    expect(lastRes.status).toBe(429);
    expect(lastRes.body.success).toBe(false);
  }, 30000);

  it("should include rate-limit headers on 429", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "x@x.com", password: "x" });
    if (res.status === 429) {
      const hasHeader =
        res.headers["retry-after"] ||
        res.headers["x-ratelimit-limit"] ||
        res.headers["ratelimit-limit"];
      expect(hasHeader).toBeTruthy();
    }
  });
});

// ─────────────────────────────────────────────
// 2. JWT TOKEN ATTACKS
// ─────────────────────────────────────────────
describe("[Attack] JWT Token Manipulation", () => {
  it("should reject a token signed with 'none' algorithm", async () => {
    const payload = { sub: "1", role: "admin", email: "hack@evil.com" };
    const header = Buffer.from('{"alg":"none","typ":"JWT"}').toString("base64url");
    const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const fakeToken = `${header}.${body}.`;
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${fakeToken}`);
    expect(res.status).toBe(401);
  });

  it("should reject a token signed with a wrong secret", async () => {
    const payload = { sub: "1", role: "admin", email: "hack@evil.com" };
    const forgedToken = jwt.sign(payload, "wrong-secret-key", { expiresIn: "1h" });
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${forgedToken}`);
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("should reject an expired token", async () => {
    const payload = { sub: "1", role: "admin", email: "admin@test.com" };
    const secret = process.env.JWT_SECRET || "dev-only-insecure-secret-change-me";
    const expiredToken = jwt.sign(payload, secret, { expiresIn: "-1s" });
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${expiredToken}`);
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/expired|session/i);
  });

  it("should reject a totally garbage token string", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer not.a.jwt");
    expect(res.status).toBe(401);
  });

  it("should reject a tampered token payload (privilege escalation attempt)", async () => {
    if (!validToken) return;
    const parts = validToken.split(".");
    const newPayload = { sub: "999", role: "superadmin", email: "hacker@evil.com" };
    const tamperedToken = `${parts[0]}.${Buffer.from(JSON.stringify(newPayload)).toString("base64url")}.${parts[2]}`;
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${tamperedToken}`);
    expect(res.status).toBe(401);
  });

  it("should reject request with no Authorization header", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("should reject Bearer with empty token", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer ");
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────
// 3. SQL INJECTION IN AUTH
// ─────────────────────────────────────────────
describe("[Attack] SQL Injection via Auth Endpoints", () => {
  const sqlPayloads = [
    "' OR '1'='1",
    "' OR 1=1--",
    "admin'--",
    "' UNION SELECT 1,2,3--",
    "'; DROP TABLE users;--",
    "1; EXEC xp_cmdshell('dir')--",
  ];

  sqlPayloads.forEach((payload) => {
    it(`should safely reject SQL injection: ${payload}`, async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: payload, password: payload });
      expect([400, 401, 422, 429]).toContain(res.status);
      expect(res.body.success).toBe(false);
    });
  });
});

// ─────────────────────────────────────────────
// 4. CREDENTIAL STUFFING
// ─────────────────────────────────────────────
describe("[Attack] Credential Stuffing with Common Passwords", () => {
  const commonPasswords = ["password", "123456", "admin", "qwerty", "letmein", "password123"];
  commonPasswords.forEach((pw) => {
    it(`should reject common password: "${pw}"`, async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "admin@club.com", password: pw });
      expect([400, 401, 429]).toContain(res.status);
    });
  });
});

// ─────────────────────────────────────────────
// 5. PASSWORD CHANGE ATTACKS
// ─────────────────────────────────────────────
describe("[Attack] Password Change Security", () => {
  it("should require auth to change password (unauthenticated reject)", async () => {
    const res = await request(app)
      .post("/api/auth/change-password")
      .send({ currentPassword: "anything", newPassword: "newpassword123" });
    expect(res.status).toBe(401);
  });

  it("should enforce minimum 8-char new password", async () => {
    if (!validToken) return;
    const res = await request(app)
      .post("/api/auth/change-password")
      .set("Authorization", `Bearer ${validToken}`)
      .send({ currentPassword: ADMIN_CREDS.password, newPassword: "abc" });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/8|characters|length/i);
  });

  it("should reject change if current password is wrong", async () => {
    if (!validToken) return;
    const res = await request(app)
      .post("/api/auth/change-password")
      .set("Authorization", `Bearer ${validToken}`)
      .send({ currentPassword: "wrongpassword", newPassword: "newSecurePass123!" });
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────
// 6. HEADER INJECTION & MALFORMED REQUESTS
// ─────────────────────────────────────────────
describe("[Attack] Header Injection and Malformed Requests", () => {
  it("should handle missing Content-Type gracefully", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .set("Content-Type", "text/plain")
      .send("email=test&password=test");
    expect([400, 401, 415, 422, 429]).toContain(res.status);
  });

  it("should reject oversized JSON body (DoS protection)", async () => {
    const bigBody = { email: "a@b.com", password: "x".repeat(1_000_000) };
    const res = await request(app).post("/api/auth/login").send(bigBody);
    expect([400, 413, 429]).toContain(res.status);
  });

  it("should not crash on null email/password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: null, password: null });
    expect([400, 401, 422, 429]).toContain(res.status);
    if (res.status !== 429) {
      expect(res.body.success).toBe(false);
    }
  });
});
