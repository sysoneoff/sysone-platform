import { isAdminAuthenticated, isSafeAdminMutation } from "@/lib/server/admin-auth";
import { deleteAdminReleaseFile, getAdminReleaseFileById } from "@/lib/server/admin-releases";
import { writeAdminAudit } from "@/lib/server/admin-products";

export const dynamic = "force-dynamic";
type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(request: Request, context: RouteContext) {
  if (!(await isAdminAuthenticated())) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  if (!isSafeAdminMutation(request)) {
    return Response.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  try {
    const file = await getAdminReleaseFileById(id);
    if (!file) return Response.json({ ok: false, error: "release_file_not_found" }, { status: 404 });
    await deleteAdminReleaseFile(id);
    await writeAdminAudit("release_file.delete", "product_file", id, {
      productVersionId: file.productVersionId,
      r2Key: file.r2Key,
    });
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Release file delete failed", error);
    return Response.json({ ok: false, error: "release_file_delete_failed" }, { status: 500 });
  }
}
