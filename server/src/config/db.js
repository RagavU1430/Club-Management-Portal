import Database from "better-sqlite3";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// In-process SQLite — runs everywhere, no install, zero network.
const db = new Database(path.join(__dirname, "../../data/aifrontier.db"));
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// ── schemas ──
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL DEFAULT 'Admin',
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin',
    last_login_at TEXT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%S','now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%S','now'))
  );

  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    date TEXT NOT NULL,
    end_date TEXT,
    venue TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL,
    summary TEXT NOT NULL DEFAULT '',
    image TEXT NOT NULL DEFAULT '',
    registration_link TEXT NOT NULL DEFAULT '',
    tags TEXT NOT NULL DEFAULT '[]',
    status TEXT NOT NULL DEFAULT 'published',
    featured INTEGER NOT NULL DEFAULT 0,
    capacity INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%S','now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%S','now'))
  );

  CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
  CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
  CREATE INDEX IF NOT EXISTS idx_events_slug ON events(slug);

  CREATE TABLE IF NOT EXISTS team_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    department TEXT NOT NULL DEFAULT '',
    photo TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL DEFAULT '',
    phone TEXT NOT NULL DEFAULT '',
    linkedin TEXT NOT NULL DEFAULT '',
    github TEXT NOT NULL DEFAULT '',
    bio TEXT NOT NULL DEFAULT '',
    "order" INTEGER NOT NULL DEFAULT 0,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%S','now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%S','now'))
  );

  CREATE INDEX IF NOT EXISTS idx_team_role ON team_members(role);
  CREATE INDEX IF NOT EXISTS idx_team_active ON team_members(active);

  CREATE TABLE IF NOT EXISTS forms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    event_id INTEGER,
    fields TEXT NOT NULL DEFAULT '[]',
    published INTEGER NOT NULL DEFAULT 1,
    submission_count INTEGER NOT NULL DEFAULT 0,
    closes_at TEXT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%S','now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%S','now')),
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    form_id INTEGER NOT NULL,
    event_id INTEGER,
    answers TEXT NOT NULL DEFAULT '[]',
    submitted_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%S','now')),
    ip TEXT,
    user_agent TEXT,
    referrer TEXT,
    FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL
  );

  CREATE INDEX IF NOT EXISTS idx_submissions_form ON submissions(form_id);

  CREATE TABLE IF NOT EXISTS event_registrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    team_name TEXT NOT NULL DEFAULT '',
    member1 TEXT NOT NULL DEFAULT '',
    member2 TEXT NOT NULL DEFAULT '',
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL DEFAULT '',
    member2_phone TEXT NOT NULL DEFAULT '',
    college TEXT NOT NULL DEFAULT '',
    roll_number TEXT NOT NULL DEFAULT '',
    year TEXT NOT NULL DEFAULT '',
    notes TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%S','now')),
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_registrations_event ON event_registrations(event_id);
`);

// Safe migrations
try { db.exec("ALTER TABLE events ADD COLUMN webhook_url TEXT DEFAULT ''"); } catch {}
try { db.exec("ALTER TABLE event_registrations ADD COLUMN team_name TEXT DEFAULT ''"); } catch {}
try { db.exec("ALTER TABLE event_registrations ADD COLUMN member1 TEXT DEFAULT ''"); } catch {}
try { db.exec("ALTER TABLE event_registrations ADD COLUMN member2 TEXT DEFAULT ''"); } catch {}
try { db.exec("ALTER TABLE event_registrations ADD COLUMN member2_phone TEXT DEFAULT ''"); } catch {}
try { db.exec("ALTER TABLE event_registrations ADD COLUMN department TEXT DEFAULT ''"); } catch {}
try { db.exec("ALTER TABLE event_registrations ADD COLUMN attended INTEGER DEFAULT 0"); } catch {}
try { db.exec("ALTER TABLE event_registrations ADD COLUMN checked_in_at TEXT DEFAULT ''"); } catch {}
try { db.exec("ALTER TABLE event_registrations ADD COLUMN section TEXT DEFAULT ''"); } catch {}
try { db.exec("ALTER TABLE event_registrations ADD COLUMN member2_email TEXT DEFAULT ''"); } catch {}
try { db.exec("ALTER TABLE event_registrations ADD COLUMN member2_roll_number TEXT DEFAULT ''"); } catch {}
try { db.exec("ALTER TABLE games ADD COLUMN is_live INTEGER NOT NULL DEFAULT 0"); } catch {}
try { db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_registrations_event_email ON event_registrations(event_id, email COLLATE NOCASE)"); } catch {}

// Settings table for global configs (e.g. Google Sheets webhook)
db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%S','now'))
  );

  CREATE TABLE IF NOT EXISTS subscribers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%S','now'))
  );

  CREATE INDEX IF NOT EXISTS idx_subscribers_email ON subscribers(email);

  CREATE TABLE IF NOT EXISTS club_details (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    name TEXT NOT NULL,
    department TEXT NOT NULL,
    tagline TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    vision TEXT NOT NULL DEFAULT '',
    mission TEXT NOT NULL DEFAULT '',
    founded_year TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL DEFAULT '',
    phone TEXT NOT NULL DEFAULT '',
    location TEXT NOT NULL DEFAULT '',
    social_links TEXT NOT NULL DEFAULT '{}',
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%S','now'))
  );

  CREATE TABLE IF NOT EXISTS club_activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    photo TEXT NOT NULL DEFAULT '',
    date TEXT NOT NULL DEFAULT '',
    category TEXT NOT NULL DEFAULT 'Workshop',
    description TEXT NOT NULL DEFAULT '',
    "order" INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%S','now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%S','now'))
  );

  CREATE INDEX IF NOT EXISTS idx_activities_date ON club_activities(date);

  CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    game_url TEXT NOT NULL DEFAULT '',
    event_id INTEGER REFERENCES events(id) ON DELETE SET NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    is_live INTEGER NOT NULL DEFAULT 0,
    "order" INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%S','now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%S','now'))
  );

  CREATE INDEX IF NOT EXISTS idx_games_event ON games(event_id);
`);

