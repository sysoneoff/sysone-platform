import { NextResponse } from "next/server";
import { getAccountData } from "@/lib/server/account-data";
import { getCurrentUser } from "@/lib/server/user-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      {
        ok: false,
        error: "authentication_required",
      },
      {
        status: 401,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }

  const account = await getAccountData(user.id);

  return NextResponse.json(
    {
      ok: true,
      user,
      account,
    },
    {
      headers: {
        "Cache-Control": "private, no-store",
      },
    },
  );
}
