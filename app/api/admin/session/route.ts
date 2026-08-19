import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  adminCookieOptions,
  createAdminSessionToken,
  isAdminAuthenticated,
  isSafeAdminMutation,
  verifyAdminSecret,
} from "@/lib/server/admin-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ ok: true, authenticated: await isAdminAuthenticated() }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  if (!isSafeAdminMutation(request)) return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });

  let payload: { secret?: string };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
  }

  const result = await verifyAdminSecret(payload.secret ?? "");
  if (!result.ok) {
    const status = result.reason === "misconfigured" ? 503 : 401;
    return NextResponse.json({ ok: false, error: result.reason === "misconfigured" ? "admin_not_configured" : "invalid_credentials" }, { status });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE_NAME, await createAdminSessionToken(), adminCookieOptions());
  return response;
}

export async function DELETE(request: Request) {
  if (!isSafeAdminMutation(request)) return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE_NAME, "", { ...adminCookieOptions(), maxAge: 0 });
  return response;
}
