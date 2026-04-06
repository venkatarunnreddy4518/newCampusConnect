import { DatabaseSync } from "node:sqlite";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const ROOT_DIR = path.resolve(__dirname, "..");
export const LOCAL_DIR = path.join(ROOT_DIR, ".local");
export const DB_PATH = path.join(LOCAL_DIR, "campusconnect.sqlite");
export const UPLOADS_DIR = path.join(ROOT_DIR, "uploads");
export const DIST_DIR = path.join(ROOT_DIR, "dist");

mkdirSync(LOCAL_DIR, { recursive: true });
mkdirSync(UPLOADS_DIR, { recursive: true });

export const APP_ROLES = ["admin", "moderator", "user"];
export const PERMISSION_TYPES = [
  "event_manager",
  "club_manager",
  "registration_manager",
  "content_moderator",
];

export const TABLES = {
  users: {
    primaryKey: "id",
    columns: ["id", "email", "password_hash", "created_at"],
  },
  sessions: {
    primaryKey: "id",
    columns: ["id", "user_id", "created_at", "expires_at"],
  },
  profiles: {
    primaryKey: "id",
    columns: [
      "id",
      "full_name",
      "email",
      "avatar_url",
      "year",
      "github_url",
      "linkedin_url",
      "gmail_url",
      "achievements",
      "created_at",
      "updated_at",
    ],
    writable: ["full_name", "email", "avatar_url", "year", "github_url", "linkedin_url", "gmail_url", "achievements"],
    insertable: [
      "id",
      "full_name",
      "email",
      "avatar_url",
      "year",
      "github_url",
      "linkedin_url",
      "gmail_url",
      "achievements",
      "created_at",
      "updated_at",
    ],
    jsonColumns: ["achievements"],
  },
  user_roles: {
    primaryKey: "id",
    columns: ["id", "user_id", "role"],
    writable: ["role"],
    insertable: ["id", "user_id", "role"],
  },
  permissions: {
    primaryKey: "id",
    columns: ["id", "user_id", "permission", "scope", "resource_id", "granted_by", "granted_at"],
    writable: ["permission", "scope", "resource_id", "granted_by"],
    insertable: ["id", "user_id", "permission", "scope", "resource_id", "granted_by", "granted_at"],
  },
  events: {
    primaryKey: "id",
    columns: [
      "id",
      "name",
      "date",
      "venue",
      "description",
      "category",
      "is_live",
      "stream_url",
      "poster_url",
      "trailer_url",
      "max_capacity",
      "created_by",
      "created_at",
      "updated_at",
    ],
    writable: [
      "name",
      "date",
      "venue",
      "description",
      "category",
      "is_live",
      "stream_url",
      "poster_url",
      "trailer_url",
      "max_capacity",
    ],
    insertable: [
      "id",
      "name",
      "date",
      "venue",
      "description",
      "category",
      "is_live",
      "stream_url",
      "poster_url",
      "trailer_url",
      "max_capacity",
      "created_by",
      "created_at",
      "updated_at",
    ],
    booleanColumns: ["is_live"],
  },
  clubs: {
    primaryKey: "id",
    columns: [
      "id",
      "name",
      "description",
      "category",
      "poster_url",
      "trailer_url",
      "max_members",
      "created_by",
      "created_at",
      "updated_at",
    ],
    writable: ["name", "description", "category", "poster_url", "trailer_url", "max_members"],
    insertable: [
      "id",
      "name",
      "description",
      "category",
      "poster_url",
      "trailer_url",
      "max_members",
      "created_by",
      "created_at",
      "updated_at",
    ],
  },
  club_memberships: {
    primaryKey: "id",
    columns: ["id", "club_id", "user_id", "role", "status", "joined_at"],
    writable: ["role", "status"],
    insertable: ["id", "club_id", "user_id", "role", "status", "joined_at"],
  },
  registrations: {
    primaryKey: "id",
    columns: [
      "id",
      "user_id",
      "event_name",
      "event_category",
      "event_date",
      "event_venue",
      "registered_at",
      "status",
    ],
    writable: ["status"],
    insertable: [
      "id",
      "user_id",
      "event_name",
      "event_category",
      "event_date",
      "event_venue",
      "registered_at",
      "status",
    ],
  },
  notifications: {
    primaryKey: "id",
    columns: ["id", "user_id", "title", "message", "type", "is_read", "created_at"],
    writable: ["title", "message", "type", "is_read"],
    insertable: ["id", "user_id", "title", "message", "type", "is_read", "created_at"],
    booleanColumns: ["is_read"],
  },
  site_settings: {
    primaryKey: "key",
    columns: ["key", "value", "updated_at"],
    writable: ["value"],
    insertable: ["key", "value", "updated_at"],
  },
  live_matches: {
    primaryKey: "id",
    columns: [
      "id",
      "sport",
      "match_format",
      "team_a",
      "team_b",
      "score_a",
      "score_b",
      "wickets_a",
      "wickets_b",
      "overs_a",
      "overs_b",
      "extras_a",
      "extras_b",
      "status",
      "detail",
      "batting_team",
      "created_by",
      "created_at",
      "updated_at",
    ],
    writable: [
      "sport",
      "match_format",
      "team_a",
      "team_b",
      "score_a",
      "score_b",
      "wickets_a",
      "wickets_b",
      "overs_a",
      "overs_b",
      "extras_a",
      "extras_b",
      "status",
      "detail",
      "batting_team",
    ],
    insertable: [
      "id",
      "sport",
      "match_format",
      "team_a",
      "team_b",
      "score_a",
      "score_b",
      "wickets_a",
      "wickets_b",
      "overs_a",
      "overs_b",
      "extras_a",
      "extras_b",
      "status",
      "detail",
      "batting_team",
      "created_by",
      "created_at",
      "updated_at",
    ],
  },
  match_scorecard: {
    primaryKey: "id",
    columns: [
      "id",
      "match_id",
      "team",
      "player_name",
      "role",
      "runs",
      "balls",
      "fours",
      "sixes",
      "strike_rate",
      "overs_bowled",
      "maidens",
      "runs_conceded",
      "wickets_taken",
      "economy",
      "dismissal",
      "batting_order",
      "created_at",
    ],
    writable: [
      "team",
      "player_name",
      "role",
      "runs",
      "balls",
      "fours",
      "sixes",
      "strike_rate",
      "overs_bowled",
      "maidens",
      "runs_conceded",
      "wickets_taken",
      "economy",
      "dismissal",
      "batting_order",
    ],
    insertable: [
      "id",
      "match_id",
      "team",
      "player_name",
      "role",
      "runs",
      "balls",
      "fours",
      "sixes",
      "strike_rate",
      "overs_bowled",
      "maidens",
      "runs_conceded",
      "wickets_taken",
      "economy",
      "dismissal",
      "batting_order",
      "created_at",
    ],
  },
};

