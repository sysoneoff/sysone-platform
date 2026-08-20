import { isAdminAuthenticated, isSafeAdminMutation } from "@/lib/server/admin-auth";
import { getSysOneEnv, requireBinding } from "@/lib/server/cloudflare";
import { addAdminReleaseFile, getAdminReleaseById } from "@/lib/server/admin-releases";
import { writeAdminAudit } from "@/lib/server/admin-products";

export const dynamic = "force-dynamic";
type RouteContext = { params: Promise<{ id: string }> };

const MAX_RELEASE_BYTES = 95 * 1024 * 1024;
const ALLOWED_PLATFORMS = new Set(["WINDOWS", "ANDROID", "MACOS", "LINUX", "WEB", "OTHER"]);
const ALLOWED_EXTENSIONS = new Set([
  "exe", "msi", "apk", "aab", "zip", "dmg", "pkg", "deb", "rpm", "appimage", "tar", "gz", "tgz",
]);

function sanitizeName(name: string) {
  const cleaned = name
    .replace(/\\/g, "/")
    .split("/")
    .pop()!
    .toLowerCase()
    .replace(/[^a-z0-9._+-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
  return cleaned || "build.bin";
}

function extensionOf(name: string) {
  const clean = sanitizeName(name);
  return clean.includes(".") ? clean.split(".").pop()!.toLowerCase() : "";
}

export async function POST(request: Request, context: RouteContext) {
  if (!(await isAdminAuthenticated())) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  if (!isSafeAdminMutation(request)) {
    return Response.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  const release = await getAdminReleaseById(id);
  if (!release) return Response.json({ ok: false, error: "release_not_found" }, { status: 404 });

  let key = "";
  try {
    const form = await request.formData();
    const file = form.get("file");
    const platform = String(form.get("platform") ?? "").trim().toUpperCase();
    const checksum = String(form.get("checksumSha256") ?? "").trim().toLowerCase();

    if (!(file instanceof File)) return Response.json({ ok: false, error: "file_required" }, { status: 400 });
    if (!ALLOWED_PLATFORMS.has(platform)) return Response.json({ ok: false, error: "invalid_platform" }, { status: 400 });
    if (!ALLOWED_EXTENSIONS.has(extensionOf(file.name))) {
      return Response.json({ ok: false, error: "unsupported_release_file" }, { status: 415 });
    }
    if (file.size <= 0 || file.size > MAX_RELEASE_BYTES) {
      return Response.json({ ok: false, error: "release_file_too_large" }, { status: 413 });
    }
    if (!/^[a-f0-9]{64}$/.test(checksum)) {
      return Response.json({ ok: false, error: "invalid_checksum" }, { status: 400 });
    }

    const safeName = sanitizeName(file.name);
    key = `releases/${release.productSlug}/${release.id}/${crypto.randomUUID()}-${safeName}`;
    const bucket = requireBinding(getSysOneEnv().SYSONE_DOWNLOADS, "SYSONE_DOWNLOADS");

    await bucket.put(key, file.stream(), {
      httpMetadata: {
        contentType: file.type || "application/octet-stream",
        cacheControl: "private, no-store",
      },
      customMetadata: {
        originalName: file.name.slice(0, 150),
        productId: release.productId,
        productVersionId: release.id,
        version: release.version,
        platform,
        checksumSha256: checksum,
      },
    });

    try {
      const saved = await addAdminReleaseFile({
        releaseId: release.id,
        platform,
        key,
        sizeBytes: file.size,
        checksumSha256: checksum,
      });
      await writeAdminAudit("release_file.upload", "product_file", saved?.id, {
        productVersionId: release.id,
        platform,
        size: file.size,
        checksumSha256: checksum,
        r2Key: key,
      });
      return Response.json({ ok: true, file: saved }, { status: 201 });
    } catch (dbError) {
      await bucket.delete(key);
      throw dbError;
    }
  } catch (error) {
    console.error("Release file upload failed", error);
    return Response.json({ ok: false, error: "release_upload_failed" }, { status: 500 });
  }
}
