import {
  getSysOneEnv,
  requireBinding,
} from "@/lib/server/cloudflare";

const TELEGRAM_AUTHORIZATION_URL =
  "https://oauth.telegram.org/auth";

const TELEGRAM_TOKEN_URL =
  "https://oauth.telegram.org/token";

const TELEGRAM_JWKS_URL =
  "https://oauth.telegram.org/.well-known/jwks.json";

const TELEGRAM_ISSUER =
  "https://oauth.telegram.org";

const TELEGRAM_SIGNING_ALGORITHM =
  "RS256";

export const TELEGRAM_OAUTH_TRANSACTION_COOKIE =
  "sysone_telegram_oauth";

export const TELEGRAM_OAUTH_TRANSACTION_TTL_SECONDS =
  10 * 60;

const TELEGRAM_JWKS_CACHE_TTL_MS =
  10 * 60 * 1000;

type TelegramTokenResponse = {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  id_token?: string;
  error?: string;
  error_description?: string;
};

type TelegramJwtHeader = {
  alg?: string;
  kid?: string;
  typ?: string;
};

type TelegramIdTokenClaims = {
  iss?: string;
  aud?: string | string[];
  sub?: string;
  iat?: number;
  exp?: number;

  id?: number | string;
  name?: string;
  given_name?: string;
  family_name?: string;
  preferred_username?: string;
  picture?: string;
};

type TelegramJwk = JsonWebKey & {
  kid?: string;
  alg?: string;
  use?: string;
};

type TelegramJwksResponse = {
  keys?: TelegramJwk[];
};

export type TelegramUserProfile = {
  providerAccountId: string;
  name: string;
  imageUrl: string | null;
  username: string | null;
  locale: string | null;
};

export type TelegramOAuthTransaction = {
  version: 1;
  state: string;
  verifier: string;
  createdAt: number;
};

let jwksCache:
  | {
      keys: TelegramJwk[];
      expiresAt: number;
    }
  | null = null;

function getTelegramConfig() {
  const env = getSysOneEnv();

  return {
    clientId: requireBinding(
      env.TELEGRAM_CLIENT_ID,
      "TELEGRAM_CLIENT_ID",
    ),
    clientSecret: requireBinding(
      env.TELEGRAM_CLIENT_SECRET,
      "TELEGRAM_CLIENT_SECRET",
    ),
  };
}

function bytesToBase64Url(
  bytes: Uint8Array,
) {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function bytesToBase64(
  bytes: Uint8Array,
) {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
}

function stringToBase64Url(
  value: string,
) {
  return bytesToBase64Url(
    new TextEncoder().encode(value),
  );
}

function stringToBase64(
  value: string,
) {
  return bytesToBase64(
    new TextEncoder().encode(value),
  );
}

function base64UrlToBytes(
  value: string,
) {
  const normalized = value
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const padded =
    normalized +
    "=".repeat(
      (4 - (normalized.length % 4)) % 4,
    );

  const binary = atob(padded);
  const bytes = new Uint8Array(
    binary.length,
  );

  for (
    let index = 0;
    index < binary.length;
    index += 1
  ) {
    bytes[index] =
      binary.charCodeAt(index);
  }

  return bytes;
}

function base64UrlToString(
  value: string,
) {
  return new TextDecoder().decode(
    base64UrlToBytes(value),
  );
}

function createRandomValue(
  size = 32,
) {
  const bytes = new Uint8Array(size);

  crypto.getRandomValues(bytes);

  return bytesToBase64Url(bytes);
}

async function createCodeChallenge(
  verifier: string,
) {
  const digest =
    await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(
        verifier,
      ),
    );

  return bytesToBase64Url(
    new Uint8Array(digest),
  );
}

export function getTelegramCallbackUrl(
  request: Request,
) {
  const url = new URL(request.url);

  return new URL(
    "/api/auth/telegram/callback",
    url.origin,
  ).toString();
}

