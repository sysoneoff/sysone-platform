import { isAdminAuthenticated, isSafeAdminMutation } from "@/lib/server/admin-auth";
import { deleteAdminRelease, getAdminReleaseById, updateAdminRelease } from "@/lib/server/admin-releases";
import { writeAdminAudit } from "@/lib/server/admin-products";

export const dynamic = "force-dynamic";
type RouteContext = { params: Promise<{ id: string }> };

function unauthorized() {
  return Response.json({ ok: false, error: "unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
}

export async function GET(_request: Request, context: RouteContext) {
  if (!(await isAdminAuthenticated())) return unauthorized();
  const { id } = await context.params;
  const release = await getAdminReleaseById(id);
  return release
    ? Response.json({ ok: true, release }, { headers: { "Cache-Control": "no-store" } })
    : Response.json({ ok: false, error: "release_not_found" }, { status: 404 });
}

export async function PUT(request: Request, context: RouteContext) {
  if (!(await isAdminAuthenticated())) return unauthorized();
  if (!isSafeAdminMutation(request)) return Response.json({ ok: false, error: "forbidden" }, { status: 403 });
  const { id } = await context.params;

  try {
    const release = await updateAdminRelease(id, await request.json());
    if (!release) return Response.json({ ok: false, error: "release_not_found" }, { status: 404 });
    await writeAdminAudit("release.update", "product_version", id, {
      productId: release.productId,
      version: release.version,
      channel: release.channel,
    });
    return Response.json({ ok: true, release });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";
    const conflict = /unique|constraint/i.test(message);
    const validation = /required|invalid_|not_found/i.test(message);
    console.error("Admin release update failed", error);
    return Response.json(
      { ok: false, error: conflict ? "release_conflict" : validation ? message : "release_update_failed" },
      { status: conflict ? 409 : validation ? 400 : 500 },
    );
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  if (!(await isAdminAuthenticated())) return unauthorized();
  if (!isSafeAdminMutation(request)) return Response.json({ ok: false, error: "forbidden" }, { status: 403 });
  const { id } = await context.params;

  try {
    const release = await getAdminReleaseById(id);
    if (!release) return Response.json({ ok: false, error: "release_not_found" }, { status: 404 });
    await deleteAdminRelease(id);
    await writeAdminAudit("release.delete", "product_version", id, {
      productId: release.productId,
      version: release.version,
      deletedFiles: release.files.length,
    });
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Admin release delete failed", error);
    return Response.json({ ok: false, error: "release_delete_failed" }, { status: 500 });
  }
}
