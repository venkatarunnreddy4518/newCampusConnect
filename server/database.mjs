import { DatabaseSync } from "node:sqlite";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const ROOT_DIR = path.resolve(__dirname, "..");
export const LOCAL_DIR = path.join(ROOT_DIR, ".local");
export const DB_PATH = path.join(LOCAL_DIR, "campusconnect.sqlite");
export const UPLOADS_DIR = path.join(ROOT_DIR, "uploads");
export const DIST_DIR = path.join(ROOT_DIR, "dist");
export const SQL_INIT_PATH = path.join(ROOT_DIR, "database", "init.sql");

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
  event_reminders: {
    primaryKey: "id",
    columns: [
      "id",
      "user_id",
      "registration_id",
      "event_name",
      "event_date",
      "reminder_status",
      "reminder_sent_at",
      "created_at",
    ],
    writable: ["reminder_status", "reminder_sent_at"],
    insertable: [
      "id",
      "user_id",
      "registration_id",
      "event_name",
      "event_date",
      "reminder_status",
      "reminder_sent_at",
      "created_at",
    ],
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

export function initializeDatabase() {
  const sql = readFileSync(SQL_INIT_PATH, "utf8");
  db.exec(sql);
}

export function fileExists(filepath) {
  return existsSync(filepath);
}
