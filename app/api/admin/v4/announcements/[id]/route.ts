import { isAdminAuthenticated, isSafeAdminMutation } from "@/lib/server/admin-auth";
import { deleteAnnouncement, updateAnnouncement } from "@/lib/server/announcements";
import { writeAdminAudit } from "@/lib/server/admin-products";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function unauthorized() {
  return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
}

export async function PUT(request: Request, context: RouteContext) {
  if (!(await isAdminAuthenticated())) return unauthorized();

  if (!isSafeAdminMutation(request)) {
    return Response.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const { id } = await context.params;

  try {
    const announcement = await updateAnnouncement(id, await request.json());

    if (!announcement) {
      return Response.json(
        { ok: false, error: "announcement_not_found" },
        { status: 404 },
      );
    }

    await writeAdminAudit("announcement.update", "announcement", id);

    return Response.json({ ok: true, announcement });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "announcement_update_failed";

    return Response.json(
      { ok: false, error: message },
      { status: /required|invalid/.test(message) ? 400 : 500 },
    );
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  if (!(await isAdminAuthenticated())) return unauthorized();

  if (!isSafeAdminMutation(request)) {
    return Response.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const { id } = await context.params;

  try {
    const deleted = await deleteAnnouncement(id);

    if (!deleted) {
      return Response.json(
        { ok: false, error: "announcement_not_found" },
        { status: 404 },
      );
    }

    await writeAdminAudit("announcement.delete", "announcement", id);

    return Response.json({ ok: true });
  } catch {
    return Response.json(
      { ok: false, error: "announcement_delete_failed" },
      { status: 500 },
    );
  }
}
