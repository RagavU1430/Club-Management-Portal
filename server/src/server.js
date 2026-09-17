import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import { db, seed } from "./config/db.js";
import { errorHandler, notFound } from "./middleware/error.js";
import { login, me, changePassword, logout, requireAuth } from "./controllers/auth.js";
import { list as eventsList, stats, getOne, create, update, remove, exportCSV, registerForEvent, getEventRegistrations, exportEventRegistrationsCSV, exportEventRegistrationsExcel, deleteEventRegistration } from "./controllers/events.js";
import { list as teamList, roles, create as createTeam, update as updateTeam, remove as removeTeam, clearAll as clearAllTeam } from "./controllers/team.js";
import { getGoogleSheetSettings, updateGoogleSheetSettings, syncAllSheets, syncSingleEventSheet, getMessengerSettings, updateMessengerSettings, sendTestSmsController, getEmailSettings, updateEmailSettings, sendTestEmailController } from "./controllers/settings.js";
import { getClubDetails, updateClubDetails, listActivities, createActivity, updateActivity, deleteActivity } from "./controllers/club.js";
import { upload } from "./middleware/upload.js";
import { initFirebase, isFirebaseReady } from "./config/firebase.js";
import { syncAllToFirestore } from "./services/firestoreService.js";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 4000;

// Rate limiting for auth brute-force defense
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many attempts. Please try again after 15 minutes." },
});

// ── middleware ──
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173", credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(process.env.UPLOAD_DIR || "uploads"));

// ── database & firebase init ──
seed();
initFirebase();
syncAllToFirestore().catch(err => console.warn("[Firebase] Initial sync error:", err.message));

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
app.post("/api/events/:id/register", registerForEvent);
app.get("/api/events/:id/registrations", requireAuth, getEventRegistrations);
app.get("/api/events/:id/registrations/export.csv", requireAuth, exportEventRegistrationsCSV);
app.get("/api/events/:id/registrations/export.xlsx", requireAuth, exportEventRegistrationsExcel);
app.delete("/api/events/:id/registrations/:regId", requireAuth, deleteEventRegistration);

// Google Sheets Live Sync & Configuration
app.get("/api/settings/google-sheets", requireAuth, getGoogleSheetSettings);
app.post("/api/settings/google-sheets", requireAuth, updateGoogleSheetSettings);
app.post("/api/settings/google-sheets/sync", requireAuth, syncAllSheets);
app.post("/api/events/:id/sync-sheet", requireAuth, syncSingleEventSheet);

// SMS & WhatsApp Gateway Configuration & Real SMS Testing
app.get("/api/settings/messenger", requireAuth, getMessengerSettings);
app.post("/api/settings/messenger", requireAuth, updateMessengerSettings);
app.post("/api/settings/messenger/test", requireAuth, sendTestSmsController);

// Gmail & Email Notification Configuration
app.get("/api/settings/email", requireAuth, getEmailSettings);
app.post("/api/settings/email", requireAuth, updateEmailSettings);
app.post("/api/settings/email/test", requireAuth, sendTestEmailController);

// Firebase Cloud Firestore Status
app.get("/api/settings/firebase", requireAuth, (_req, res) => {
  res.json({
    success: true,
    data: {
      isConfigured: isFirebaseReady(),
      provider: "Cloud Firestore (Firebase Admin SDK)",
      projectId: process.env.FIREBASE_PROJECT_ID || "aifrontier-firebase",
    },
  });
});

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

// ── File Upload Handler ──
app.post("/api/upload", requireAuth, upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, error: "No file was uploaded." });
  const url = `/uploads/${req.file.filename}`;
  res.status(201).json({ success: true, url });
});

app.get("/api/health", (_req, res) => res.json({ success: true, uptime: process.uptime() }));

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`[server] listening on :${PORT}`);
});
