/** Small helpers shared by every route: uniform success/error envelopes + async wrapper. */

export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

/** Wrap async route handlers so rejected promises hit the error middleware. */
export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export const ok = (res, data, meta) => res.json({ success: true, data, ...(meta ? { meta } : {}) });

export const created = (res, data) => res.status(201).json({ success: true, data });

/** Converts a Mongoose validation error into a field->message map. */
export function validationDetails(err) {
  if (err?.name !== "ValidationError") return undefined;
  return Object.fromEntries(
    Object.entries(err.errors).map(([field, e]) => [field, e.message])
  );
}

export function slugify(input = "") {
  return input
    .toString()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Escapes user text that gets embedded in a CSV cell. */
export function csvCell(value) {
  const str = value === null || value === undefined ? "" : Array.isArray(value) ? value.join("; ") : String(value);
  return /[",\n\r]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}