import { randomUUID } from "node:crypto";
import { createReadStream, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import http from "node:http";
import path from "node:path";
import {
  DIST_DIR,
  TABLES,
  UPLOADS_DIR,
  assertColumn,
  assertTable,
  db,
  fileExists,
  initializeDatabase,
  normalizeRecord,
  normalizeRecords,
  nowIso,
  runInTransaction,
  sanitizeInput,
  serializeRecord,
} from "./database.mjs";
import {
  SESSION_COOKIE,
  clearSessionCookie,
  createSessionCookie,
  getSessionFromCookie,
  getUserContextFromCookie,
  signIn,
  signOut,
  signUp,
} from "./auth.mjs";

initializeDatabase();

const PORT = Number(process.env.PORT || 3001);
const PUBLIC_TABLES = new Set(["events", "clubs", "club_memberships", "site_settings", "live_matches", "match_scorecard"]);
const PUBLIC_UPLOAD_BUCKETS = new Set(["avatars", "club-posters", "event-posters", "trailer-videos"]);
const TEXT_MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
};

function hasRole(context, role) {
  return Boolean(context?.roles?.includes(role));
}

function hasPermission(context, permission, resourceId = null) {
  if (!context) {
    return false;
  }

  return context.permissions.some((item) => {
    if (item.permission !== permission) {
      return false;
    }

    if (item.scope === "global") {
      return true;
    }

    return resourceId !== null && item.resource_id === resourceId;
  });
}

function canManageEvents(context, resourceId = null) {
  return hasRole(context, "admin")
    || hasPermission(context, "event_manager")
    || hasPermission(context, "event_manager", resourceId)
    || hasPermission(context, "content_moderator");
}

function canManageClubs(context, resourceId = null) {
  return hasRole(context, "admin")
    || hasPermission(context, "club_manager")
    || hasPermission(context, "club_manager", resourceId)
    || hasPermission(context, "content_moderator");
}

function canManageMemberships(context, clubId = null) {
  return hasRole(context, "admin")
    || hasPermission(context, "club_manager")
    || hasPermission(context, "club_manager", clubId);
}

function canManageRegistrations(context) {
  return hasRole(context, "admin") || hasPermission(context, "registration_manager");
}

function canManageMatches(context) {
  return hasRole(context, "admin") || hasRole(context, "moderator");
}

function canSendNotifications(context) {
  return hasRole(context, "admin")
    || hasPermission(context, "club_manager")
    || hasPermission(context, "registration_manager")
    || hasPermission(context, "content_moderator");
}

function canReadRow(table, row, context) {
  if (PUBLIC_TABLES.has(table)) {
    return true;
  }

  switch (table) {
    case "profiles":
      return Boolean(context?.user);
    case "user_roles":
      return Boolean(context?.user) && (hasRole(context, "admin") || row.user_id === context.user.id);
    case "permissions":
      return Boolean(context?.user) && (hasRole(context, "admin") || row.user_id === context.user.id);
    case "notifications":
      return Boolean(context?.user) && row.user_id === context.user.id;
    case "registrations":
      return Boolean(context?.user) && (row.user_id === context.user.id || canManageRegistrations(context));
    default:
      return false;
  }
}

function canCreateRecord(table, record, context) {
  switch (table) {
    case "profiles":
      return Boolean(context?.user) && record.id === context.user.id;
    case "user_roles":
    case "permissions":
      return hasRole(context, "admin");
    case "events":
      return canManageEvents(context, record.id ?? null);
    case "clubs":
      return canManageClubs(context, record.id ?? null);
    case "club_memberships":
      return Boolean(context?.user)
        && (record.user_id === context.user.id || canManageMemberships(context, record.club_id));
    case "registrations":
      return Boolean(context?.user)
        && (record.user_id === context.user.id || canManageRegistrations(context));
    case "notifications":
      return Boolean(context?.user)
        && (record.user_id === context.user.id || canSendNotifications(context));
    case "site_settings":
      return hasRole(context, "admin");
    case "live_matches":
    case "match_scorecard":
      return canManageMatches(context);
    default:
      return false;
  }
}

