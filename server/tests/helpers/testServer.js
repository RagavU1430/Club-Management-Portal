/**
 * Test server factory — starts the Express app on a random port
 * so multiple test suites don't conflict with each other or
 * with a running dev server.
 */

import "dotenv/config";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { db, seed } from "../../src/config/db.js";
import { errorHandler, notFound } from "../../src/middleware/error.js";
import { login, me, changePassword, logout, requireAuth } from "../../src/controllers/auth.js";
import {
  list as eventsList, stats, getOne, create, update, remove, exportCSV,
  registerForEvent, getEventRegistrations, sendPostponementNotice,
  exportEventRegistrationsCSV, exportEventRegistrationsExcel,
  deleteEventRegistration, lookupTicket, getAttendance, toggleAttendance,
  quickCheckIn, bulkAttendance, exportAttendanceExcel, exportODListExcel,
} from "../../src/controllers/events.js";
import {
  list as teamList, roles, create as createTeam, update as updateTeam,
  remove as removeTeam, clearAll as clearAllTeam,
} from "../../src/controllers/team.js";
import {
  getClubDetails, updateClubDetails, listActivities,
  createActivity, updateActivity, deleteActivity,
} from "../../src/controllers/club.js";
import { listGames, createGame, updateGame, deleteGame } from "../../src/controllers/games.js";
import { upload } from "../../src/middleware/upload.js";
import { sendSubscriptionWelcomeEmail } from "../../src/services/emailService.js";

