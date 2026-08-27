import { NextResponse } from "next/server";

import {
  createTelegramAuthorizationRequest,
  encodeTelegramOAuthTransaction,
  TELEGRAM_OAUTH_TRANSACTION_COOKIE,
  telegramOAuthTransactionCookieOptions,
} from "@/lib/server/telegram-oauth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const {
      authorizationUrl,
      transaction,
    } = await createTelegramAuthorizationRequest(
      request,
    );

    const response = NextResponse.redirect(
      authorizationUrl,
      {
        status: 302,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );

    response.cookies.set(
      TELEGRAM_OAUTH_TRANSACTION_COOKIE,
      encodeTelegramOAuthTransaction(
        transaction,
      ),
      telegramOAuthTransactionCookieOptions(),
    );

    return response;
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "telegram_auth_unavailable",
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }
}