function canUpdateRow(table, row, context) {
  switch (table) {
    case "profiles":
      return Boolean(context?.user) && row.id === context.user.id;
    case "user_roles":
    case "permissions":
      return hasRole(context, "admin");
    case "events":
      return canManageEvents(context, row.id);
    case "clubs":
      return canManageClubs(context, row.id);
    case "club_memberships":
      return canManageMemberships(context, row.club_id);
    case "registrations":
      return Boolean(context?.user) && (row.user_id === context.user.id || canManageRegistrations(context));
    case "notifications":
      return Boolean(context?.user) && (row.user_id === context.user.id || canSendNotifications(context));
    case "site_settings":
      return hasRole(context, "admin");
    case "live_matches":
    case "match_scorecard":
      return canManageMatches(context);
    default:
      return false;
  }
}

function canDeleteRow(table, row, context) {
  switch (table) {
    case "user_roles":
    case "permissions":
      return hasRole(context, "admin");
    case "events":
      return canManageEvents(context, row.id);
    case "clubs":
      return canManageClubs(context, row.id);
    case "club_memberships":
      return Boolean(context?.user) && (row.user_id === context.user.id || canManageMemberships(context, row.club_id));
    case "registrations":
      return Boolean(context?.user) && (row.user_id === context.user.id || canManageRegistrations(context));
    case "notifications":
      return Boolean(context?.user) && (row.user_id === context.user.id || canSendNotifications(context));
    case "site_settings":
      return hasRole(context, "admin");
    case "live_matches":
    case "match_scorecard":
      return canManageMatches(context);
    default:
      return false;
  }
}

function sortRows(rows, column, ascending = true) {
  assertColumn(rows.tableName || "events", column);
  const direction = ascending === false ? -1 : 1;

  return [...rows].sort((left, right) => {
    const a = left[column];
    const b = right[column];

    if (a == null && b == null) {
      return 0;
    }
    if (a == null) {
      return 1 * direction;
    }
    if (b == null) {
      return -1 * direction;
    }
    if (a < b) {
      return -1 * direction;
    }
    if (a > b) {
      return 1 * direction;
    }
    return 0;
  });
}

function buildFilterClause(table, filters = []) {
  const clauses = [];
  const params = [];

  for (const filter of filters) {
    const { type, column, value } = filter;
    assertColumn(table, column);

    if (type === "eq") {
      if (value === null) {
        clauses.push(`${column} IS NULL`);
      } else {
        clauses.push(`${column} = ?`);
        params.push(value);
      }
      continue;
    }

    if (type === "in") {
      if (!Array.isArray(value) || value.length === 0) {
        clauses.push("1 = 0");
        continue;
      }

      clauses.push(`${column} IN (${value.map(() => "?").join(", ")})`);
      params.push(...value);
      continue;
    }

    throw new Error(`Unsupported filter type: ${type}`);
  }

  return {
    sql: clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "",
    params,
  };
}

function queryRows(table, filters = []) {
  assertTable(table);
  const { sql, params } = buildFilterClause(table, filters);
  const statement = db.prepare(`SELECT * FROM ${table} ${sql}`);
  return normalizeRecords(table, statement.all(...params));
}

function getRowByPrimaryKey(table, value) {
  const config = assertTable(table);
  const statement = db.prepare(`SELECT * FROM ${table} WHERE ${config.primaryKey} = ?`);
  return normalizeRecord(table, statement.get(value));
}

