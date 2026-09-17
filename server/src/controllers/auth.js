import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db, rowToJSON } from "../config/db.js";
import { ApiError } from "../utils/http.js";

const SECRET = process.env.JWT_SECRET || "dev-only-insecure-secret-change-me";
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

export function signToken(user) {
  return jwt.sign({ sub: String(user.id), role: user.role, email: user.email }, SECRET, { expiresIn: EXPIRES_IN });
}

export function requireAuth(req, _res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : (req.query?.token || null);
  if (!token) return next(new ApiError(401, "Sign in to continue."));
  let payload;
  try { payload = jwt.verify(token, SECRET); }
  catch (err) { return next(new ApiError(401, err.name === "TokenExpiredError" ? "Your session expired." : "Invalid session.")); }
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(payload.sub);
  if (!user) return next(new ApiError(401, "Account no longer exists."));
  req.user = user;
  next();
}

export async function login(req, res) {
  const { email, password } = req.body || {};
  if (!email || !password) throw new ApiError(400, "Email and password are required.");
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email.trim().toLowerCase());
  if (!user || !bcrypt.compareSync(password, user.password_hash)) throw new ApiError(401, "Email or password is incorrect.");
  db.prepare("UPDATE users SET last_login_at = ? WHERE id = ?").run(new Date().toISOString(), user.id);
  const safe = rowToJSON(user); delete safe.password_hash;
  res.json({ success: true, data: { token: signToken(safe), user: safe } });
}

export async function me(req, res) {
  const safe = rowToJSON(req.user); delete safe.password_hash;
  res.json({ success: true, data: { user: safe } });
}

export async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body || {};
  if (!newPassword || newPassword.length < 8) throw new ApiError(400, "New password must be at least 8 characters.");
  const user = db.prepare("SELECT password_hash FROM users WHERE id = ?").get(req.user.id);
  if (!bcrypt.compareSync(currentPassword, user.password_hash)) throw new ApiError(401, "Current password is incorrect.");
  db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(bcrypt.hashSync(newPassword, 12), req.user.id);
  res.json({ success: true, data: { message: "Password updated." } });
}

export async function logout(_req, res) {
  res.json({ success: true, data: { message: "Signed out." } });
}

const SEED = [
  { name: "Admin", email: "admin@localhost", password: "admin123", role: "admin" },
];

export function seed() {
  for (const s of SEED) {
    if (!db.prepare("SELECT id FROM users WHERE email = ?").get(s.email)) {
      db.prepare("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)").run(s.name, s.email, bcrypt.hashSync(s.password, 12), s.role);
    }
  }
  console.log("[seed] default admin: admin@localhost / admin123");
}
