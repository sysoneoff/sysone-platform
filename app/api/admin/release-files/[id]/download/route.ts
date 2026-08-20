import { isAdminAuthenticated } from "@/lib/server/admin-auth";
import { getSysOneEnv, requireBinding } from "@/lib/server/cloudflare";
import { getAdminReleaseFileById } from "@/lib/server/admin-releases";

export const dynamic = "force-dynamic";
type RouteContext = { params: Promise<{ id: string }> };

function safeDownloadName(key: string) {
  const raw = key.split("/").pop() || "download.bin";
  return raw.replace(/^[0-9a-f-]{36}-/i, "").replace(/[^a-zA-Z0-9._+-]/g, "_").slice(0, 160) || "download.bin";
}

export async function GET(_request: Request, context: RouteContext) {
  if (!(await isAdminAuthenticated())) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const file = await getAdminReleaseFileById(id);
  if (!file) return Response.json({ ok: false, error: "release_file_not_found" }, { status: 404 });

  try {
    const bucket = requireBinding(getSysOneEnv().SYSONE_DOWNLOADS, "SYSONE_DOWNLOADS");
    const object = await bucket.get(file.r2Key);
    if (!object) return Response.json({ ok: false, error: "release_object_not_found" }, { status: 404 });

    const headers = new Headers();
    headers.set("Content-Type", object.httpMetadata?.contentType || "application/octet-stream");
    headers.set("Content-Disposition", `attachment; filename="${safeDownloadName(file.r2Key)}"`);
    headers.set("Cache-Control", "private, no-store");
    headers.set("X-Content-Type-Options", "nosniff");
    if (file.sizeBytes !== null) headers.set("Content-Length", String(file.sizeBytes));
    if (file.checksumSha256) headers.set("X-SysOne-SHA256", file.checksumSha256);

    return new Response(object.body, { status: 200, headers });
  } catch (error) {
    console.error("Admin release download failed", error);
    return Response.json({ ok: false, error: "release_download_failed" }, { status: 500 });
  }
}