function transformSelectedRows(table, rows, columns) {
  if (table === "club_memberships" && typeof columns === "string" && columns.includes("club:clubs(")) {
    const clubIds = [...new Set(rows.map((row) => row.club_id))];
    const clubs = clubIds.length > 0
      ? queryRows("clubs", [{ type: "in", column: "id", value: clubIds }])
      : [];
    const clubMap = new Map(clubs.map((club) => [club.id, {
      id: club.id,
      name: club.name,
      category: club.category,
      poster_url: club.poster_url,
    }]));

    return rows.map((row) => ({
      id: row.id,
      role: row.role,
      club: clubMap.get(row.club_id) ?? null,
    }));
  }

  return rows;
}

function prepareInsertRecord(table, input, context) {
  const clean = sanitizeInput(table, input, "insert");
  const now = nowIso();

  switch (table) {
    case "profiles":
      return {
        id: clean.id ?? context.user.id,
        full_name: clean.full_name ?? "New User",
        email: clean.email ?? context.user.email ?? null,
        avatar_url: clean.avatar_url ?? null,
        year: clean.year ?? null,
        github_url: clean.github_url ?? null,
        linkedin_url: clean.linkedin_url ?? null,
        gmail_url: clean.gmail_url ?? null,
        achievements: clean.achievements ?? [],
        created_at: clean.created_at ?? now,
        updated_at: clean.updated_at ?? now,
      };
    case "user_roles":
      return {
        id: clean.id ?? randomUUID(),
        user_id: clean.user_id,
        role: clean.role ?? "user",
      };
    case "permissions":
      return {
        id: clean.id ?? randomUUID(),
        user_id: clean.user_id,
        permission: clean.permission,
        scope: clean.scope ?? "global",
        resource_id: clean.resource_id ?? null,
        granted_by: clean.granted_by ?? context.user.id,
        granted_at: clean.granted_at ?? now,
      };
    case "events":
      return {
        id: clean.id ?? randomUUID(),
        name: clean.name,
        date: clean.date,
        venue: clean.venue,
        description: clean.description ?? null,
        category: clean.category ?? "Sports",
        is_live: clean.is_live ?? false,
        stream_url: clean.stream_url ?? null,
        poster_url: clean.poster_url ?? null,
        trailer_url: clean.trailer_url ?? null,
        max_capacity: clean.max_capacity ?? null,
        created_by: clean.created_by ?? context?.user?.id ?? null,
        created_at: clean.created_at ?? now,
        updated_at: clean.updated_at ?? now,
      };
    case "clubs":
      return {
        id: clean.id ?? randomUUID(),
        name: clean.name,
        description: clean.description ?? null,
        category: clean.category ?? "General",
        poster_url: clean.poster_url ?? null,
        trailer_url: clean.trailer_url ?? null,
        max_members: clean.max_members ?? null,
        created_by: clean.created_by ?? context?.user?.id ?? null,
        created_at: clean.created_at ?? now,
        updated_at: clean.updated_at ?? now,
      };
    case "club_memberships":
      return {
        id: clean.id ?? randomUUID(),
        club_id: clean.club_id,
        user_id: clean.user_id,
        role: clean.role ?? "member",
        status: clean.status ?? "pending",
        joined_at: clean.joined_at ?? now,
      };
    case "registrations":
      return {
        id: clean.id ?? randomUUID(),
        user_id: clean.user_id,
        event_name: clean.event_name,
        event_category: clean.event_category,
        event_date: clean.event_date ?? null,
        event_venue: clean.event_venue ?? null,
        registered_at: clean.registered_at ?? now,
        status: clean.status ?? "registered",
      };
    case "notifications":
      return {
        id: clean.id ?? randomUUID(),
        user_id: clean.user_id,
        title: clean.title,
        message: clean.message,
        type: clean.type ?? "info",
        is_read: clean.is_read ?? false,
        created_at: clean.created_at ?? now,
      };
    case "site_settings":
      return {
        key: clean.key,
        value: clean.value ?? "",
        updated_at: clean.updated_at ?? now,
      };
    case "live_matches":
      return {
        id: clean.id ?? randomUUID(),
        sport: clean.sport ?? "Cricket",
        match_format: clean.match_format ?? "T20",
        team_a: clean.team_a,
        team_b: clean.team_b,
        score_a: clean.score_a ?? 0,
        score_b: clean.score_b ?? 0,
        wickets_a: clean.wickets_a ?? 0,
        wickets_b: clean.wickets_b ?? 0,
        overs_a: clean.overs_a ?? "0.0",
        overs_b: clean.overs_b ?? "0.0",
        extras_a: clean.extras_a ?? 0,
        extras_b: clean.extras_b ?? 0,
        status: clean.status ?? "upcoming",
        detail: clean.detail ?? null,
        batting_team: clean.batting_team ?? "A",
        created_by: clean.created_by ?? context?.user?.id ?? null,
        created_at: clean.created_at ?? now,
        updated_at: clean.updated_at ?? now,
      };
    case "match_scorecard":
      return {
        id: clean.id ?? randomUUID(),
        match_id: clean.match_id,
        team: clean.team,
        player_name: clean.player_name,
        role: clean.role ?? "batsman",
        runs: clean.runs ?? 0,
        balls: clean.balls ?? 0,
        fours: clean.fours ?? 0,
        sixes: clean.sixes ?? 0,
        strike_rate: clean.strike_rate ?? 0,
        overs_bowled: clean.overs_bowled ?? null,
        maidens: clean.maidens ?? 0,
        runs_conceded: clean.runs_conceded ?? 0,
        wickets_taken: clean.wickets_taken ?? 0,
        economy: clean.economy ?? 0,
        dismissal: clean.dismissal ?? null,
        batting_order: clean.batting_order ?? 0,
        created_at: clean.created_at ?? now,
      };
    default:
      throw new Error(`Insert not supported for table "${table}"`);
  }
}

