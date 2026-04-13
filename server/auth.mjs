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

export async function getUserRoles(userId) {
  const rows = await db.prepare("SELECT role FROM user_roles WHERE user_id = ?").all(userId);
  return rows.map((row) => row.role);
}

export async function getUserPermissions(userId) {
  return db.prepare("SELECT * FROM permissions WHERE user_id = ?").all(userId);
}

async function buildSessionPayload(userId) {
  const user = await db.prepare(`
    SELECT users.id, users.email, profiles.full_name
    FROM users
    LEFT JOIN profiles ON profiles.id = users.id
    WHERE users.id = ?
  `).get(userId);

  if (!user) {
    return null;
  }

  const [roles, permissions] = await Promise.all([
    getUserRoles(userId),
    getUserPermissions(userId),
  ]);

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

export async function getUserContextFromCookie(cookieHeader = "") {
  const cookies = parseCookies(cookieHeader);
  const sessionId = cookies[SESSION_COOKIE];

  if (!sessionId) {
    return null;
  }

  const session = await db.prepare(`
    SELECT sessions.id, sessions.user_id, sessions.expires_at, users.email
    FROM sessions
    JOIN users ON users.id = sessions.user_id
    WHERE sessions.id = ?
  `).get(sessionId);

  if (!session) {
    return null;
  }

  if (Date.parse(session.expires_at) <= Date.now()) {
    await db.prepare("DELETE FROM sessions WHERE id = ?").run(sessionId);
    return null;
  }

  const [roles, permissions] = await Promise.all([
    getUserRoles(session.user_id),
    getUserPermissions(session.user_id),
  ]);

  return {
    sessionId: session.id,
    user: {
      id: session.user_id,
      email: session.email,
    },
    roles,
    permissions,
  };
}

export async function getSessionFromCookie(cookieHeader = "") {
  const context = await getUserContextFromCookie(cookieHeader);
  if (!context) {
    return null;
  }
  return buildSessionPayload(context.user.id);
}

async function createSession(userId) {
  const sessionId = randomUUID();
  const createdAt = nowIso();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000).toISOString();

  await db.prepare(`
    INSERT INTO sessions (id, user_id, created_at, expires_at)
    VALUES (?, ?, ?, ?)
  `).run(sessionId, userId, createdAt, expiresAt);

  return {
    sessionId,
    session: await buildSessionPayload(userId),
  };
}

export async function signUp({ email, password, fullName }) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const normalizedName = String(fullName || "").trim();

  if (!normalizedEmail || !password) {
    throw new Error("Email and password are required.");
  }

  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters.");
  }

  const existingUser = await db.prepare("SELECT id FROM users WHERE email = ?").get(normalizedEmail);
  if (existingUser) {
    throw new Error("An account with this email already exists.");
  }

  const userCountRow = await db.prepare("SELECT COUNT(*) AS count FROM users").get();
  const userCount = Number(userCountRow?.count ?? 0);
  const userId = randomUUID();
  const createdAt = nowIso();

  await runInTransaction(async () => {
    await db.prepare(`
      INSERT INTO users (id, email, password_hash, created_at)
      VALUES (?, ?, ?, ?)
    `).run(userId, normalizedEmail, hashPassword(password), createdAt);

    await db.prepare(`
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
      await db.prepare(`
        INSERT INTO user_roles (id, user_id, role)
        VALUES (?, ?, 'admin')
      `).run(randomUUID(), userId);
    }
  });

  return createSession(userId);
}

export async function signIn({ email, password }) {
  const normalizedEmail = String(email || "").trim().toLowerCase();

  if (!normalizedEmail || !password) {
    throw new Error("Email and password are required.");
  }

  const user = await db.prepare("SELECT * FROM users WHERE email = ?").get(normalizedEmail);

  if (!user || !verifyPassword(password, user.password_hash)) {
    throw new Error("Invalid email or password.");
  }

  return createSession(user.id);
}

export async function signOut(sessionId) {
  if (!sessionId) {
    return;
  }

  await db.prepare("DELETE FROM sessions WHERE id = ?").run(sessionId);
}

// Generate a secure random token
function generateResetToken() {
  return randomUUID() + randomUUID(); // Longer, more secure token
}

export async function requestPasswordReset({ email }) {
  const normalizedEmail = String(email || "").trim().toLowerCase();

  if (!normalizedEmail) {
    throw new Error("Email is required.");
  }

  const user = await db.prepare("SELECT id FROM users WHERE email = ?").get(normalizedEmail);

  if (!user) {
    // Don't reveal if email exists for security
    return { success: true };
  }

  // Invalidate any existing tokens for this user
  await db.prepare("UPDATE password_reset_tokens SET used = 1 WHERE user_id = ? AND used = 0").run(user.id);

  // Create new reset token (valid for 1 hour)
  const tokenId = randomUUID();
  const token = generateResetToken();
  const createdAt = nowIso();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

  await db.prepare(`
    INSERT INTO password_reset_tokens (id, user_id, token, expires_at, created_at, used)
    VALUES (?, ?, ?, ?, ?, 0)
  `).run(tokenId, user.id, token, expiresAt, createdAt);

  // Return token (in production, send via email)
  console.log(`[Password Reset] Token for ${normalizedEmail}: ${token}`);
  return { success: true, token, userId: user.id }; // Return token for testing
}

export async function resetPassword({ token, newPassword }) {
  if (!token || !newPassword) {
    throw new Error("Token and password are required.");
  }

  if (newPassword.length < 6) {
    throw new Error("Password must be at least 6 characters.");
  }

  // Find valid reset token
  const resetRecord = await db.prepare(`
    SELECT user_id FROM password_reset_tokens 
    WHERE token = ? AND used = 0 AND expires_at > ?
  `).get(token, nowIso());

  if (!resetRecord) {
    throw new Error("Invalid or expired reset token.");
  }

  // Update password and mark token as used
  await runInTransaction(async () => {
    await db.prepare(`
      UPDATE users SET password_hash = ? WHERE id = ?
    `).run(hashPassword(newPassword), resetRecord.user_id);

    await db.prepare(`
      UPDATE password_reset_tokens SET used = 1 WHERE token = ?
    `).run(token);
  });

  return { success: true };
}

export async function changePassword({ userId, currentPassword, newPassword }) {
  if (!userId || !currentPassword || !newPassword) {
    throw new Error("All fields are required.");
  }

  if (newPassword.length < 6) {
    throw new Error("New password must be at least 6 characters.");
  }

  // Get user and verify current password
  const user = await db.prepare("SELECT password_hash FROM users WHERE id = ?").get(userId);

  if (!user) {
    throw new Error("User not found.");
  }

  if (!verifyPassword(currentPassword, user.password_hash)) {
    throw new Error("Current password is incorrect.");
  }

  // Update password
  await db.prepare(`
    UPDATE users SET password_hash = ? WHERE id = ?
  `).run(hashPassword(newPassword), userId);

  return { success: true };
}