export async function createTelegramAuthorizationRequest(
  request: Request,
) {
  const { clientId } =
    getTelegramConfig();

  const state = createRandomValue();
  const verifier =
    createRandomValue(48);

  const challenge =
    await createCodeChallenge(
      verifier,
    );

  const redirectUri =
    getTelegramCallbackUrl(request);

  const authorizationUrl = new URL(
    TELEGRAM_AUTHORIZATION_URL,
  );

  authorizationUrl.searchParams.set(
    "client_id",
    clientId,
  );

  authorizationUrl.searchParams.set(
    "redirect_uri",
    redirectUri,
  );

  authorizationUrl.searchParams.set(
    "response_type",
    "code",
  );

  authorizationUrl.searchParams.set(
    "scope",
    "openid profile",
  );

  authorizationUrl.searchParams.set(
    "state",
    state,
  );

  authorizationUrl.searchParams.set(
    "code_challenge",
    challenge,
  );

  authorizationUrl.searchParams.set(
    "code_challenge_method",
    "S256",
  );

  const transaction:
    TelegramOAuthTransaction = {
      version: 1,
      state,
      verifier,
      createdAt: Date.now(),
    };

  return {
    authorizationUrl:
      authorizationUrl.toString(),
    transaction,
  };
}

export function encodeTelegramOAuthTransaction(
  transaction:
    TelegramOAuthTransaction,
) {
  return stringToBase64Url(
    JSON.stringify(transaction),
  );
}

export function decodeTelegramOAuthTransaction(
  value?: string | null,
): TelegramOAuthTransaction | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      base64UrlToString(value),
    ) as Partial<TelegramOAuthTransaction>;

    if (
      parsed.version !== 1 ||
      typeof parsed.state !== "string" ||
      typeof parsed.verifier !== "string" ||
      typeof parsed.createdAt !==
        "number"
    ) {
      return null;
    }

    const age =
      Date.now() -
      parsed.createdAt;

    if (
      age < 0 ||
      age >
        TELEGRAM_OAUTH_TRANSACTION_TTL_SECONDS *
          1000
    ) {
      return null;
    }

    return {
      version: 1,
      state: parsed.state,
      verifier:
        parsed.verifier,
      createdAt:
        parsed.createdAt,
    };
  } catch {
    return null;
  }
}

export function telegramOAuthTransactionCookieOptions(
  maxAge =
    TELEGRAM_OAUTH_TRANSACTION_TTL_SECONDS,
) {
  return {
    httpOnly: true,
    secure:
      process.env.NODE_ENV ===
      "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export function isValidTelegramOAuthState(
  expected: string,
  received?: string | null,
) {
  if (
    !received ||
    expected.length !==
      received.length
  ) {
    return false;
  }

  let difference = 0;

  for (
    let index = 0;
    index < expected.length;
    index += 1
  ) {
    difference |=
      expected.charCodeAt(index) ^
      received.charCodeAt(index);
  }

  return difference === 0;
}

export async function exchangeTelegramAuthorizationCode(
  request: Request,
  code: string,
  verifier: string,
) {
  const {
    clientId,
    clientSecret,
  } = getTelegramConfig();

  const redirectUri =
    getTelegramCallbackUrl(request);

  const credentials =
    stringToBase64(
      `${clientId}:${clientSecret}`,
    );

  const response = await fetch(
    TELEGRAM_TOKEN_URL,
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/x-www-form-urlencoded",
        Accept:
          "application/json",
        Authorization:
          `Basic ${credentials}`,
      },
      body: new URLSearchParams({
        grant_type:
          "authorization_code",
        code,
        redirect_uri:
          redirectUri,
        client_id:
          clientId,
        code_verifier:
          verifier,
      }),
    },
  );

  const payload =
    (await response
      .json()
      .catch(
        () => ({}),
      )) as TelegramTokenResponse;

  if (
    !response.ok ||
    !payload.id_token
  ) {
    throw new Error(
      "telegram_token_exchange_failed",
    );
  }

  return payload.id_token;
}

