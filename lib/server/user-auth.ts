import { cookies } from "next/headers";
import { getSysOneEnv, requireBinding } from "@/lib/server/cloudflare";

export const USER_SESSION_COOKIE = "sysone_session";

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

export type SysOneUser = {
  id: string;
  email: string | null;
  name: string;
  image_url: string | null;
  role: string;
  locale: string;
  created_at: string;
  updated_at: string;
};

export type UserSession = {
  id: string;
  user_id: string;
  device_label: string | null;
  expires_at: string;
  created_at: string;
};

function getDatabase() {
  return requireBinding(getSysOneEnv().SYSONE_DB, "SYSONE_DB");
}

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function createRandomToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return bytesToBase64Url(bytes);
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function createUserSession(
  userId: string,
  options?: {
    deviceLabel?: string | null;
    ipHash?: string | null;
  },
) {
  const db = getDatabase();

  const sessionId = crypto.randomUUID();
  const rawToken = createRandomToken();
  const tokenHash = await sha256(rawToken);

  const expiresAt = new Date(
    Date.now() + SESSION_TTL_SECONDS * 1000,
  ).toISOString();

  await db
    .prepare(
      `
        INSERT INTO sessions (
          id,
          user_id,
          token_hash,
          device_label,
          ip_hash,
          expires_at
        )
        VALUES (?, ?, ?, ?, ?, ?)
      `,
    )
    .bind(
      sessionId,
      userId,
      tokenHash,
      options?.deviceLabel ?? null,
      options?.ipHash ?? null,
      expiresAt,
    )
    .run();

  return {
    id: sessionId,
    token: rawToken,
    expiresAt,
  };
}

export async function getUserFromSessionToken(
  token?: string | null,
): Promise<SysOneUser | null> {
  if (!token) return null;

  const db = getDatabase();
  const tokenHash = await sha256(token);

  const user = await db
    .prepare(
      `
        SELECT
          u.id,
          u.email,
          u.name,
          u.image_url,
          u.role,
          u.locale,
          u.created_at,
          u.updated_at
        FROM sessions s
        INNER JOIN users u ON u.id = s.user_id
        WHERE
          s.token_hash = ?
          AND datetime(s.expires_at) > datetime('now')
        LIMIT 1
      `,
    )
    .bind(tokenHash)
    .first<SysOneUser>();

  return user ?? null;
}

export async function getCurrentUser() {
  const cookieStore = await cookies();

  return getUserFromSessionToken(
    cookieStore.get(USER_SESSION_COOKIE)?.value,
  );
}

export async function revokeUserSession(token?: string | null) {
  if (!token) return;

  const db = getDatabase();
  const tokenHash = await sha256(token);

  await db
    .prepare("DELETE FROM sessions WHERE token_hash = ?")
    .bind(tokenHash)
    .run();
}

export async function revokeAllUserSessions(userId: string) {
  const db = getDatabase();

  await db
    .prepare("DELETE FROM sessions WHERE user_id = ?")
    .bind(userId)
    .run();
}

export async function deleteExpiredUserSessions() {
  const db = getDatabase();

  await db
    .prepare(
      `
        DELETE FROM sessions
        WHERE datetime(expires_at) <= datetime('now')
      `,
    )
    .run();
}

export function userSessionCookieOptions(maxAge = SESSION_TTL_SECONDS) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export function isSafeUserMutation(request: Request) {
  const fetchSite = request.headers.get("sec-fetch-site");

  if (
    fetchSite &&
    fetchSite !== "same-origin" &&
    fetchSite !== "none"
  ) {
    return false;
  }

  const origin = request.headers.get("origin");

  if (!origin) return true;

  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}