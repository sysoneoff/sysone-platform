import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  decodeGoogleOAuthTransaction,
  exchangeGoogleAuthorizationCode,
  getGoogleUserProfile,
  GOOGLE_OAUTH_TRANSACTION_COOKIE,
  googleOAuthTransactionCookieOptions,
  isValidGoogleOAuthState,
} from "@/lib/server/google-oauth";

import {
  createUserWithIdentity,
  getUserByIdentity,
} from "@/lib/server/user-identities";

import {
  createUserSession,
  USER_SESSION_COOKIE,
  userSessionCookieOptions,
} from "@/lib/server/user-auth";

export const dynamic = "force-dynamic";

function redirectToLogin(
  request: Request,
  error: string,
) {
  const url = new URL("/login", request.url);
  url.searchParams.set("error", error);

  const response = NextResponse.redirect(
    url,
    {
      status: 302,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );

  response.cookies.set(
    GOOGLE_OAUTH_TRANSACTION_COOKIE,
    "",
    googleOAuthTransactionCookieOptions(0),
  );

  return response;
}

export async function GET(request: Request) {
  const url = new URL(request.url);

  const providerError =
    url.searchParams.get("error");

  if (providerError) {
    return redirectToLogin(
      request,
      "google_cancelled",
    );
  }

  const code =
    url.searchParams.get("code")?.trim();

  const state =
    url.searchParams.get("state");

  if (!code || !state) {
    return redirectToLogin(
      request,
      "google_invalid_request",
    );
  }

  const cookieStore = await cookies();

  const transaction =
    decodeGoogleOAuthTransaction(
      cookieStore.get(
        GOOGLE_OAUTH_TRANSACTION_COOKIE,
      )?.value,
    );

  if (
    !transaction ||
    !isValidGoogleOAuthState(
      transaction.state,
      state,
    )
  ) {
    return redirectToLogin(
      request,
      "google_invalid_state",
    );
  }

  try {
    const accessToken =
      await exchangeGoogleAuthorizationCode(
        request,
        code,
        transaction.verifier,
      );

    const profile =
      await getGoogleUserProfile(accessToken);

    let user = await getUserByIdentity(
      "GOOGLE",
      profile.providerAccountId,
    );

    if (!user) {
      try {
        user = await createUserWithIdentity({
          provider: "GOOGLE",
          providerAccountId:
            profile.providerAccountId,
          email: profile.email,
          name: profile.name,
          imageUrl: profile.imageUrl,
          locale: profile.locale,
        });
      } catch (error) {
        if (
          error instanceof Error &&
          error.message ===
            "email_already_registered"
        ) {
          return redirectToLogin(
            request,
            "google_account_exists",
          );
        }

        throw error;
      }
    }

    const session = await createUserSession(
      user.id,
      {
        deviceLabel: "Google Sign-in",
      },
    );

    const response = NextResponse.redirect(
      new URL("/account", request.url),
      {
        status: 302,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );

    response.cookies.set(
      GOOGLE_OAUTH_TRANSACTION_COOKIE,
      "",
      googleOAuthTransactionCookieOptions(0),
    );

    response.cookies.set(
      USER_SESSION_COOKIE,
      session.token,
      userSessionCookieOptions(),
    );

    return response;
  } catch {
    return redirectToLogin(
      request,
      "google_auth_failed",
    );
  }
}