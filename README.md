# AI Frontier Club - Club Management Portal

A full-stack, responsive club portal for the **Department of Artificial Intelligence & Data Science**. Built with a modern interactive UI, scroll-driven dynamic particle canvas, light & dark theme toggling, event registration system with Excel/spreadsheet syncing, and an administrative management dashboard.

## 🚀 Features

- **Interactive Scroll Hero & Dynamic Video Background**: Smooth scroll-scrubbed canvas rendering 3D particle animations.
- **Dual Theme Support**: Modern high-end Light Theme (pearl & slate) and Cyberpunk Dark Theme (OLED obsidian & neon accents) with instant persistence.
- **Innovation Tracks**: Showcases collegiate AI tracks:
  - Generative AI & Large Language Models
  - Computer Vision & Deep Learning
  - Data Science & Machine Learning
  - Hackathons, Sprints & Bootcamps
- **Interactive CLI Terminal**: Browser-based interactive terminal for system status, simulated AI model testing, and summits.
- **Events & Registration Portal**:
  - Live filter by status (All, Upcoming, Past) and keyword search.
  - Interactive registration modal connected to SQLite database and organizer roster.
- **Coordinators Directory**:
  - Searchable coordinator cards with expand-on-hover contact drawers, email copy, and social links.
- **Club Activities & Field Dispatches**:
  - Photo gallery showcasing club workshops, industrial visits, and hackathons.
- **Administrative Management Console (`/admin`)**:
  - Event creation, editing, and attendee roster management.
  - Coordinator management.
  - Club activities photo upload and basic club details editing.

## 🛠 Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Framer Motion, Lucide React
- **Backend**: Node.js, Express, SQLite (better-sqlite3), Multer, JSON Web Tokens (JWT)

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

Copy `.env.example` to `.env` in the `server` directory:
```bash
cd server
cp .env.example .env
```

### 3. Run in Development Mode

From the root directory:
```bash
npm run dev
```

- Client will run on: `http://localhost:5173`
- Backend API will run on: `http://localhost:5000`

### 4. Build for Production

```bash
cd client
npm run build
```
