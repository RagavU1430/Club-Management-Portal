# AI Frontier Club — Club Management Portal

A full-stack, production-ready club portal for the **Department of Artificial Intelligence & Data Science**. Built with a modern interactive UI, scroll-driven dynamic particle canvas, light & dark theme toggling, event registration system with Excel export, an administrative management dashboard, and a **comprehensive security + API test suite**.

[![Tests](https://img.shields.io/badge/tests-227%20passing-brightgreen)](#-testing)
[![Security](https://img.shields.io/badge/security-110%20scenarios-blue)](#-security-testing)
[![API](https://img.shields.io/badge/api%20coverage-117%20tests-blue)](#-api-testing)

---

## 🚀 Features

- **Interactive Scroll Hero & Dynamic Video Background** — Smooth scroll-scrubbed canvas rendering 3D particle animations.
- **Dual Theme Support** — Modern high-end Light Theme (pearl & slate) and Cyberpunk Dark Theme (OLED obsidian & neon accents) with instant persistence.
- **Innovation Tracks** — Showcases collegiate AI tracks:
  - Generative AI & Large Language Models
  - Computer Vision & Deep Learning
  - Data Science & Machine Learning
  - Hackathons, Sprints & Bootcamps
- **Interactive CLI Terminal** — Browser-based interactive terminal for system status, simulated AI model testing, and summits.
- **Events & Registration Portal**:
  - Live filter by status (All, Upcoming, Past) and keyword search.
  - Interactive registration modal connected to SQLite database.
  - Excel (`.xlsx`) and CSV export of attendee rosters.
  - Automatic email confirmation to registrants.
  - Ticket lookup by email or team name.
- **Coordinators Directory** — Searchable coordinator cards with expand-on-hover contact drawers, email copy, and social links.
- **Club Activities & Field Dispatches** — Photo gallery showcasing club workshops, industrial visits, and hackathons.
- **Mini-Games Hub** — Embedded browser-based AI games, toggleable live/active states.
- **Newsletter Subscription** — Email subscription with automatic new-event notifications.
- **Administrative Management Console (`/admin`)**:
  - Event creation, editing, and attendee roster management.
  - Coordinator management.
  - Club activities photo upload and club details editing.
  - Subscriber list management.
  - Bulk postponement notice emails to registered participants.

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS, Framer Motion, Lucide React |
| **Backend** | Node.js, Express 5, better-sqlite3 (SQLite), Multer, JWT (jsonwebtoken), bcryptjs |
| **Email** | Nodemailer (Gmail SMTP) |
| **Testing** | Jest, Supertest |
| **Deployment** | Render (backend), Vercel (frontend) |

---

## 📦 Getting Started

### 1. Install Dependencies

```bash
# Root
npm install

# Client
cd client && npm install

# Server
cd ../server && npm install
```

### 2. Configure Environment

Create a `.env` file in the `server/` directory:

```env
PORT=5000
NODE_ENV=development
JWT_SECRET=your_super_secret_key_here
ADMIN_EMAIL=your_admin@email.com
ADMIN_PASSWORD=your_admin_password
GMAIL_USER=your_gmail@gmail.com
GMAIL_APP_PASSWORD=your_gmail_app_password
CLIENT_ORIGIN=http://localhost:5173
UPLOAD_DIR=../uploads
```

### 3. Run in Development Mode

From the root directory:
```bash
npm run dev
```

- **Client**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000`

### 4. Build for Production

```bash
cd client
npm run build
```

---

## 🧪 Testing

The project ships with **227 automated tests** across two categories: security penetration tests and functional API tests.

### Run All Tests

```bash
cd server
npm run test:all
```

### 🛡 Security Testing

**110 tests** simulating real-world attack scenarios against every API surface:

```bash
npm run test:security     # All 110 security tests

# Individual suites
npm run test:auth         # JWT attacks, brute force, SQL injection, credential stuffing
npm run test:events       # XSS, IDOR, mass assignment, CSV injection, prompt injection
npm run test:upload       # MIME bypass, path traversal, shell upload, oversized files
npm run test:general      # CORS bypass, info disclosure, route enumeration
```

| Attack Category | Tests | Coverage |
|-----------------|-------|----------|
| Brute force & rate limiting | 2 | 429 enforcement, rate-limit headers |
| JWT token manipulation | 7 | `alg:none`, wrong secret, expired, tampered payload |
| SQL injection | 6 | 6 different payloads on auth & ticket lookup |
| Credential stuffing | 6 | Common passwords rejected |
| IDOR | 5 | Fake IDs on event CRUD |
| XSS injection | 12 | 6 payloads × events + registration |
| File upload attacks | 9 | MIME bypass, path traversal, null bytes, 6 MB DoS |
| CORS bypass | 4 | Evil origin, null origin, subdomain spoofing |
| Prompt injection | 5 | LLM jailbreak patterns stored safely |
| Route enumeration | 12 | `/wp-admin`, `/.git`, `/.env`, etc. |

#### Vulnerabilities Found & Fixed During Testing

| Bug | Severity | Description | Fix |
|-----|----------|-------------|-----|
| XSS via subscribe email | Medium | `<script>@evil.com` accepted as valid email | Replaced `includes('@')` with strict RFC5322 regex blocking HTML chars |
| CORS error leaking as 500 | Low | Unauthorized origins triggered unhandled 500 with stack trace | Attached `status: 403` to CORS error before callback |

### 🔌 API Testing

**117 tests** covering full CRUD happy paths, validation, auth enforcement, and response schema verification:

```bash
npm run test:api          # All 117 API tests

# Individual suites
npm run test:api:auth     # Login, /me, change-password, logout
npm run test:api:events   # Full events CRUD, registrations, CSV export, ticket lookup
npm run test:api:team     # Team members CRUD, role listing, search/filter
npm run test:api:club     # Club details, activities CRUD
npm run test:api:games    # Games CRUD, active/live toggle, ordering
npm run test:api:subscribe # Subscribe flow, admin list/delete, health endpoint
```

| Suite | Tests | What's Verified |
|-------|-------|-----------------|
| Auth API | 14 | Login response shape, token issuance, `/me` profile, password validation |
| Events API | 37 | CRUD, slug/ID lookup, pagination caps, registrations, CSV export, ticket lookup |
| Team API | 17 | CRUD, role listing (sorted), search/filter, auth enforcement |
| Club API | 17 | Club details get/update, activities CRUD, partial update preservation |
| Games API | 15 | CRUD, active/live toggle, ascending order verification |
| Subscribe API | 17 | Idempotent subscribe, lowercase normalisation, admin list/delete, health < 500ms |

---

## 📁 Project Structure

```
Club/
├── client/                     # React + Vite frontend (TypeScript)
│   └── src/
│       ├── components/         # UI components
│       ├── pages/              # Route pages (Home, Admin, etc.)
│       └── hooks/              # Custom React hooks
├── server/                     # Node.js + Express backend
│   ├── src/
│   │   ├── config/db.js        # SQLite DB setup & seed
│   │   ├── controllers/        # Route handlers (auth, events, team, club, games)
│   │   ├── middleware/         # Auth, upload, error handling
│   │   ├── services/           # Email service (Nodemailer)
│   │   └── server.js           # Express app entry point
│   └── tests/
│       ├── api/                # Functional API test suites (117 tests)
│       └── security/           # Security/penetration test suites (110 tests)
└── uploads/                    # Uploaded event banners & media
```

---

## 🔐 Security Highlights

- **JWT authentication** — All admin routes require a signed JWT (HS256 with env secret).
- **Rate limiting** — Auth endpoint: 10 req/15 min. Registration: 20 req/15 min.
- **Parameterized queries** — No raw SQL string interpolation; immune to SQL injection.
- **Strict file upload validation** — MIME allowlist (JPEG/PNG/WEBP only), 5 MB limit, filename sanitization.
- **CORS whitelist** — Only `ai-frontier-club.vercel.app` and `localhost` origins allowed.
- **No `X-Powered-By`** — Server fingerprinting disabled.
- **No stack traces in production** — Errors return only a message field, never paths or code.
- **XSS-safe email validation** — RFC5322-compliant regex blocks `<>`, `"`, `'`, `;` chars.

---

## 🌐 Live Deployment

| Service | URL |
|---------|-----|
| Frontend | [ai-frontier-club.vercel.app](https://ai-frontier-club.vercel.app) |
| Backend API | Render (configured via `render.yaml`) |

---

## 📄 License

MIT © AI Frontier Club — Department of Artificial Intelligence & Data Science
