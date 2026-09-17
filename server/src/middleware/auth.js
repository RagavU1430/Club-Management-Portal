import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { ApiError, asyncHandler } from "../utils/http.js";

const SECRET = process.env.JWT_SECRET || "dev-only-insecure-secret-change-me";
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

if (!process.env.JWT_SECRET) {
  console.warn("[auth] JWT_SECRET not set — using an insecure development default.");
}

export function signToken(user) {
  return jwt.sign({ sub: String(user._id), role: user.role, email: user.email }, SECRET, { expiresIn: EXPIRES_IN });
}

function readToken(req) {
  const header = req.headers.authorization || "";
  if (header.startsWith("Bearer ")) return header.slice(7).trim();
  if (req.cookies?.token) return req.cookies.token;
  if (req.query?.token) return req.query.token;
  return null;
}

/** Blocks the request unless a valid, non-expired token identifies an existing user. */
export const requireAuth = asyncHandler(async (req, _res, next) => {
  const token = readToken(req);
  if (!token) throw new ApiError(401, "Sign in to continue.");

  let payload;
  try {
    payload = jwt.verify(token, SECRET);
  } catch (err) {
    throw new ApiError(401, err.name === "TokenExpiredError" ? "Your session expired. Sign in again." : "Invalid session.");
  }

  const user = await User.findById(payload.sub);
  if (!user) throw new ApiError(401, "Account no longer exists.");

  req.user = user;
  next();
});

/** Role gate — used for destructive admin-only actions. */
export const requireRole = (...roles) => (req, _res, next) => {
  if (!req.user || !roles.includes(req.user.role)) return next(new ApiError(403, "You don't have permission to do that."));
  next();
};