import { isAdminAuthenticated } from "@/lib/server/admin-auth";
import { listAdminUsers } from "@/lib/server/admin-users";

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
    const users = await listAdminUsers();

    return Response.json(
      {
        ok: true,
        users,
      },
      {
        headers: noStore,
      },
    );
  } catch (error) {
    console.error("Admin users list failed", error);

    return Response.json(
      {
        ok: false,
        error: "users_unavailable",
      },
      {
        status: 503,
        headers: noStore,
      },
    );
  }
}