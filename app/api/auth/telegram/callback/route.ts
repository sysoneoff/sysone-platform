import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  decodeTelegramOAuthTransaction,
  exchangeTelegramAuthorizationCode,
  getTelegramUserProfile,
  isValidTelegramOAuthState,
  TELEGRAM_OAUTH_TRANSACTION_COOKIE,
  telegramOAuthTransactionCookieOptions,
} from "@/lib/server/telegram-oauth";

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

  url.searchParams.set(
    "error",
    error,
  );

  const response =
    NextResponse.redirect(
      url,
      {
        status: 302,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );

  response.cookies.set(
    TELEGRAM_OAUTH_TRANSACTION_COOKIE,
    "",
    telegramOAuthTransactionCookieOptions(
      0,
    ),
  );

  return response;
}

export async function GET(
  request: Request,
) {
  const url = new URL(
    request.url,
  );

  const providerError =
    url.searchParams.get(
      "error",
    );

  if (providerError) {
    return redirectToLogin(
      request,
      "telegram_cancelled",
    );
  }

  const code =
    url.searchParams
      .get("code")
      ?.trim();

  const state =
    url.searchParams.get(
      "state",
    );

  if (!code || !state) {
    return redirectToLogin(
      request,
      "telegram_invalid_request",
    );
  }

  const cookieStore =
    await cookies();

  const transaction =
    decodeTelegramOAuthTransaction(
      cookieStore.get(
        TELEGRAM_OAUTH_TRANSACTION_COOKIE,
      )?.value,
    );

  if (
    !transaction ||
    !isValidTelegramOAuthState(
      transaction.state,
      state,
    )
  ) {
    return redirectToLogin(
      request,
      "telegram_invalid_state",
    );
  }

  try {
    const idToken =
      await exchangeTelegramAuthorizationCode(
        request,
        code,
        transaction.verifier,
      );

    const profile =
      await getTelegramUserProfile(
        idToken,
      );

    let user =
      await getUserByIdentity(
        "TELEGRAM",
        profile.providerAccountId,
      );

    if (!user) {
      user =
        await createUserWithIdentity({
          provider: "TELEGRAM",
          providerAccountId:
            profile.providerAccountId,
          email: null,
          name: profile.name,
          imageUrl:
            profile.imageUrl,
          username:
            profile.username,
          locale:
            profile.locale,
        });
    }

    const session =
      await createUserSession(
        user.id,
        {
          deviceLabel:
            "Telegram Sign-in",
        },
      );

    const response =
      NextResponse.redirect(
        new URL(
          "/account",
          request.url,
        ),
        {
          status: 302,
          headers: {
            "Cache-Control":
              "no-store",
          },
        },
      );

    response.cookies.set(
      TELEGRAM_OAUTH_TRANSACTION_COOKIE,
      "",
      telegramOAuthTransactionCookieOptions(
        0,
      ),
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
      "telegram_auth_failed",
    );
  }
}