function prepareUpdatedRecord(table, row, updates) {
  const clean = sanitizeInput(table, updates, "update");
  const now = nowIso();
  const next = { ...row, ...clean };

  switch (table) {
    case "profiles":
    case "events":
    case "clubs":
    case "site_settings":
    case "live_matches":
      next.updated_at = now;
      break;
    default:
      break;
  }

  return next;
}

function insertRow(table, row) {
  const serialized = serializeRecord(table, row);
  const keys = Object.keys(serialized);
  const values = keys.map((key) => serialized[key]);
  const placeholders = keys.map(() => "?").join(", ");
  const statement = db.prepare(`
    INSERT INTO ${table} (${keys.join(", ")})
    VALUES (${placeholders})
  `);
  statement.run(...values);
}

function updateRow(table, row) {
  const config = assertTable(table);
  const serialized = serializeRecord(table, row);
  const keys = Object.keys(serialized).filter((key) => key !== config.primaryKey);
  const assignments = keys.map((key) => `${key} = ?`).join(", ");
  const values = keys.map((key) => serialized[key]);
  const statement = db.prepare(`
    UPDATE ${table}
    SET ${assignments}
    WHERE ${config.primaryKey} = ?
  `);
  statement.run(...values, serialized[config.primaryKey]);
}

function deleteRows(table, rows) {
  const config = assertTable(table);
  const statement = db.prepare(`
    DELETE FROM ${table}
    WHERE ${config.primaryKey} = ?
  `);

  runInTransaction(() => {
    for (const row of rows) {
      statement.run(row[config.primaryKey]);
    }
  });
}

function selectRecords(table, payload, context) {
  let rows = queryRows(table, payload.filters || []).filter((row) => canReadRow(table, row, context));

  if (payload.orderBy?.column) {
    assertColumn(table, payload.orderBy.column);
    rows.tableName = table;
    rows = sortRows(rows, payload.orderBy.column, payload.orderBy.ascending);
  }

  if (typeof payload.limit === "number") {
    rows = rows.slice(0, payload.limit);
  }

  if (payload.head && payload.count === "exact") {
    return { data: null, count: rows.length, error: null };
  }

  const transformed = transformSelectedRows(table, rows, payload.columns);

  if (payload.single) {
    return transformed.length > 0
      ? { data: transformed[0], error: null }
      : { data: null, error: { message: "Row not found." } };
  }

  if (payload.maybeSingle) {
    return { data: transformed[0] ?? null, error: null };
  }

  return {
    data: transformed,
    count: payload.count === "exact" ? rows.length : null,
    error: null,
  };
}

