import { cookies } from "next/headers";
import { getSysOneEnv } from "@/lib/server/cloudflare";

export const ADMIN_COOKIE_NAME = "sysone_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 12;

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4 || 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function importHmacKey(secret: string) {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

function getAdminSecret() {
  const secret = getSysOneEnv().SYSONE_ADMIN_SECRET;
  if (!secret || secret.length < 24) return null;
  return secret;
}

async function constantTimeTextEqual(a: string, b: string) {
  const encoder = new TextEncoder();
  const [left, right] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(a)),
    crypto.subtle.digest("SHA-256", encoder.encode(b)),
  ]);
  const x = new Uint8Array(left);
  const y = new Uint8Array(right);
  let diff = x.length ^ y.length;
  for (let index = 0; index < Math.max(x.length, y.length); index += 1) {
    diff |= (x[index] ?? 0) ^ (y[index] ?? 0);
  }
  return diff === 0;
}

export async function verifyAdminSecret(candidate: string) {
  const configured = getAdminSecret();
  if (!configured) return { ok: false as const, reason: "misconfigured" as const };
  if (!candidate || !(await constantTimeTextEqual(candidate, configured))) {
    return { ok: false as const, reason: "invalid" as const };
  }
  return { ok: true as const };
}

export async function createAdminSessionToken() {
  const secret = getAdminSecret();
  if (!secret) throw new Error("SYSONE_ADMIN_SECRET is missing or too short");

  const issuedAt = Math.floor(Date.now() / 1000).toString();
  const nonce = crypto.randomUUID();
  const payload = `${issuedAt}.${nonce}`;
  const key = await importHmacKey(secret);
  const signature = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload)),
  );
  return `${payload}.${bytesToBase64Url(signature)}`;
}

export async function verifyAdminSessionToken(token?: string | null) {
  if (!token) return false;
  const secret = getAdminSecret();
  if (!secret) return false;

  const [issuedAtRaw, nonce, signatureRaw, ...extra] = token.split(".");
  if (!issuedAtRaw || !nonce || !signatureRaw || extra.length) return false;

  const issuedAt = Number(issuedAtRaw);
  if (!Number.isFinite(issuedAt)) return false;
  const now = Math.floor(Date.now() / 1000);
  if (issuedAt > now + 60 || now - issuedAt > SESSION_TTL_SECONDS) return false;

  try {
    const key = await importHmacKey(secret);
    const payload = `${issuedAtRaw}.${nonce}`;
    return crypto.subtle.verify(
      "HMAC",
      key,
      base64UrlToBytes(signatureRaw),
      new TextEncoder().encode(payload),
    );
  } catch {
    return false;
  }
}

export async function isAdminAuthenticated() {
  const cookieStore = await cookies();
  return verifyAdminSessionToken(cookieStore.get(ADMIN_COOKIE_NAME)?.value);
}

export function isSafeAdminMutation(request: Request) {
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "none") return false;

  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

export function adminCookieOptions(maxAge = SESSION_TTL_SECONDS) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    maxAge,
  };
}
