# 📄 Product Requirements Document (PRD)
## AI Frontier Club Management Portal

---

## 1. Executive Summary & Vision
The **AI Frontier Club Management Portal** is a high-performance, web-based platform designed for collegiate clubs and technical communities (specifically the Department of Artificial Intelligence & Data Science). It empowers club coordinators to manage hackathons, technical symposiums, workshops, and core team rosters, while providing students and participants with an immersive, cyberpunk-inspired registration portal with real-time Gmail confirmation delivery and spreadsheet exports.

---

## 2. Target Users & Stakeholders

| User Role | Description | Key Objectives |
|---|---|---|
| **Public / Students** | Prospective attendees & hackathon participants | Browse upcoming events, register 2-member teams with department & year, receive instant Gmail confirmation pass |
| **Club Coordinators** | Student organizers & club leads | Showcase team profiles, organize department activities, manage participant lists |
| **Faculty & Admins** | Department heads, faculty advisors, chief admins | Publish events, download real-time Excel/CSV attendee rosters, monitor sync with Google Sheets & Firebase |

---

## 3. Core Functional Requirements

### 3.1 Public Portal & Event Discovery
- **Hero & Cyberpunk Aesthetic**: High-energy video background hero, neon glassmorphism UI, interactive terminal emulator, and responsive navigation.
- **Events Showcase**: Filter events by status (Upcoming, Ongoing, Completed) and category (Hackathon, Workshop, Symposium, Seminar).
- **Team Roster**: Display executive leads, student coordinators, domain heads, and faculty coordinators with social links (LinkedIn, GitHub, Email).
- **Club Activities & Mission**: Interactive cards detailing ongoing club domains (GenAI, ML, Robotics, Web3).

### 3.2 Event Registration System
- **2-Member Team Registration**:
  - Team Name
  - Participant 1 (Team Lead Full Name + Lead Email Address)
  - Participant 2 (Member 2 Full Name + Member 2 Email Address)
  - Department Selection (14 predefined engineering and sciences streams)
  - Year of Study (1st Year, 2nd Year, 3rd Year)
  - Additional Notes / Skills (Optional)
- **Instant Email Pass Dispatch**: Automated branded HTML registration ticket dispatched to the Team Lead and Member 2 via Gmail SMTP.
- **Duplicate Prevention**: Rejects duplicate registrations for the same event and email address.

### 3.3 Admin Console & Operations
- **Secure Authentication**: Role-based access control (Admin / Coordinator) with rate-limited login defense.
- **Event Lifecycle Management**: Create, edit, publish, schedule, and delete events with capacity parameters.
- **Registrations & Attendee Management**:
  - Live modal to inspect all registered teams.
  - Real-time search by Team Name, Lead Name, Member 2, Email, Department, and Year.
  - Delete / remove registered attendee entries.
- **Data Export & Synchronizations**:
  - **Direct Microsoft Excel Export (`.xlsx`)**: One-click download with auto-fitted columns.
  - **CSV Export (`.csv`)**: UTF-8 BOM compatible spreadsheet.
  - **Live Google Sheets Webhook Sync**: Real-time push to Google Apps Script webhook.
  - **Firebase Cloud Firestore Sync**: Automated cloud mirroring.
- **Coordinator & Club Management**: Add, update, reorder, and remove club coordinators with photo uploads.
- **Email Gateway Config**: Configure Gmail sender credentials, test SMTP connectivity, and customize sender name.

---

## 4. Non-Functional Requirements

### 4.1 Performance & Reliability
- **Sub-Second Page Loads**: Vite bundling with chunk splitting and lazy-loaded modules.
- **Optimized Video Backgrounds**: Video compression with fallback poster backgrounds.
- **High Concurrency**: SQLite with WAL (Write-Ahead Logging) and non-blocking asynchronous email queues.

### 4.2 Security & Data Integrity
- **JWT Authentication**: HttpOnly token validation with secret hashing and expiration.
- **Brute-force Protection**: Express rate limiting on `/api/auth/login` (10 requests per 15 minutes).
- **Environment Isolation**: Zero hardcoded credentials in codebase; strict `.env` file management ignored by git.
- **Input Sanitization**: Email lowercasing, SQL parameterized queries via `better-sqlite3` preventing SQL injection.

---

## 5. Success Metrics & KPIs
1. **Zero Registration Loss**: 100% of successful form submissions recorded in database and exported accurately.
2. **Email Delivery Speed**: Automated confirmation pass delivered to attendee inbox within 5 seconds of registration.
3. **Admin Usability**: Coordinators can export complete participant Excel sheets in under 3 seconds on event day.
