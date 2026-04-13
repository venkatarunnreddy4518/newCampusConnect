import { AsyncLocalStorage } from "node:async_hooks";
import mysql from "mysql2/promise";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

dotenv.config();

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
      "enable_whatsapp",
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
      "enable_whatsapp",
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
      "enable_whatsapp",
      "created_by",
      "created_at",
      "updated_at",
    ],
    booleanColumns: ["is_live", "enable_whatsapp"],
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
    columns: ["id", "user_id", "registration_id", "event_name", "event_date", "reminder_status", "reminder_sent_at", "created_at"],
    writable: ["reminder_status", "reminder_sent_at"],
    insertable: ["id", "user_id", "registration_id", "event_name", "event_date", "reminder_status", "reminder_sent_at", "created_at"],
  },
  whatsapp_messages: {
    primaryKey: "id",
    columns: ["id", "user_id", "phone_number", "event_id", "message_type", "message_body", "status", "whatsapp_message_id", "error_message", "sent_at", "created_at"],
    writable: ["status", "whatsapp_message_id", "error_message", "sent_at"],
    insertable: ["id", "user_id", "phone_number", "event_id", "message_type", "message_body", "status", "whatsapp_message_id", "error_message", "sent_at", "created_at"],
  },
  whatsapp_settings: {
    primaryKey: "id",
    columns: ["id", "key", "value", "description", "updated_at"],
    writable: ["value", "description", "updated_at"],
    insertable: ["id", "key", "value", "description", "updated_at"],
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

// MySQL connection pool
let pool = null;
const transactionStorage = new AsyncLocalStorage();

async function getPool() {
  if (pool) {
    return pool;
  }

  const config = {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "3306"),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "campusconnect",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    decimalNumbers: true,
  };

  pool = await mysql.createPool(config);
  return pool;
}

async function withConnection(callback) {
  const activeConnection = transactionStorage.getStore();
  if (activeConnection) {
    return callback(activeConnection);
  }

  const resolvedPool = await getPool();
  const connection = await resolvedPool.getConnection();
  try {
    return await callback(connection);
  } finally {
    connection.release();
  }
}

// SQLite-compatible wrapper for MySQL
export class DatabaseWrapper {
  prepare(sql) {
    return {
      get: async (...params) => {
        try {
          return await withConnection(async (connection) => {
            const [rows] = await connection.execute(sql, params);
            return rows && rows.length > 0 ? rows[0] : undefined;
          });
        } catch (error) {
          console.error("Database error:", error);
          throw error;
        }
      },
      all: async (...params) => {
        try {
          return await withConnection(async (connection) => {
            const [rows] = await connection.execute(sql, params);
            return rows || [];
          });
        } catch (error) {
          console.error("Database error:", error);
          throw error;
        }
      },
      run: async (...params) => {
        try {
          return await withConnection(async (connection) => {
            const [result] = await connection.execute(sql, params);
            return {
              changes: result.affectedRows ?? 0,
              lastID: result.insertId ?? 0,
            };
          });
        } catch (error) {
          console.error("Database error:", error);
          throw error;
        }
      },
    };
  }

  async exec(sql) {
    try {
      await withConnection(async (connection) => {
        await connection.query(sql);
      });
    } catch (error) {
      console.error("Database exec error:", error);
      // Ignore errors for already-existing tables
      if (!error.message.includes("already exists") && !error.message.includes("ER_TABLE_EXISTS_ERROR")) {
        throw error;
      }
    }
  }

  async close() {
    if (pool) {
      await pool.end();
      pool = null;
    }
  }
}

export const db = new DatabaseWrapper();

export function nowIso(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  const pad = (part) => String(part).padStart(2, "0");

  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join("-") + ` ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export async function runInTransaction(callback) {
  const resolvedPool = await getPool();
  const connection = await resolvedPool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await transactionStorage.run(connection, () => callback(connection));
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
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

export async function initializeDatabase() {
  try {
    const sql = readFileSync(SQL_INIT_PATH, "utf8");
    // Split SQL into individual statements
    const statements = sql.split(";").filter(stmt => stmt.trim());
    
    const pool = await getPool();
    const connection = await pool.getConnection();
    try {
      for (const statement of statements) {
        const trimmed = statement.trim();
        if (trimmed) {
          try {
            await connection.query(trimmed);
          } catch (error) {
            // Ignore "already exists" errors
            if (!error.message.includes("already exists") && !error.message.includes("ER_TABLE_EXISTS_ERROR")) {
              console.error("Error executing statement:", trimmed.substring(0, 100));
              console.error(error);
            }
          }
        }
      }
    } finally {
      connection.release();
    }
    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Failed to initialize database:", error);
    throw error;
  }
}

export function fileExists(filepath) {
  return existsSync(filepath);
}