async function fetchTelegramJwks(
  forceRefresh = false,
) {
  if (
    !forceRefresh &&
    jwksCache &&
    Date.now() <
      jwksCache.expiresAt
  ) {
    return jwksCache.keys;
  }

  const response = await fetch(
    TELEGRAM_JWKS_URL,
    {
      headers: {
        Accept:
          "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      "telegram_jwks_fetch_failed",
    );
  }

  const payload =
    (await response.json()) as
      TelegramJwksResponse;

  if (
    !Array.isArray(
      payload.keys,
    ) ||
    payload.keys.length === 0
  ) {
    throw new Error(
      "telegram_jwks_invalid",
    );
  }

  jwksCache = {
    keys: payload.keys,
    expiresAt:
      Date.now() +
      TELEGRAM_JWKS_CACHE_TTL_MS,
  };

  return payload.keys;
}

async function getTelegramSigningKey(
  kid: string,
) {
  let keys =
    await fetchTelegramJwks();

  let key = keys.find(
    (candidate) =>
      candidate.kid === kid &&
      candidate.alg ===
        TELEGRAM_SIGNING_ALGORITHM &&
      candidate.kty === "RSA",
  );

  if (!key) {
    keys =
      await fetchTelegramJwks(
        true,
      );

    key = keys.find(
      (candidate) =>
        candidate.kid ===
          kid &&
        candidate.alg ===
          TELEGRAM_SIGNING_ALGORITHM &&
        candidate.kty ===
          "RSA",
    );
  }

  if (!key) {
    throw new Error(
      "telegram_signing_key_not_found",
    );
  }

  return key;
}

function decodeJwtJson<T>(
  segment: string,
): T {
  try {
    return JSON.parse(
      base64UrlToString(
        segment,
      ),
    ) as T;
  } catch {
    throw new Error(
      "telegram_id_token_invalid",
    );
  }
}

async function verifyTelegramIdTokenSignature(
  signingInput: string,
  signatureSegment: string,
  jwk: TelegramJwk,
) {
  let cryptoKey: CryptoKey;

  try {
    cryptoKey =
      await crypto.subtle.importKey(
        "jwk",
        jwk,
        {
          name:
            "RSASSA-PKCS1-v1_5",
          hash: "SHA-256",
        },
        false,
        ["verify"],
      );
  } catch {
    throw new Error(
      "telegram_signing_key_invalid",
    );
  }

  const valid =
    await crypto.subtle.verify(
      {
        name:
          "RSASSA-PKCS1-v1_5",
      },
      cryptoKey,
      base64UrlToBytes(
        signatureSegment,
      ),
      new TextEncoder().encode(
        signingInput,
      ),
    );

  if (!valid) {
    throw new Error(
      "telegram_id_token_signature_invalid",
    );
  }
}

function validateTelegramClaims(
  claims: TelegramIdTokenClaims,
  clientId: string,
) {
  if (
    claims.iss !==
    TELEGRAM_ISSUER
  ) {
    throw new Error(
      "telegram_id_token_issuer_invalid",
    );
  }

  const audiences =
    Array.isArray(claims.aud)
      ? claims.aud
      : typeof claims.aud ===
          "string"
        ? [claims.aud]
        : [];

  if (
    !audiences.includes(
      clientId,
    )
  ) {
    throw new Error(
      "telegram_id_token_audience_invalid",
    );
  }

  const now = Math.floor(
    Date.now() / 1000,
  );

  if (
    typeof claims.exp !==
      "number" ||
    claims.exp <= now
  ) {
    throw new Error(
      "telegram_id_token_expired",
    );
  }

  if (
    typeof claims.iat !==
      "number" ||
    claims.iat >
      now + 60
  ) {
    throw new Error(
      "telegram_id_token_iat_invalid",
    );
  }

  const providerAccountId =
    claims.sub?.trim();

  const name =
    claims.name?.trim();

  if (
    !providerAccountId ||
    !name
  ) {
    throw new Error(
      "telegram_profile_invalid",
    );
  }

  return {
    providerAccountId,
    name,
  };
}

export async function getTelegramUserProfile(
  idToken: string,
): Promise<TelegramUserProfile> {
  const segments =
    idToken.split(".");

  if (segments.length !== 3) {
    throw new Error(
      "telegram_id_token_invalid",
    );
  }

  const [
    encodedHeader,
    encodedPayload,
    encodedSignature,
  ] = segments;

  const header =
    decodeJwtJson<TelegramJwtHeader>(
      encodedHeader,
    );

  if (
    header.alg !==
      TELEGRAM_SIGNING_ALGORITHM ||
    !header.kid
  ) {
    throw new Error(
      "telegram_id_token_algorithm_invalid",
    );
  }

  const signingKey =
    await getTelegramSigningKey(
      header.kid,
    );

  await verifyTelegramIdTokenSignature(
    `${encodedHeader}.${encodedPayload}`,
    encodedSignature,
    signingKey,
  );

  const claims =
    decodeJwtJson<TelegramIdTokenClaims>(
      encodedPayload,
    );

  const { clientId } =
    getTelegramConfig();

  const {
    providerAccountId,
    name,
  } = validateTelegramClaims(
    claims,
    clientId,
  );

  return {
    providerAccountId,
    name,
    imageUrl:
      claims.picture?.trim() ||
      null,
    username:
      claims.preferred_username?.trim() ||
      null,
    locale: null,
  };
}