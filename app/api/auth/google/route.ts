import { NextResponse } from "next/server";
import {
  createGoogleAuthorizationRequest,
  encodeGoogleOAuthTransaction,
  GOOGLE_OAUTH_TRANSACTION_COOKIE,
  googleOAuthTransactionCookieOptions,
} from "@/lib/server/google-oauth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const {
      authorizationUrl,
      transaction,
    } = await createGoogleAuthorizationRequest(request);

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
      GOOGLE_OAUTH_TRANSACTION_COOKIE,
      encodeGoogleOAuthTransaction(transaction),
      googleOAuthTransactionCookieOptions(),
    );

    return response;
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "google_auth_unavailable",
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