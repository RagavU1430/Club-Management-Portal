/**
 * ====================================================
 *  GENERAL / INFRASTRUCTURE SECURITY TESTS
 *  Tests: Information disclosure, CORS bypass, missing security
 *         headers, path traversal on static files, route enumeration,
 *         HTTP method tampering, subscribe endpoint abuse
 * ====================================================
 */

import request from "supertest";
import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { createTestServer } from "../helpers/testServer.js";

let app;
let server;

beforeAll(async () => {
  ({ app, server } = await createTestServer());
});

afterAll(() => {
  if (server) server.close();
});

// ─────────────────────────────────────────────
// 1. CORS BYPASS ATTEMPTS
// ─────────────────────────────────────────────
describe("[Attack] CORS Origin Bypass", () => {
  it("should block requests from unauthorized origins", async () => {
    const res = await request(app)
      .get("/api/events")
      .set("Origin", "https://evil-attacker.com");
    // CORS policy should either block or not expose ACAO header
    const allowOrigin = res.headers["access-control-allow-origin"];
    if (allowOrigin) {
      expect(allowOrigin).not.toBe("https://evil-attacker.com");
      expect(allowOrigin).not.toBe("*");
    }
  });

  it("should block null origin (iframe sandbox exploit)", async () => {
    const res = await request(app)
      .options("/api/events")
      .set("Origin", "null");
    const allowOrigin = res.headers["access-control-allow-origin"];
    if (allowOrigin) {
      expect(allowOrigin).not.toBe("null");
    }
  });

  it("should allow legitimate Vercel origin", async () => {
    const res = await request(app)
      .get("/api/events")
      .set("Origin", "https://ai-frontier-club.vercel.app");
    // Should succeed
    expect([200, 304]).toContain(res.status);
  });

  it("should block subdomain bypass attempt (evildomain.vercel.app)", async () => {
    const res = await request(app)
      .get("/api/events")
      .set("Origin", "https://evil-domain-not-ai-frontier-club.vercel.app");
    const allowOrigin = res.headers["access-control-allow-origin"];
    if (allowOrigin) {
      expect(allowOrigin).not.toBe("https://evil-domain-not-ai-frontier-club.vercel.app");
    }
  });
});

// ─────────────────────────────────────────────
// 2. INFORMATION DISCLOSURE
// ─────────────────────────────────────────────
describe("[Attack] Information Disclosure in Error Responses", () => {
  it("should not expose stack traces in 404 response", async () => {
    const res = await request(app).get("/api/this-route-does-not-exist-hack");
    expect(res.status).toBe(404);
    const body = JSON.stringify(res.body);
    expect(body).not.toMatch(/at Object\./);
    expect(body).not.toMatch(/node_modules/);
    expect(body).not.toMatch(/\.js:\d+:\d+/);
  });

  it("should not expose internal error details on invalid JSON", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .set("Content-Type", "application/json")
      .send("{ invalid json }}}");
    expect([400, 500]).toContain(res.status);
    if (res.body?.message) {
      expect(res.body.message).not.toMatch(/SyntaxError/i);
      expect(res.body.message).not.toMatch(/stack/i);
    }
  });

  it("should not expose X-Powered-By: Express header", async () => {
    const res = await request(app).get("/api/health");
    // Express sets this by default; security best practice is to remove it
    // This test documents whether it's present
    const poweredBy = res.headers["x-powered-by"];
    expect(poweredBy).toBeUndefined();
  });
});

// ─────────────────────────────────────────────
// 3. HTTP METHOD TAMPERING
// ─────────────────────────────────────────────
describe("[Attack] HTTP Method Tampering", () => {
  it("should reject DELETE on read-only event listing endpoint", async () => {
    const res = await request(app).delete("/api/events");
    expect([404, 405, 401]).toContain(res.status);
  });

  it("should reject PATCH on events list (mass modification)", async () => {
    const res = await request(app)
      .patch("/api/events")
      .send({ status: "deleted" });
    expect([404, 405, 401]).toContain(res.status);
  });
});

// ─────────────────────────────────────────────
// 4. PATH TRAVERSAL ON STATIC UPLOADS
// ─────────────────────────────────────────────
describe("[Attack] Path Traversal on Static File Serving", () => {
  const traversalPaths = [
    "/uploads/../../server/.env",
    "/uploads/..%2F..%2F.env",
    "/uploads/%2e%2e%2f%2e%2e%2f.env",
    "/uploads/../../../../etc/passwd",
  ];

  traversalPaths.forEach((p) => {
    it(`should block path traversal: ${p}`, async () => {
      const res = await request(app).get(p);
      expect([400, 403, 404]).toContain(res.status);
      // Must never return 200 with sensitive content
      if (res.status === 200) {
        expect(res.text).not.toMatch(/JWT_SECRET|ADMIN_PASSWORD|GMAIL/i);
      }
    });
  });
});

// ─────────────────────────────────────────────
// 5. SUBSCRIBE ENDPOINT ABUSE
// ─────────────────────────────────────────────
describe("[Attack] Subscribe Endpoint Abuse", () => {
  it("should reject invalid email in subscribe", async () => {
    const res = await request(app)
      .post("/api/subscribe")
      .send({ email: "notanemail" });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should reject XSS payload as email in subscribe", async () => {
    const res = await request(app)
      .post("/api/subscribe")
      .send({ email: '<script>alert(1)</script>@evil.com' });
    expect(res.status).toBe(400);
  });

  it("should reject empty email in subscribe", async () => {
    const res = await request(app)
      .post("/api/subscribe")
      .send({ email: "" });
    expect(res.status).toBe(400);
  });

  it("should reject ridiculously long email in subscribe", async () => {
    const res = await request(app)
      .post("/api/subscribe")
      .send({ email: "a".repeat(500) + "@evil.com" });
    // Should reject (400) or at least not crash (200 idempotent is ok too)
    expect(res.status).not.toBe(500);
  });
});

// ─────────────────────────────────────────────
// 6. ADMIN SUBSCRIBER ENDPOINT — AUTH REQUIRED
// ─────────────────────────────────────────────
describe("[Attack] Admin Subscriber List - Unauthorized Access", () => {
  it("should block unauthenticated GET /api/subscribers", async () => {
    const res = await request(app).get("/api/subscribers");
    expect(res.status).toBe(401);
  });

  it("should block unauthenticated DELETE /api/subscribers/1", async () => {
    const res = await request(app).delete("/api/subscribers/1");
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────
// 7. ROUTE ENUMERATION — NON-EXISTENT ROUTES
// ─────────────────────────────────────────────
describe("[Attack] Route Enumeration", () => {
  const hackRoutes = [
    "/admin",
    "/admin/login",
    "/api/admin",
    "/api/users",
    "/api/users/1",
    "/.env",
    "/server.js",
    "/api/debug",
    "/phpinfo.php",
    "/wp-admin",
    "/config.json",
    "/.git/config",
  ];

  hackRoutes.forEach((route) => {
    it(`should return 404 for hacker probe: ${route}`, async () => {
      const res = await request(app).get(route);
      expect([404, 400]).toContain(res.status);
    });
  });
});