function insertRecords(table, payload, context) {
  const items = Array.isArray(payload.values) ? payload.values : [payload.values];
  const prepared = items.map((item) => prepareInsertRecord(table, item, context));

  for (const item of prepared) {
    if (!canCreateRecord(table, item, context)) {
      return { data: null, error: { message: "You are not allowed to create this record." } };
    }
  }

  runInTransaction(() => {
    for (const item of prepared) {
      insertRow(table, item);
    }
  });

  if (!payload.returning) {
    return { data: null, error: null };
  }

  const config = assertTable(table);
  const inserted = prepared.map((item) => getRowByPrimaryKey(table, item[config.primaryKey]));

  if (payload.single) {
    return { data: inserted[0] ?? null, error: null };
  }

  return { data: inserted, error: null };
}

function updateRecords(table, payload, context) {
  if (!payload.filters || payload.filters.length === 0) {
    return { data: null, error: { message: "Updates require at least one filter." } };
  }

  const candidates = queryRows(table, payload.filters);
  const authorized = candidates.filter((row) => canUpdateRow(table, row, context));

  if (authorized.length === 0) {
    return { data: null, error: { message: "No matching records could be updated." } };
  }

  runInTransaction(() => {
    for (const row of authorized) {
      updateRow(table, prepareUpdatedRecord(table, row, payload.values || {}));
    }
  });
  return { data: null, error: null };
}

function deleteRecords(table, payload, context) {
  if (!payload.filters || payload.filters.length === 0) {
    return { data: null, error: { message: "Deletes require at least one filter." } };
  }

  const candidates = queryRows(table, payload.filters);
  const authorized = candidates.filter((row) => canDeleteRow(table, row, context));

  if (authorized.length === 0) {
    return { data: null, error: { message: "No matching records could be deleted." } };
  }

  deleteRows(table, authorized);
  return { data: null, error: null };
}

function upsertRecords(table, payload, context) {
  const config = assertTable(table);
  const items = Array.isArray(payload.values) ? payload.values : [payload.values];

  for (const item of items) {
    const key = item[config.primaryKey];
    if (!key) {
      return { data: null, error: { message: "Upsert requires a primary key." } };
    }

    const existing = getRowByPrimaryKey(table, key);
    if (!existing) {
      const insertResult = insertRecords(table, { values: item, returning: false }, context);
      if (insertResult.error) {
        return insertResult;
      }
      continue;
    }

    if (!canUpdateRow(table, existing, context)) {
      return { data: null, error: { message: "You are not allowed to update this record." } };
    }

    updateRow(table, prepareUpdatedRecord(table, existing, item));
  }

  return { data: null, error: null };
}

function getContentType(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  return TEXT_MIME_TYPES[extension] || "application/octet-stream";
}

function resolveSafePath(baseDir, relativePath) {
  const normalizedRelative = String(relativePath || "")
    .replace(/\\/g, "/")
    .split("/")
    .filter(Boolean)
    .map((segment) => {
      const cleaned = segment.trim();
      if (!cleaned || cleaned === "." || cleaned === ".." || cleaned.includes("..")) {
        throw new Error("Invalid file path.");
      }
      return cleaned;
    })
    .join(path.sep);

  const basePath = path.resolve(baseDir);
  const resolved = path.resolve(basePath, normalizedRelative);

  if (!resolved.startsWith(basePath)) {
    throw new Error("Invalid file path.");
  }

  return resolved;
}