// Initialize default Google Sheet URL and ID if not exists
const defaultSheetUrl = "https://docs.google.com/spreadsheets/d/1MUkixf7X2_5cYzZJm1dL1atzRK2sIPxLpgKDGV7rTYk/edit?usp=sharing";
const defaultSheetId = "1MUkixf7X2_5cYzZJm1dL1atzRK2sIPxLpgKDGV7rTYk";

const existingUrl = db.prepare("SELECT value FROM settings WHERE key = 'google_sheet_url'").get();
if (!existingUrl) {
  db.prepare("INSERT INTO settings (key, value) VALUES ('google_sheet_url', ?)").run(defaultSheetUrl);
  db.prepare("INSERT INTO settings (key, value) VALUES ('google_sheet_id', ?)").run(defaultSheetId);
}

// Initialize default club details if not exists or migrate legacy text
const existingClub = db.prepare("SELECT * FROM club_details WHERE id = 1").get();
const cleanClubData = {
  name: "AI Frontier Club",
  department: "Artificial Intelligence & Data Science",
  tagline: "Where Curious Minds Learn, Code, and Build with AI",
  description: "The premier collegiate student & developer guild exploring, learning, and building with Artificial Intelligence and Data Science.",
  vision: "To empower students to master artificial intelligence through hands-on coding, open-source projects, and collaborative hackathons.",
  mission: "Equip students with deep learning, machine learning, and computer vision skills to build high-impact real-world systems.",
  founded_year: "2021",
  email: "aifrontierclub@gmail.com",
  phone: "+91 9360376757",
  location: "Center for AI Excellence, Department of AI & DS",
  social_links: JSON.stringify({
    linkedin: "https://linkedin.com",
    github: "https://github.com",
    instagram: "https://instagram.com",
    discord: "https://discord.gg",
  }),
};

if (!existingClub) {
  db.prepare(`
    INSERT INTO club_details (id, name, department, tagline, description, vision, mission, founded_year, email, phone, location, social_links)
    VALUES (1, @name, @department, @tagline, @description, @vision, @mission, @founded_year, @email, @phone, @location, @social_links)
  `).run(cleanClubData);
} else {
  // Ensure email and phone stay updated
  if (existingClub.email?.includes("contact@aifrontierclub.org") || existingClub.phone?.includes("98765")) {
    db.prepare("UPDATE club_details SET email = 'aifrontierclub@gmail.com', phone = '+91 9360376757' WHERE id = 1").run();
  }
}


function rowToJSON(row) {
  if (!row) return null;
  const json = JSON.parse(JSON.stringify(row));
  for (const key of Object.keys(json)) {
    if (typeof json[key] === "string" && (json[key].startsWith("[") || json[key].startsWith("{"))) {
      try { json[key] = JSON.parse(json[key]); } catch {}
    }
  }
  return json;
}

export { db, rowToJSON };
export default db;

// ── seed (dev only) ──
import bcrypt from "bcryptjs";

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
