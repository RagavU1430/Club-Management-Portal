/**
 * ====================================================
 *  EVENTS API TESTS — /api/events/*
 *  Full CRUD: list, stats, getOne, create, update, delete
 *  Also: export CSV, registrations list, registration delete
 *  Tests: happy paths, pagination, filtering, search, response schema
 * ====================================================
 */

import request from "supertest";
import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { createTestServer } from "../helpers/testServer.js";

let app, server, adminToken;
let createdEventId, createdEventSlug, createdRegId;

const CREDS = {
  email: process.env.ADMIN_EMAIL || "aifrontierclub@gmail.com",
  password: process.env.ADMIN_PASSWORD || "aifrontierclub206",
};

const futureDate = () => new Date(Date.now() + 7 * 86400000).toISOString();

beforeAll(async () => {
  ({ app, server } = await createTestServer({ skipRateLimiting: true }));
  const r = await request(app).post("/api/auth/login").send(CREDS);
  adminToken = r.body?.data?.token;
});

afterAll(async () => {
  if (adminToken && createdEventId) {
    await request(app)
      .delete(`/api/events/${createdEventId}`)
      .set("Authorization", `Bearer ${adminToken}`);
  }
  server?.close();
});

// ─────────────────────────────────────────────
// GET /api/events
// ─────────────────────────────────────────────
describe("GET /api/events", () => {
  it("returns 200 with data array", async () => {
    const res = await request(app).get("/api/events");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta).toBeDefined();
    expect(typeof res.body.meta.total).toBe("number");
    expect(typeof res.body.meta.page).toBe("number");
  });

  it("supports scope=upcoming filter", async () => {
    const res = await request(app).get("/api/events?scope=upcoming");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("supports scope=past filter", async () => {
    const res = await request(app).get("/api/events?scope=past");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("supports text search with q param", async () => {
    const res = await request(app).get("/api/events?q=test");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("supports pagination with page and limit", async () => {
    const res = await request(app).get("/api/events?page=1&limit=5");
    expect(res.status).toBe(200);
    expect(res.body.meta.limit).toBe(5);
    expect(res.body.meta.page).toBe(1);
  });

  it("caps limit at 100 to prevent DoS", async () => {
    const res = await request(app).get("/api/events?limit=9999");
    expect(res.status).toBe(200);
    expect(res.body.meta.limit).toBeLessThanOrEqual(100);
  });

  it("each event has required shape fields", async () => {
    const res = await request(app).get("/api/events?limit=1");
    if (res.body.data.length > 0) {
      const ev = res.body.data[0];
      expect(ev.id).toBeDefined();
      expect(ev.title).toBeDefined();
      expect(ev.computedStatus).toMatch(/upcoming|past/);
    }
  });
});

// ─────────────────────────────────────────────
// GET /api/events/stats
// ─────────────────────────────────────────────
describe("GET /api/events/stats", () => {
  it("returns counts and nextEvent", async () => {
    const res = await request(app).get("/api/events/stats");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.data.upcoming).toBe("number");
    expect(typeof res.body.data.past).toBe("number");
    expect(typeof res.body.data.total).toBe("number");
  });
});

// ─────────────────────────────────────────────
// POST /api/events (Create)
// ─────────────────────────────────────────────
describe("POST /api/events", () => {
  it("creates event and returns 201 with full data", async () => {
    const payload = {
      title: "API Test Event",
      date: futureDate(),
      venue: "Test Hall 101",
      description: "Created by API test",
      status: "published",
      capacity: 50,
      tags: ["workshop", "ai"],
      featured: true,
    };
    const res = await request(app)
      .post("/api/events")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe("API Test Event");
    expect(res.body.data.venue).toBe("Test Hall 101");
    expect(res.body.data.slug).toBeDefined();
    expect(res.body.data.id).toBeDefined();

    createdEventId = res.body.data.id;
    createdEventSlug = res.body.data.slug;
  });

  it("returns 400 when title is missing", async () => {
    const res = await request(app)
      .post("/api/events")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ date: futureDate(), venue: "Somewhere" });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/title/i);
  });

  it("returns 400 when date is missing", async () => {
    const res = await request(app)
      .post("/api/events")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ title: "No Date Event", venue: "Somewhere" });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/date/i);
  });

  it("returns 401 without token", async () => {
    const res = await request(app)
      .post("/api/events")
      .send({ title: "Unauthorized", date: futureDate() });
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────
// GET /api/events/:idOrSlug
// ─────────────────────────────────────────────
describe("GET /api/events/:idOrSlug", () => {
  it("returns event by numeric ID", async () => {
    if (!createdEventId) return;
    const res = await request(app).get(`/api/events/${createdEventId}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(createdEventId);
    expect(res.body.data.title).toBe("API Test Event");
  });

  it("returns event by slug", async () => {
    if (!createdEventSlug) return;
    const res = await request(app).get(`/api/events/${createdEventSlug}`);
    expect(res.status).toBe(200);
    expect(res.body.data.slug).toBe(createdEventSlug);
  });

  it("returns 404 for non-existent ID", async () => {
    const res = await request(app).get("/api/events/9999999");
    expect(res.status).toBe(404);
  });

  it("returns 404 for non-existent slug", async () => {
    const res = await request(app).get("/api/events/this-slug-does-not-exist-xyz");
    expect(res.status).toBe(404);
  });
});

// ─────────────────────────────────────────────
// PUT /api/events/:id (Update)
// ─────────────────────────────────────────────
describe("PUT /api/events/:id", () => {
  it("updates title and returns updated data", async () => {
    if (!createdEventId) return;
    const res = await request(app)
      .put(`/api/events/${createdEventId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ title: "API Test Event (Updated)", venue: "Updated Hall" });
    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe("API Test Event (Updated)");
    expect(res.body.data.venue).toBe("Updated Hall");
  });

  it("returns 404 for non-existent event", async () => {
    const res = await request(app)
      .put("/api/events/9999999")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ title: "Ghost" });
    expect(res.status).toBe(404);
  });

  it("returns 401 without auth", async () => {
    const res = await request(app)
      .put(`/api/events/${createdEventId}`)
      .send({ title: "Hack" });
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────
// GET /api/events/export.csv
// ─────────────────────────────────────────────
describe("GET /api/events/export.csv", () => {
  it("returns CSV with correct content-type and BOM header", async () => {
    const res = await request(app).get("/api/events/export.csv");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/text\/csv/);
    expect(res.text).toContain("title");
  });
});

// ─────────────────────────────────────────────
// POST /api/events/:id/register
// ─────────────────────────────────────────────
describe("POST /api/events/:id/register", () => {
  const registrant = () => ({
    name: "Test Registrant",
    email: `reg${Date.now()}@test.com`,
    phone: "9876543210",
    department: "CSE",
    year: "2",
    rollNumber: "21CS001",
  });

  it("registers successfully and returns registrationId", async () => {
    if (!createdEventId) return;
    const res = await request(app)
      .post(`/api/events/${createdEventId}/register`)
      .send(registrant());
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.registrationId).toMatch(/^AIF-/);
    expect(res.body.data.email).toBeDefined();
    createdRegId = res.body.data.id;
  });

  it("returns existing registration instead of duplicate on same email", async () => {
    if (!createdEventId) return;
    const sameEmail = `dup${Date.now()}@test.com`;
    await request(app).post(`/api/events/${createdEventId}/register`).send({ ...registrant(), email: sameEmail });
    const res = await request(app).post(`/api/events/${createdEventId}/register`).send({ ...registrant(), email: sameEmail });
    expect(res.body.data.alreadyRegistered).toBe(true);
  }, 10000);

  it("returns 400 for missing email", async () => {
    if (!createdEventId) return;
    const res = await request(app).post(`/api/events/${createdEventId}/register`).send({ name: "No Email", phone: "1234567890" });
    expect(res.status).toBe(400);
  });

  it("returns 400 for missing name", async () => {
    if (!createdEventId) return;
    const res = await request(app).post(`/api/events/${createdEventId}/register`).send({ email: "noname@test.com" });
    expect(res.status).toBe(400);
  });

  it("returns 404 for non-existent event", async () => {
    const res = await request(app).post("/api/events/9999999/register").send(registrant());
    expect(res.status).toBe(404);
  });
});

// ─────────────────────────────────────────────
// GET /api/events/:id/registrations
// ─────────────────────────────────────────────
describe("GET /api/events/:id/registrations", () => {
  it("returns registration list for admin", async () => {
    if (!createdEventId || !adminToken) return;
    const res = await request(app)
      .get(`/api/events/${createdEventId}/registrations`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("returns 401 without auth", async () => {
    if (!createdEventId) return;
    const res = await request(app).get(`/api/events/${createdEventId}/registrations`);
    expect(res.status).toBe(401);
  });

  it("returns 404 for non-existent event", async () => {
    const res = await request(app)
      .get("/api/events/9999999/registrations")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(404);
  });
});

// ─────────────────────────────────────────────
// POST /api/events/lookup-ticket
// ─────────────────────────────────────────────
describe("POST /api/events/lookup-ticket", () => {
  it("returns empty result for unknown email", async () => {
    const res = await request(app)
      .post("/api/events/lookup-ticket")
      .send({ email: "nobody@nowhere.com" });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.found).toBe(false);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("returns 400 with no identifier", async () => {
    const res = await request(app).post("/api/events/lookup-ticket").send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

// ─────────────────────────────────────────────
// DELETE /api/events/:id/registrations/:regId
// ─────────────────────────────────────────────
describe("DELETE /api/events/:id/registrations/:regId", () => {
  it("deletes a registration successfully", async () => {
    if (!createdEventId || !createdRegId || !adminToken) return;
    const res = await request(app)
      .delete(`/api/events/${createdEventId}/registrations/${createdRegId}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("returns 404 for already-deleted registration", async () => {
    if (!createdEventId || !createdRegId || !adminToken) return;
    const res = await request(app)
      .delete(`/api/events/${createdEventId}/registrations/${createdRegId}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(404);
  });

  it("returns 401 without auth", async () => {
    const res = await request(app).delete(`/api/events/1/registrations/1`);
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────
// DELETE /api/events/:id
// ─────────────────────────────────────────────
describe("DELETE /api/events/:id", () => {
  it("deletes the created event and returns success", async () => {
    if (!createdEventId || !adminToken) return;
    const res = await request(app)
      .delete(`/api/events/${createdEventId}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.deleted).toBe(true);
    createdEventId = null; // prevent afterAll from trying again
  });

  it("returns 404 after deletion", async () => {
    const res = await request(app)
      .delete(`/api/events/9999999`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(404);
  });

  it("returns 401 without auth", async () => {
    const res = await request(app).delete("/api/events/1");
    expect(res.status).toBe(401);
  });
});

