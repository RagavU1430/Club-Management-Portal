import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import { db, seed } from "./config/db.js";
import { errorHandler, notFound } from "./middleware/error.js";
import { login, me, changePassword, logout, requireAuth } from "./controllers/auth.js";
import { list as eventsList, stats, getOne, create, update, remove, exportCSV, registerForEvent, getEventRegistrations, sendPostponementNotice, exportEventRegistrationsCSV, exportEventRegistrationsExcel, deleteEventRegistration, lookupTicket, getAttendance, toggleAttendance, quickCheckIn, bulkAttendance, exportAttendanceExcel, exportODListExcel } from "./controllers/events.js";
import { list as teamList, roles, create as createTeam, update as updateTeam, remove as removeTeam, clearAll as clearAllTeam } from "./controllers/team.js";
import { getGoogleSheetSettings, updateGoogleSheetSettings, syncAllSheets, syncSingleEventSheet, getEmailSettings, updateEmailSettings, sendTestEmailController } from "./controllers/settings.js";
import { getClubDetails, updateClubDetails, listActivities, createActivity, updateActivity, deleteActivity } from "./controllers/club.js";
import { listGames, createGame, updateGame, deleteGame } from "./controllers/games.js";
import { upload } from "./middleware/upload.js";
import { sendSubscriptionWelcomeEmail } from "./services/emailService.js";
import sendConfirmationHandler from "../../api/send-confirmation.js";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 4000;

// Rate limiting for auth brute-force defense
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many login attempts. Please try again after 15 minutes." },
});

// Rate limiting for public registration & ticket lookup to protect Gmail SMTP quotas
const registrationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 submissions per IP per 15 mins
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many registration requests. Please wait a few minutes before trying again." },
});

// ── middleware ──
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
    // Allow requests with no origin (like mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);

    // Explicitly allow ai-frontier-club.vercel.app and preview domains
    if (
      origin === "https://ai-frontier-club.vercel.app" ||
      origin.endsWith(".vercel.app") ||
      allowedOrigins.some(o => origin === o || origin.endsWith(o.replace(/^https?:\/\//, "")))
    ) {
      return callback(null, true);
    }
    return callback(new Error("Origin is not allowed by CORS."));
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

// ── database init ──
seed();

// ── routes ──
// Auth (public with rate limiting)
app.post("/api/auth/login", authLimiter, login);
app.get("/api/auth/me", requireAuth, me);
app.post("/api/auth/change-password", requireAuth, changePassword);
app.post("/api/auth/logout", logout);

app.get("/api/events", eventsList);
app.get("/api/events/stats", stats);
app.get("/api/events/export.csv", exportCSV);
app.get("/api/events/:idOrSlug", getOne);
app.post("/api/events", requireAuth, create);
app.put("/api/events/:id", requireAuth, update);
app.delete("/api/events/:id", requireAuth, remove);

// Event Registrations & Excel/CSV Response Recording
app.post("/api/events/lookup-ticket", registrationLimiter, lookupTicket);
app.post("/api/events/:id/register", registrationLimiter, registerForEvent);
app.all("/api/send-confirmation", registrationLimiter, sendConfirmationHandler);
app.get("/api/events/:id/registrations", requireAuth, getEventRegistrations);
app.post("/api/events/:id/postponement-notice", requireAuth, sendPostponementNotice);
app.get("/api/events/:id/registrations/export.csv", requireAuth, exportEventRegistrationsCSV);
app.get("/api/events/:id/registrations/export.xlsx", requireAuth, exportEventRegistrationsExcel);
app.delete("/api/events/:id/registrations/:regId", requireAuth, deleteEventRegistration);

// Event Attendance Tracking & OD Generator
app.get("/api/events/:id/attendance", requireAuth, getAttendance);
app.patch("/api/events/:id/attendance/:regId", requireAuth, toggleAttendance);
app.post("/api/events/:id/attendance/quick-checkin", requireAuth, quickCheckIn);
app.post("/api/events/:id/attendance/bulk", requireAuth, bulkAttendance);
app.get("/api/events/:id/attendance/export.xlsx", requireAuth, exportAttendanceExcel);
app.get("/api/events/:id/attendance/export-od.xlsx", requireAuth, exportODListExcel);

// Google Sheets Live Sync & Configuration
app.get("/api/settings/google-sheets", requireAuth, getGoogleSheetSettings);
app.post("/api/settings/google-sheets", requireAuth, updateGoogleSheetSettings);
app.post("/api/settings/google-sheets/sync", requireAuth, syncAllSheets);
app.post("/api/events/:id/sync-sheet", requireAuth, syncSingleEventSheet);

// Gmail & Email Notification Configuration
app.get("/api/settings/email", requireAuth, getEmailSettings);
app.post("/api/settings/email", requireAuth, updateEmailSettings);
app.post("/api/settings/email/test", requireAuth, sendTestEmailController);

app.get("/api/team", teamList);
app.get("/api/team/roles", roles);
app.post("/api/team", requireAuth, createTeam);
app.put("/api/team/:id", requireAuth, updateTeam);
app.delete("/api/team/:id", requireAuth, removeTeam);
app.delete("/api/team", requireAuth, clearAllTeam);

// ── Club Details & Activities ──
app.get("/api/club-details", getClubDetails);
app.put("/api/club-details", requireAuth, updateClubDetails);

app.get("/api/activities", listActivities);
app.post("/api/activities", requireAuth, createActivity);
app.put("/api/activities/:id", requireAuth, updateActivity);
app.delete("/api/activities/:id", requireAuth, deleteActivity);

// ── Event Games (public read, admin manage) ──
app.get("/api/games", listGames);
app.post("/api/games", requireAuth, createGame);
app.put("/api/games/:id", requireAuth, updateGame);
app.delete("/api/games/:id", requireAuth, deleteGame);

// ── File Upload Handler ──
app.post("/api/upload", requireAuth, upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, error: "No file was uploaded." });
  const url = `/uploads/${req.file.filename}`;
  res.status(201).json({ success: true, url });
});

