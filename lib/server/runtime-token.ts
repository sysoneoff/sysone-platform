import { getSysOneEnv } from "@/lib/server/cloudflare";

type RuntimeTokenPayload = {
  v: 1;
  productId: string;
  slug: string;
  userId: string | null;
  buildId: string | null;
  exp: number;
};

function secret() {
  const value = getSysOneEnv().SYSONE_RUNTIME_SECRET;
  if (!value || value.length < 32) {
    throw new Error("SYSONE_RUNTIME_SECRET_missing");
  }
  return value;
}

function b64(bytes: Uint8Array) {
  let raw = "";
  for (const byte of bytes) raw += String.fromCharCode(byte);
  return btoa(raw).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function hmac(value: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return b64(new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value))));
}

export async function createRuntimeToken(input: Omit<RuntimeTokenPayload, "v" | "exp">, ttlSeconds = 60 * 60 * 8) {
  const payload: RuntimeTokenPayload = {
    v: 1,
    ...input,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };
  const encoded = b64(new TextEncoder().encode(JSON.stringify(payload)));
  return `${encoded}.${await hmac(encoded)}`;
}
