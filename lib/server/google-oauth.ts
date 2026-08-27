import { getSysOneEnv, requireBinding } from "@/lib/server/cloudflare";

const GOOGLE_AUTHORIZATION_URL =
  "https://accounts.google.com/o/oauth2/v2/auth";

const GOOGLE_TOKEN_URL =
  "https://oauth2.googleapis.com/token";

const GOOGLE_USERINFO_URL =
  "https://openidconnect.googleapis.com/v1/userinfo";

export const GOOGLE_OAUTH_TRANSACTION_COOKIE =
  "sysone_google_oauth";

export const GOOGLE_OAUTH_TRANSACTION_TTL_SECONDS = 10 * 60;

type GoogleTokenResponse = {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  scope?: string;
  id_token?: string;
  error?: string;
  error_description?: string;
};

export type GoogleUserProfile = {
  providerAccountId: string;
  email: string;
  name: string;
  imageUrl: string | null;
  locale: string | null;
};

export type GoogleOAuthTransaction = {
  version: 1;
  state: string;
  verifier: string;
  createdAt: number;
};

function getGoogleConfig() {
  const env = getSysOneEnv();

  return {
    clientId: requireBinding(
      env.GOOGLE_CLIENT_ID,
      "GOOGLE_CLIENT_ID",
    ),
    clientSecret: requireBinding(
      env.GOOGLE_CLIENT_SECRET,
      "GOOGLE_CLIENT_SECRET",
    ),
  };
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

function stringToBase64Url(value: string) {
  return bytesToBase64Url(
    new TextEncoder().encode(value),
  );
}

function base64UrlToString(value: string) {
  const normalized = value
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const padded =
    normalized +
    "=".repeat((4 - (normalized.length % 4)) % 4);

  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new TextDecoder().decode(bytes);
}

function createRandomValue(size = 32) {
  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);
  return bytesToBase64Url(bytes);
}

async function createCodeChallenge(verifier: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(verifier),
  );

  return bytesToBase64Url(
    new Uint8Array(digest),
  );
}

export function getGoogleCallbackUrl(request: Request) {
  const url = new URL(request.url);

  return new URL(
    "/api/auth/google/callback",
    url.origin,
  ).toString();
}

export async function createGoogleAuthorizationRequest(
  request: Request,
) {
  const { clientId } = getGoogleConfig();

  const state = createRandomValue();
  const verifier = createRandomValue(48);
  const challenge = await createCodeChallenge(verifier);
  const redirectUri = getGoogleCallbackUrl(request);

  const authorizationUrl = new URL(
    GOOGLE_AUTHORIZATION_URL,
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
    "openid email profile",
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

  authorizationUrl.searchParams.set(
    "access_type",
    "online",
  );

  authorizationUrl.searchParams.set(
    "include_granted_scopes",
    "true",
  );

  authorizationUrl.searchParams.set(
    "prompt",
    "select_account",
  );

  const transaction: GoogleOAuthTransaction = {
    version: 1,
    state,
    verifier,
    createdAt: Date.now(),
  };

  return {
    authorizationUrl: authorizationUrl.toString(),
    transaction,
  };
}

export function encodeGoogleOAuthTransaction(
  transaction: GoogleOAuthTransaction,
) {
  return stringToBase64Url(
    JSON.stringify(transaction),
  );
}

export function decodeGoogleOAuthTransaction(
  value?: string | null,
): GoogleOAuthTransaction | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(
      base64UrlToString(value),
    ) as Partial<GoogleOAuthTransaction>;

    if (
      parsed.version !== 1 ||
      typeof parsed.state !== "string" ||
      typeof parsed.verifier !== "string" ||
      typeof parsed.createdAt !== "number"
    ) {
      return null;
    }

    const age = Date.now() - parsed.createdAt;

    if (
      age < 0 ||
      age >
        GOOGLE_OAUTH_TRANSACTION_TTL_SECONDS * 1000
    ) {
      return null;
    }

    return {
      version: 1,
      state: parsed.state,
      verifier: parsed.verifier,
      createdAt: parsed.createdAt,
    };
  } catch {
    return null;
  }
}

export function googleOAuthTransactionCookieOptions(
  maxAge = GOOGLE_OAUTH_TRANSACTION_TTL_SECONDS,
) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export function isValidGoogleOAuthState(
  expected: string,
  received?: string | null,
) {
  if (!received || expected.length !== received.length) {
    return false;
  }

  let difference = 0;

  for (let index = 0; index < expected.length; index += 1) {
    difference |=
      expected.charCodeAt(index) ^
      received.charCodeAt(index);
  }

  return difference === 0;
}

export async function exchangeGoogleAuthorizationCode(
  request: Request,
  code: string,
  verifier: string,
) {
  const { clientId, clientSecret } =
    getGoogleConfig();

  const redirectUri = getGoogleCallbackUrl(request);

  const response = await fetch(
    GOOGLE_TOKEN_URL,
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        code_verifier: verifier,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }),
    },
  );

  const payload =
    (await response.json()) as GoogleTokenResponse;

  if (
    !response.ok ||
    !payload.access_token
  ) {
    throw new Error(
      "google_token_exchange_failed",
    );
  }

  return payload.access_token;
}

export async function getGoogleUserProfile(
  accessToken: string,
): Promise<GoogleUserProfile> {
  const response = await fetch(
    GOOGLE_USERINFO_URL,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      "google_profile_fetch_failed",
    );
  }

  const profile = (await response.json()) as {
    sub?: string;
    email?: string;
    email_verified?: boolean;
    name?: string;
    picture?: string;
    locale?: string;
  };

  const providerAccountId =
    profile.sub?.trim();

  const email =
    profile.email?.trim().toLowerCase();

  const name =
    profile.name?.trim();

  if (
    !providerAccountId ||
    !email ||
    profile.email_verified !== true ||
    !name
  ) {
    throw new Error(
      "google_profile_invalid",
    );
  }

  return {
    providerAccountId,
    email,
    name,
    imageUrl:
      profile.picture?.trim() || null,
    locale:
      profile.locale?.trim() || null,
  };
}