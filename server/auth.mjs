import { randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { db, nowIso, runInTransaction } from "./database.mjs";

export const SESSION_COOKIE = "cc_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function hashPassword(password) {
  const salt = randomUUID();
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  const [scheme, salt, expectedHash] = String(storedHash || "").split(":");
  if (scheme !== "scrypt" || !salt || !expectedHash) {
    return false;
  }

  const actualHash = scryptSync(password, salt, 64);
  const expectedBuffer = Buffer.from(expectedHash, "hex");

  if (actualHash.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(actualHash, expectedBuffer);
}

export function parseCookies(cookieHeader = "") {
  return cookieHeader
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((acc, part) => {
      const separatorIndex = part.indexOf("=");
      if (separatorIndex === -1) {
        return acc;
      }

      const key = decodeURIComponent(part.slice(0, separatorIndex));
      const value = decodeURIComponent(part.slice(separatorIndex + 1));
      acc[key] = value;
      return acc;
    }, {});
}

export function createSessionCookie(sessionId) {
  return `${SESSION_COOKIE}=${encodeURIComponent(sessionId)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_MAX_AGE_SECONDS}`;
}

export function clearSessionCookie() {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export function getPrimaryRole(roles) {
  if (roles.includes("admin")) {
    return "admin";
  }
  if (roles.includes("moderator")) {
    return "moderator";
  }
  return "user";
}

export function getUserRoles(userId) {
  const rows = db.prepare("SELECT role FROM user_roles WHERE user_id = ?").all(userId);
  return rows.map((row) => row.role);
}

export function getUserPermissions(userId) {
  return db.prepare("SELECT * FROM permissions WHERE user_id = ?").all(userId);
}

function buildSessionPayload(userId) {
  const user = db.prepare(`
    SELECT users.id, users.email, profiles.full_name
    FROM users
    LEFT JOIN profiles ON profiles.id = users.id
    WHERE users.id = ?
  `).get(userId);

  if (!user) {
    return null;
  }

  const roles = getUserRoles(userId);
  const permissions = getUserPermissions(userId);

  return {
    user: {
      id: user.id,
      email: user.email,
      user_metadata: {
        full_name: user.full_name || "",
      },
      app_metadata: {
        roles,
        primary_role: getPrimaryRole(roles),
        permissions,
      },
    },
    expires_at: new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000).toISOString(),
  };
}

export function getUserContextFromCookie(cookieHeader = "") {
  const cookies = parseCookies(cookieHeader);
  const sessionId = cookies[SESSION_COOKIE];

  if (!sessionId) {
    return null;
  }

  const session = db.prepare(`
    SELECT sessions.id, sessions.user_id, sessions.expires_at, users.email
    FROM sessions
    JOIN users ON users.id = sessions.user_id
    WHERE sessions.id = ?
  `).get(sessionId);

  if (!session) {
    return null;
  }

  if (Date.parse(session.expires_at) <= Date.now()) {
    db.prepare("DELETE FROM sessions WHERE id = ?").run(sessionId);
    return null;
  }

  return {
    sessionId: session.id,
    user: {
      id: session.user_id,
      email: session.email,
    },
    roles: getUserRoles(session.user_id),
    permissions: getUserPermissions(session.user_id),
  };
}

export function getSessionFromCookie(cookieHeader = "") {
  const context = getUserContextFromCookie(cookieHeader);
  if (!context) {
    return null;
  }
  return buildSessionPayload(context.user.id);
}

function createSession(userId) {
  const sessionId = randomUUID();
  const createdAt = nowIso();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000).toISOString();

  db.prepare(`
    INSERT INTO sessions (id, user_id, created_at, expires_at)
    VALUES (?, ?, ?, ?)
  `).run(sessionId, userId, createdAt, expiresAt);

  return {
    sessionId,
    session: buildSessionPayload(userId),
  };
}

export function signUp({ email, password, fullName }) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const normalizedName = String(fullName || "").trim();

  if (!normalizedEmail || !password) {
    throw new Error("Email and password are required.");
  }

  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters.");
  }

  const existingUser = db.prepare("SELECT id FROM users WHERE email = ?").get(normalizedEmail);
  if (existingUser) {
    throw new Error("An account with this email already exists.");
  }

  const userCount = db.prepare("SELECT COUNT(*) AS count FROM users").get().count;
  const userId = randomUUID();
  const createdAt = nowIso();

  runInTransaction(() => {
    db.prepare(`
      INSERT INTO users (id, email, password_hash, created_at)
      VALUES (?, ?, ?, ?)
    `).run(userId, normalizedEmail, hashPassword(password), createdAt);

    db.prepare(`
      INSERT INTO profiles (
        id,
        full_name,
        email,
        avatar_url,
        year,
        github_url,
        linkedin_url,
        gmail_url,
        achievements,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, NULL, NULL, NULL, NULL, NULL, '[]', ?, ?)
    `).run(userId, normalizedName || "New User", normalizedEmail, createdAt, createdAt);

    if (userCount === 0) {
      db.prepare(`
        INSERT INTO user_roles (id, user_id, role)
        VALUES (?, ?, 'admin')
      `).run(randomUUID(), userId);
    }
  });

  return createSession(userId);
}

export function signIn({ email, password }) {
  const normalizedEmail = String(email || "").trim().toLowerCase();

  if (!normalizedEmail || !password) {
    throw new Error("Email and password are required.");
  }

  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(normalizedEmail);

  if (!user || !verifyPassword(password, user.password_hash)) {
    throw new Error("Invalid email or password.");
  }

  return createSession(user.id);
}

export function signOut(sessionId) {
  if (!sessionId) {
    return;
  }

  db.prepare("DELETE FROM sessions WHERE id = ?").run(sessionId);
}
