import { isAdminAuthenticated } from "@/lib/server/admin-auth";
import { getAdminOverview } from "@/lib/server/admin-overview";

export const dynamic = "force-dynamic";

const noStore = {
  "Cache-Control": "no-store",
};

function unauthorized() {
  return Response.json(
    {
      ok: false,
      error: "unauthorized",
    },
    {
      status: 401,
      headers: noStore,
    },
  );
}

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return unauthorized();
  }

  try {
    const overview = await getAdminOverview();

    return Response.json(
      {
        ok: true,
        overview,
      },
      {
        headers: noStore,
      },
    );
  } catch (error) {
    console.error(
      "Admin overview load failed",
      error,
    );

    return Response.json(
      {
        ok: false,
        error: "overview_unavailable",
      },
      {
        status: 503,
        headers: noStore,
      },
    );
  }
}