export const db = new DatabaseSync(DB_PATH);

db.exec("PRAGMA foreign_keys = ON;");
db.exec("PRAGMA journal_mode = WAL;");

export function nowIso() {
  return new Date().toISOString();
}

export function runInTransaction(callback) {
  db.exec("BEGIN");
  try {
    const result = callback();
    db.exec("COMMIT");
    return result;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function assertTable(table) {
  if (!TABLES[table]) {
    throw new Error(`Unsupported table: ${table}`);
  }
  return TABLES[table];
}

export function assertColumn(table, column) {
  const config = assertTable(table);
  if (!config.columns.includes(column)) {
    throw new Error(`Unsupported column "${column}" for table "${table}"`);
  }
}

export function normalizeRecord(table, row) {
  if (!row) {
    return row;
  }

  const config = assertTable(table);
  const normalized = { ...row };

  for (const column of config.booleanColumns || []) {
    normalized[column] = Boolean(normalized[column]);
  }

  for (const column of config.jsonColumns || []) {
    try {
      const parsed = JSON.parse(normalized[column] ?? "[]");
      normalized[column] = Array.isArray(parsed) && parsed.length > 0 ? parsed : [];
    } catch {
      normalized[column] = [];
    }
  }

  return normalized;
}

export function normalizeRecords(table, rows) {
  return rows.map((row) => normalizeRecord(table, row));
}

export function sanitizeInput(table, input, mode) {
  const config = assertTable(table);
  const allowed = mode === "insert" ? config.insertable || [] : config.writable || [];
  const output = {};

  for (const key of allowed) {
    if (!(key in input)) {
      continue;
    }

    let value = input[key];
    output[key] = value;
  }

  return output;
}

export function serializeRecord(table, record) {
  const config = assertTable(table);
  const output = { ...record };

  for (const column of config.booleanColumns || []) {
    if (column in output) {
      output[column] = output[column] ? 1 : 0;
    }
  }

  for (const column of config.jsonColumns || []) {
    if (column in output) {
      output[column] = JSON.stringify(Array.isArray(output[column]) ? output[column] : []);
    }
  }

  return output;
}

function createSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      full_name TEXT,
      email TEXT,
      avatar_url TEXT,
      year TEXT,
      github_url TEXT,
      linkedin_url TEXT,
      gmail_url TEXT,
      achievements TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_roles (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role TEXT NOT NULL CHECK (role IN ('admin', 'moderator', 'user')),
      UNIQUE (user_id, role)
    );

    CREATE TABLE IF NOT EXISTS permissions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      permission TEXT NOT NULL CHECK (permission IN ('event_manager', 'club_manager', 'registration_manager', 'content_moderator')),
      scope TEXT NOT NULL DEFAULT 'global',
      resource_id TEXT,
      granted_by TEXT REFERENCES users(id) ON DELETE SET NULL,
      granted_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      date TEXT NOT NULL,
      venue TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL DEFAULT 'Sports',
      is_live INTEGER NOT NULL DEFAULT 0,
      stream_url TEXT,
      poster_url TEXT,
      trailer_url TEXT,
      max_capacity INTEGER,
      created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS clubs (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL DEFAULT 'General',
      poster_url TEXT,
      trailer_url TEXT,
      max_members INTEGER,
      created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS club_memberships (
      id TEXT PRIMARY KEY,
      club_id TEXT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role TEXT NOT NULL DEFAULT 'member',
      status TEXT NOT NULL DEFAULT 'pending',
      joined_at TEXT NOT NULL,
      UNIQUE (club_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS registrations (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      event_name TEXT NOT NULL,
      event_category TEXT NOT NULL,
      event_date TEXT,
      event_venue TEXT,
      registered_at TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('registered', 'attended', 'cancelled', 'approved', 'rejected'))
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'info',
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS site_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS live_matches (
      id TEXT PRIMARY KEY,
      sport TEXT NOT NULL DEFAULT 'Cricket',
      match_format TEXT NOT NULL DEFAULT 'T20',
      team_a TEXT NOT NULL,
      team_b TEXT NOT NULL,
      score_a INTEGER NOT NULL DEFAULT 0,
      score_b INTEGER NOT NULL DEFAULT 0,
      wickets_a INTEGER NOT NULL DEFAULT 0,
      wickets_b INTEGER NOT NULL DEFAULT 0,
      overs_a TEXT NOT NULL DEFAULT '0.0',
      overs_b TEXT NOT NULL DEFAULT '0.0',
      extras_a INTEGER NOT NULL DEFAULT 0,
      extras_b INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'upcoming',
      detail TEXT,
      batting_team TEXT NOT NULL DEFAULT 'A',
      created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS match_scorecard (
      id TEXT PRIMARY KEY,
      match_id TEXT NOT NULL REFERENCES live_matches(id) ON DELETE CASCADE,
      team TEXT NOT NULL,
      player_name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'batsman',
      runs INTEGER DEFAULT 0,
      balls INTEGER DEFAULT 0,
      fours INTEGER DEFAULT 0,
      sixes INTEGER DEFAULT 0,
      strike_rate REAL DEFAULT 0,
      overs_bowled TEXT,
      maidens INTEGER DEFAULT 0,
      runs_conceded INTEGER DEFAULT 0,
      wickets_taken INTEGER DEFAULT 0,
      economy REAL DEFAULT 0,
      dismissal TEXT,
      batting_order INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );
  `);
}

function createIndexes() {
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
    CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
    CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
    CREATE INDEX IF NOT EXISTS idx_permissions_user_id ON permissions(user_id);
    CREATE INDEX IF NOT EXISTS idx_permissions_lookup ON permissions(user_id, permission, scope, resource_id);
    CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
    CREATE INDEX IF NOT EXISTS idx_clubs_name ON clubs(name);
    CREATE INDEX IF NOT EXISTS idx_club_memberships_club_id ON club_memberships(club_id);
    CREATE INDEX IF NOT EXISTS idx_club_memberships_user_id ON club_memberships(user_id);
    CREATE INDEX IF NOT EXISTS idx_registrations_user_id ON registrations(user_id);
    CREATE INDEX IF NOT EXISTS idx_registrations_event_name ON registrations(event_name);
    CREATE INDEX IF NOT EXISTS idx_notifications_user_id_created_at ON notifications(user_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_live_matches_status_created_at ON live_matches(status, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_match_scorecard_match_id_order ON match_scorecard(match_id, batting_order);
  `);
}

function seedEvents() {
  const count = db.prepare("SELECT COUNT(*) AS count FROM events").get().count;
  if (count > 0) {
    return;
  }

  const insert = db.prepare(`
    INSERT INTO events (
      id,
      name,
      date,
      venue,
      description,
      category,
      is_live,
      stream_url,
      poster_url,
      trailer_url,
      max_capacity,
      created_at,
      updated_at
    ) VALUES (
      @id,
      @name,
      @date,
      @venue,
      @description,
      @category,
      @is_live,
      @stream_url,
      @poster_url,
      @trailer_url,
      @max_capacity,
      @created_at,
      @updated_at
    )
  `);

  const now = nowIso();
  const events = [
    {
      id: "seed-event-cricket-finals",
      name: "Cricket Tournament Finals",
      date: "2026-03-12",
      venue: "Main Ground",
      description: "The grand finale of inter-department cricket. CSE vs ECE battle it out for the championship title.",
      category: "Sports",
      is_live: 1,
      stream_url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      poster_url: null,
      trailer_url: null,
      max_capacity: null,
      created_at: now,
      updated_at: now,
    },
    {
      id: "seed-event-hackathon",
      name: "Hackathon 2026",
      date: "2026-03-15",
      venue: "CS Lab Block",
      description: "24-hour coding marathon. Build innovative solutions to real-world problems.",
      category: "Technical",
      is_live: 0,
      stream_url: null,
      poster_url: null,
      trailer_url: null,
      max_capacity: null,
      created_at: now,
      updated_at: now,
    },
    {
      id: "seed-event-cultural-fest",
      name: "Annual Cultural Fest",
      date: "2026-03-20",
      venue: "Open Air Theatre",
      description: "Music, dance, drama and art, the biggest cultural celebration of the year.",
      category: "Cultural",
      is_live: 0,
      stream_url: null,
      poster_url: null,
      trailer_url: null,
      max_capacity: null,
      created_at: now,
      updated_at: now,
    },
    {
      id: "seed-event-ai-workshop",
      name: "AI/ML Workshop",
      date: "2026-03-10",
      venue: "Seminar Hall A",
      description: "Hands-on workshop on building machine learning models with Python and TensorFlow.",
      category: "Workshops",
      is_live: 1,
      stream_url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      poster_url: null,
      trailer_url: null,
      max_capacity: null,
      created_at: now,
      updated_at: now,
    },
    {
      id: "seed-event-basketball",
      name: "Basketball League",
      date: "2026-03-18",
      venue: "Indoor Stadium",
      description: "Inter-college basketball league quarter-finals.",
      category: "Sports",
      is_live: 0,
      stream_url: null,
      poster_url: null,
      trailer_url: null,
      max_capacity: null,
      created_at: now,
      updated_at: now,
    },
    {
      id: "seed-event-web-bootcamp",
      name: "Web Dev Bootcamp",
      date: "2026-03-22",
      venue: "IT Block Room 204",
      description: "Learn React, TypeScript and modern web development practices.",
      category: "Workshops",
      is_live: 0,
      stream_url: null,
      poster_url: null,
      trailer_url: null,
      max_capacity: null,
      created_at: now,
      updated_at: now,
    },
  ];

  runInTransaction(() => {
    for (const item of events) {
      insert.run(item);
    }
  });
}

function seedClubs() {
  const count = db.prepare("SELECT COUNT(*) AS count FROM clubs").get().count;
  if (count > 0) {
    return;
  }

  const insert = db.prepare(`
    INSERT INTO clubs (
      id,
      name,
      description,
      category,
      poster_url,
      trailer_url,
      max_members,
      created_at,
      updated_at
    ) VALUES (
      @id,
      @name,
      @description,
      @category,
      @poster_url,
      @trailer_url,
      @max_members,
      @created_at,
      @updated_at
    )
  `);

  const now = nowIso();
  const clubs = [
    {
      id: "seed-club-coding",
      name: "Coding Club",
      description: "Learn programming, participate in hackathons, and build cool projects together.",
      category: "Technical",
      poster_url: null,
      trailer_url: null,
      max_members: null,
      created_at: now,
      updated_at: now,
    },
    {
      id: "seed-club-robotics",
      name: "Robotics Club",
      description: "Design, build and program robots. Compete in national robotics competitions.",
      category: "Technical",
      poster_url: null,
      trailer_url: null,
      max_members: null,
      created_at: now,
      updated_at: now,
    },
    {
      id: "seed-club-photography",
      name: "Photography Club",
      description: "Capture campus life through the lens. Weekly photo walks and editing workshops.",
      category: "Creative",
      poster_url: null,
      trailer_url: null,
      max_members: null,
      created_at: now,
      updated_at: now,
    },
    {
      id: "seed-club-music",
      name: "Music Club",
      description: "Jam sessions, band practice, and live performances at campus events.",
      category: "Creative",
      poster_url: null,
      trailer_url: null,
      max_members: null,
      created_at: now,
      updated_at: now,
    },
    {
      id: "seed-club-debate",
      name: "Debate Society",
      description: "Sharpen your public speaking and argumentation skills in weekly debates.",
      category: "Literary",
      poster_url: null,
      trailer_url: null,
      max_members: null,
      created_at: now,
      updated_at: now,
    },
    {
      id: "seed-club-sports",
      name: "Sports Committee",
      description: "Organize inter-department tournaments and manage sports facilities.",
      category: "Sports",
      poster_url: null,
      trailer_url: null,
      max_members: null,
      created_at: now,
      updated_at: now,
    },
    {
      id: "seed-club-entrepreneurship",
      name: "Entrepreneurship Cell",
      description: "Ideate, innovate and launch startups. Mentorship from industry leaders.",
      category: "Business",
      poster_url: null,
      trailer_url: null,
      max_members: null,
      created_at: now,
      updated_at: now,
    },
    {
      id: "seed-club-drama",
      name: "Drama Club",
      description: "Theatre productions, street plays, and acting workshops throughout the year.",
      category: "Creative",
      poster_url: null,
      trailer_url: null,
      max_members: null,
      created_at: now,
      updated_at: now,
    },
  ];

  runInTransaction(() => {
    for (const item of clubs) {
      insert.run(item);
    }
  });
}

function seedSiteSettings() {
  const existing = db.prepare("SELECT key FROM site_settings WHERE key = ?").get("hero_video_url");
  if (existing) {
    return;
  }

  db.prepare("INSERT INTO site_settings (key, value, updated_at) VALUES (?, ?, ?)").run("hero_video_url", "", nowIso());
}

export function initializeDatabase() {
  createSchema();
  createIndexes();
  seedEvents();
  seedClubs();
  seedSiteSettings();
}

export function fileExists(filepath) {
  return existsSync(filepath);
}
