import {
  isAdminAuthenticated,
  isSafeAdminMutation,
} from "@/lib/server/admin-auth";
import { adminUserExists } from "@/lib/server/admin-users";
import { writeAdminAudit } from "@/lib/server/admin-products";
import { revokeAllUserSessions } from "@/lib/server/user-auth";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

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

export async function DELETE(
  request: Request,
  context: RouteContext,
) {
  if (!(await isAdminAuthenticated())) {
    return unauthorized();
  }

  if (!isSafeAdminMutation(request)) {
    return Response.json(
      {
        ok: false,
        error: "forbidden",
      },
      {
        status: 403,
        headers: noStore,
      },
    );
  }

  const { id } = await context.params;

  try {
    if (!(await adminUserExists(id))) {
      return Response.json(
        {
          ok: false,
          error: "user_not_found",
        },
        {
          status: 404,
          headers: noStore,
        },
      );
    }

    await revokeAllUserSessions(id);

    await writeAdminAudit(
      "user.sessions.revoke_all",
      "user",
      id,
      {
        userId: id,
      },
    );

    return Response.json(
      {
        ok: true,
      },
      {
        headers: noStore,
      },
    );
  } catch (error) {
    console.error("Admin user session revoke failed", error);

    return Response.json(
      {
        ok: false,
        error: "session_revoke_failed",
      },
      {
        status: 500,
        headers: noStore,
      },
    );
  }
}