// ── Newsletter Subscription & Notification Management ──
app.post("/api/subscribe", async (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  if (!email || !email.includes("@") || !email.includes(".")) {
    return res.status(400).json({ success: false, error: "Please provide a valid email address." });
  }

  try {
    const existing = db.prepare("SELECT id FROM subscribers WHERE email = ?").get(email);
    if (!existing) {
      db.prepare("INSERT INTO subscribers (email) VALUES (?)").run(email);
      // Send welcome email in background
      sendSubscriptionWelcomeEmail(email).catch(() => {});
    }

    res.json({
      success: true,
      message: "Subscribed! You will be automatically notified whenever a new event is announced.",
    });
  } catch (err) {
    res.status(500).json({ success: false, error: "Subscription failed. Please try again." });
  }
});

app.get("/api/subscribers", requireAuth, (_req, res) => {
  const rows = db.prepare("SELECT * FROM subscribers ORDER BY id DESC").all();
  res.json({ success: true, data: rows });
});

app.delete("/api/subscribers/:id", requireAuth, (req, res) => {
  const id = Number(req.params.id);
  db.prepare("DELETE FROM subscribers WHERE id = ?").run(id);
  deleteSubscriberFromFirestore(id).catch(err => console.warn("[Firestore] delete subscriber failed:", err.message));
  res.json({ success: true, message: "Subscriber removed." });
});

app.get("/api/health", (_req, res) => res.json({ success: true, uptime: process.uptime() }));

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`[server] listening on http://127.0.0.1:${PORT}`);

  // ── Keep-Alive Ping (Prevents Render Free-Tier from going to sleep) ──
  const keepAliveTarget = process.env.RENDER_EXTERNAL_URL || (process.env.NODE_ENV === "production" ? "https://aifrontier-api.onrender.com" : null);
  if (keepAliveTarget) {
    const PING_INTERVAL = 14 * 60 * 1000; // Ping every 14 minutes
    setInterval(() => {
      fetch(`${keepAliveTarget.replace(/\/$/, "")}/api/health`)
        .then(() => console.log("[keep-alive] Pinged health endpoint to maintain warm container."))
        .catch(err => console.warn("[keep-alive] Ping error:", err.message));
    }, PING_INTERVAL);
  }
});
