// Load .env before any test runs
import "dotenv/config";

// Set test-specific environment
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = process.env.JWT_SECRET || "dev-only-insecure-secret-change-me";
