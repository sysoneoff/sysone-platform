import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  getCurrentUser,
  isSafeUserMutation,
  revokeUserSession,
  USER_SESSION_COOKIE,
  userSessionCookieOptions,
} from "@/lib/server/user-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();

  return NextResponse.json(
    {
      ok: true,
      authenticated: Boolean(user),
      user,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}

export async function DELETE(request: Request) {
  if (!isSafeUserMutation(request)) {
    return NextResponse.json(
      {
        ok: false,
        error: "forbidden",
      },
      {
        status: 403,
      },
    );
  }

  const cookieStore = await cookies();
  const token =
    cookieStore.get(USER_SESSION_COOKIE)?.value ?? null;

  if (token) {
    await revokeUserSession(token);
  }

  const response = NextResponse.json({
    ok: true,
  });

  response.cookies.set(
    USER_SESSION_COOKIE,
    "",
    {
      ...userSessionCookieOptions(),
      maxAge: 0,
    },
  );

  return response;
}