function encodePathSegments(relativePath) {
  return String(relativePath)
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

function sendJson(response, statusCode, payload, extraHeaders = {}) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    ...extraHeaders,
  });
  response.end(JSON.stringify(payload));
}

function serveFile(response, filePath) {
  const stats = statSync(filePath);
  response.writeHead(200, {
    "Content-Length": stats.size,
    "Content-Type": getContentType(filePath),
  });
  createReadStream(filePath).pipe(response);
}

function serveApp(request, response) {
  const requestPath = request.url ? new URL(request.url, "http://localhost").pathname : "/";
  const relativePath = requestPath === "/" ? "index.html" : requestPath.slice(1);

  if (existsSync(DIST_DIR)) {
    try {
      const directFile = resolveSafePath(DIST_DIR, relativePath);
      if (fileExists(directFile) && statSync(directFile).isFile()) {
        serveFile(response, directFile);
        return;
      }
    } catch {
      // Fall through to SPA fallback.
    }

    const indexPath = path.join(DIST_DIR, "index.html");
    if (existsSync(indexPath)) {
      serveFile(response, indexPath);
      return;
    }
  }

  sendJson(response, 200, {
    message: "CampusConnect backend is running. Start Vite with `npm run dev` for the frontend.",
  });
}

async function readJsonBody(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }
  const body = Buffer.concat(chunks).toString("utf8");
  return body ? JSON.parse(body) : {};
}