export async function createTestServer({ skipRateLimiting = false } = {}) {
  const app = express();

  // Disable X-Powered-By (security best practice)
  app.disable("x-powered-by");

  // In API functional tests we bypass rate limiting so valid requests aren't
  // blocked by earlier brute-force security tests running in the same worker.
  // Security suites call createTestServer() with skipRateLimiting=false (default).
  const makeLimit = (max, message) =>
    skipRateLimiting
      ? rateLimit({ windowMs: 1000, max: 100000, standardHeaders: false, legacyHeaders: false })
      : rateLimit({ windowMs: 15 * 60 * 1000, max, standardHeaders: true, legacyHeaders: false, message });

  const authLimiter = makeLimit(10, { success: false, error: "Too many login attempts. Please try again after 15 minutes." });
  const registrationLimiter = makeLimit(20, { success: false, error: "Too many registration requests. Please wait a few minutes before trying again." });

  const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
    "https://ai-frontier-club.vercel.app",
    process.env.CLIENT_URL,
  ].filter(Boolean);

  const corsOptions = {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        /^https:\/\/ai-frontier-club[\w-]*\.vercel\.app$/.test(origin)
      ) {
        return callback(null, true);
      }
      return callback(Object.assign(new Error("CORS: Origin not allowed."), { status: 403 }));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
    optionsSuccessStatus: 200,
  };

  app.use(cors(corsOptions));
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use("/uploads", express.static(process.env.UPLOAD_DIR || "uploads"));

  // Seed DB (no-op if already seeded)
  try { seed(); } catch { /* ignore in test env */ }

  // Auth routes
  app.post("/api/auth/login", authLimiter, login);
  app.get("/api/auth/me", requireAuth, me);
  app.post("/api/auth/change-password", requireAuth, changePassword);
  app.post("/api/auth/logout", logout);

  // Event routes
  app.get("/api/events", eventsList);
  app.get("/api/events/stats", stats);
  app.get("/api/events/export.csv", exportCSV);
  app.get("/api/events/:idOrSlug", getOne);
  app.post("/api/events", requireAuth, create);
  app.put("/api/events/:id", requireAuth, update);
  app.delete("/api/events/:id", requireAuth, remove);

  // Event registrations
  app.post("/api/events/lookup-ticket", registrationLimiter, lookupTicket);
  app.post("/api/events/:id/register", registrationLimiter, registerForEvent);
  app.get("/api/events/:id/registrations", requireAuth, getEventRegistrations);
  app.post("/api/events/:id/postponement-notice", requireAuth, sendPostponementNotice);
  app.get("/api/events/:id/registrations/export.csv", requireAuth, exportEventRegistrationsCSV);
  app.get("/api/events/:id/registrations/export.xlsx", requireAuth, exportEventRegistrationsExcel);
  app.delete("/api/events/:id/registrations/:regId", requireAuth, deleteEventRegistration);

  // Attendance
  app.get("/api/events/:id/attendance", requireAuth, getAttendance);
  app.patch("/api/events/:id/attendance/:regId", requireAuth, toggleAttendance);
  app.post("/api/events/:id/attendance/quick-checkin", requireAuth, quickCheckIn);
  app.post("/api/events/:id/attendance/bulk", requireAuth, bulkAttendance);
  app.get("/api/events/:id/attendance/export.xlsx", requireAuth, exportAttendanceExcel);
  app.get("/api/events/:id/attendance/export-od.xlsx", requireAuth, exportODListExcel);

  // Team
  app.get("/api/team", teamList);
  app.get("/api/team/roles", roles);
  app.post("/api/team", requireAuth, createTeam);
  app.put("/api/team/:id", requireAuth, updateTeam);
  app.delete("/api/team/:id", requireAuth, removeTeam);
  app.delete("/api/team", requireAuth, clearAllTeam);

  // Club details & activities
  app.get("/api/club-details", getClubDetails);
  app.put("/api/club-details", requireAuth, updateClubDetails);
  app.get("/api/activities", listActivities);
  app.post("/api/activities", requireAuth, createActivity);
  app.put("/api/activities/:id", requireAuth, updateActivity);
  app.delete("/api/activities/:id", requireAuth, deleteActivity);

  // Games
  app.get("/api/games", listGames);
  app.post("/api/games", requireAuth, createGame);
  app.put("/api/games/:id", requireAuth, updateGame);
  app.delete("/api/games/:id", requireAuth, deleteGame);

  // File upload
  app.post("/api/upload", requireAuth, upload.single("file"), (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, error: "No file was uploaded." });
    const url = `/uploads/${req.file.filename}`;
    res.status(201).json({ success: true, url });
  });

  // Subscribe
  // RFC5322-lite regex — blocks spaces, HTML chars, and bare @domain formats
  const EMAIL_REGEX = /^[^\s@<>"'&;,]{1,64}@[^\s@<>"'&;,]+\.[^\s@<>"'&;,]{2,}$/;

  app.post("/api/subscribe", async (req, res) => {
    const email = String(req.body?.email || "").trim().toLowerCase();
    if (!email || email.length > 254 || !EMAIL_REGEX.test(email)) {
      return res.status(400).json({ success: false, error: "Please provide a valid email address." });
    }
    try {
      const existing = db.prepare("SELECT id FROM subscribers WHERE email = ?").get(email);
      if (!existing) {
        db.prepare("INSERT INTO subscribers (email) VALUES (?)").run(email);
        sendSubscriptionWelcomeEmail(email).catch(() => {});
      }
      res.json({ success: true, message: "Subscribed!" });
    } catch {
      res.status(500).json({ success: false, error: "Subscription failed." });
    }
  });

  app.get("/api/subscribers", requireAuth, (_req, res) => {
    const rows = db.prepare("SELECT * FROM subscribers ORDER BY id DESC").all();
    res.json({ success: true, data: rows });
  });

  app.delete("/api/subscribers/:id", requireAuth, (req, res) => {
    const id = Number(req.params.id);
    db.prepare("DELETE FROM subscribers WHERE id = ?").run(id);
    res.json({ success: true, message: "Subscriber removed." });
  });

  app.get("/api/health", (_req, res) => res.json({ success: true, uptime: process.uptime() }));

  app.use(notFound);
  app.use(errorHandler);

  const server = app.listen(0); // 0 = random available port
  return { app, server };
}
