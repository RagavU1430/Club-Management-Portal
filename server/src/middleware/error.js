import { ApiError, validationDetails } from "../utils/http.js";

export function notFound(req, _res, next) {
  next(new ApiError(404, `No route matches ${req.method} ${req.originalUrl}`));
}

/* eslint-disable no-unused-vars */
export function errorHandler(err, req, res, _next) {
  let status = err.status || err.statusCode || 500;
  let message = err.message || "Something went wrong on our end.";
  let details = err.details || validationDetails(err);

  if (err.name === "CastError") {
    status = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }
  if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyValue || { field: "value" })[0];
    message = `That ${field} is already taken.`;
    details = { [field]: "Already in use" };
  }
  if (err.name === "MulterError") {
    status = 400;
    message = err.code === "LIMIT_FILE_SIZE" ? "Image is too large (max 5 MB)." : err.message;
  }

  if (status >= 500) console.error("[error]", err);
  res.status(status).json({ success: false, message, ...(details ? { details } : {}) });
}