async function readBufferBody(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function handleAuthRoute(request, response, pathname) {
  if (pathname === "/api/auth/session" && request.method === "GET") {
    return sendJson(response, 200, { session: getSessionFromCookie(request.headers.cookie) });
  }

  if (pathname === "/api/auth/signup" && request.method === "POST") {
    try {
      const body = await readJsonBody(request);
      const result = signUp(body);
      return sendJson(response, 200, result, {
        "Set-Cookie": createSessionCookie(result.sessionId),
      });
    } catch (error) {
      return sendJson(response, 400, { error: { message: error instanceof Error ? error.message : "Sign up failed." } });
    }
  }

  if (pathname === "/api/auth/login" && request.method === "POST") {
    try {
      const body = await readJsonBody(request);
      const result = signIn(body);
      return sendJson(response, 200, result, {
        "Set-Cookie": createSessionCookie(result.sessionId),
      });
    } catch (error) {
      return sendJson(response, 401, { error: { message: error instanceof Error ? error.message : "Login failed." } });
    }
  }

  if (pathname === "/api/auth/logout" && request.method === "POST") {
    const context = getUserContextFromCookie(request.headers.cookie);
    signOut(context?.sessionId);
    return sendJson(response, 200, { success: true }, {
      "Set-Cookie": clearSessionCookie(),
    });
  }

  return sendJson(response, 404, { error: { message: "Not found." } });
}

async function handleDatabaseRoute(request, response, pathname, context) {
  if (request.method !== "POST") {
    return sendJson(response, 405, { error: { message: "Method not allowed." } });
  }

  const [, , , table, action] = pathname.split("/");

  try {
    assertTable(table);
  } catch (error) {
    return sendJson(response, 404, { error: { message: error instanceof Error ? error.message : "Unknown table." } });
  }

  try {
    const body = await readJsonBody(request);
    let result;

    switch (action) {
      case "select":
        result = selectRecords(table, body, context);
        break;
      case "insert":
        result = insertRecords(table, body, context);
        break;
      case "update":
        result = updateRecords(table, body, context);
        break;
      case "delete":
        result = deleteRecords(table, body, context);
        break;
      case "upsert":
        result = upsertRecords(table, body, context);
        break;
      default:
        return sendJson(response, 404, { error: { message: "Unknown database action." } });
    }

    if (result.error) {
      const statusCode = result.error.message.toLowerCase().includes("allowed") ? 403 : 400;
      return sendJson(response, statusCode, result);
    }

    return sendJson(response, 200, result);
  } catch (error) {
    return sendJson(response, 400, { error: { message: error instanceof Error ? error.message : "Database request failed." } });
  }
}

function canUploadToBucket(bucket, relativePath, context) {
  if (!context?.user) {
    return false;
  }

  if (bucket === "avatars") {
    return relativePath.startsWith(`${context.user.id}/`);
  }

  return hasRole(context, "admin");
}

async function handleStorageRoute(request, response, pathname, context) {
  const [, , , bucket, action] = pathname.split("/");

  if (!PUBLIC_UPLOAD_BUCKETS.has(bucket)) {
    return sendJson(response, 404, { error: { message: "Unknown upload bucket." } });
  }

  if (action !== "upload" || request.method !== "POST") {
    return sendJson(response, 405, { error: { message: "Method not allowed." } });
  }

  const url = new URL(request.url, "http://localhost");
  const relativePath = url.searchParams.get("path");

  if (!relativePath) {
    return sendJson(response, 400, { error: { message: "Upload path is required." } });
  }

  if (!canUploadToBucket(bucket, relativePath, context)) {
    return sendJson(response, 403, { error: { message: "You are not allowed to upload this file." } });
  }

  try {
    const targetDirectory = path.join(UPLOADS_DIR, bucket);
    const targetPath = resolveSafePath(targetDirectory, relativePath);
    const allowOverwrite = url.searchParams.get("upsert") === "true";

    if (!allowOverwrite && existsSync(targetPath)) {
      return sendJson(response, 400, { error: { message: "A file already exists at that path." } });
    }

    mkdirSync(path.dirname(targetPath), { recursive: true });
    const buffer = await readBufferBody(request);
    writeFileSync(targetPath, buffer);

    return sendJson(response, 200, {
      data: {
        path: relativePath,
        publicUrl: `/uploads/${bucket}/${encodePathSegments(relativePath)}`,
      },
      error: null,
    });
  } catch (error) {
    return sendJson(response, 400, { error: { message: error instanceof Error ? error.message : "Upload failed." } });
  }
}

function handleUploadFileRoute(response, pathname) {
  const relativePath = pathname.replace(/^\/uploads\//, "");
  const firstSlash = relativePath.indexOf("/");

  if (firstSlash === -1) {
    return sendJson(response, 404, { error: { message: "File not found." } });
  }

  const bucket = relativePath.slice(0, firstSlash);
  const bucketPath = relativePath.slice(firstSlash + 1);

  if (!PUBLIC_UPLOAD_BUCKETS.has(bucket)) {
    return sendJson(response, 404, { error: { message: "File not found." } });
  }

  try {
    const filePath = resolveSafePath(path.join(UPLOADS_DIR, bucket), decodeURIComponent(bucketPath));
    if (!existsSync(filePath) || !statSync(filePath).isFile()) {
      return sendJson(response, 404, { error: { message: "File not found." } });
    }
    serveFile(response, filePath);
  } catch {
    sendJson(response, 404, { error: { message: "File not found." } });
  }
}

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url || "/", "http://localhost");
    const pathname = url.pathname;
    const context = getUserContextFromCookie(request.headers.cookie);

    if (pathname.startsWith("/api/auth/")) {
      return handleAuthRoute(request, response, pathname);
    }

    if (pathname.startsWith("/api/db/")) {
      return handleDatabaseRoute(request, response, pathname, context);
    }

    if (pathname.startsWith("/api/storage/")) {
      return handleStorageRoute(request, response, pathname, context);
    }

    if (pathname.startsWith("/uploads/")) {
      return handleUploadFileRoute(response, pathname);
    }

    return serveApp(request, response);
  } catch (error) {
    return sendJson(response, 500, { error: { message: error instanceof Error ? error.message : "Internal server error." } });
  }
});

server.listen(PORT, () => {
  console.log(`CampusConnect backend listening on http://localhost:${PORT}`);
});
