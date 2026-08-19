import { isAdminAuthenticated, isSafeAdminMutation } from "@/lib/server/admin-auth";
import { getSysOneEnv, requireBinding } from "@/lib/server/cloudflare";
import { writeAdminAudit } from "@/lib/server/admin-products";

export const dynamic = "force-dynamic";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/avif"]);

function sanitizeName(name: string) {
  const parts = name.split(".");
  const extension = parts.length > 1 ? `.${parts.pop()!.toLowerCase().replace(/[^a-z0-9]/g, "")}` : "";
  const base = parts.join(".").toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 70) || "asset";
  return `${base}${extension}`;
}

function publicMediaUrl(key: string) {
  return `/api/media/${key.split("/").map(encodeURIComponent).join("/")}`;
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  if (!isSafeAdminMutation(request)) return Response.json({ ok: false, error: "forbidden" }, { status: 403 });

  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return Response.json({ ok: false, error: "file_required" }, { status: 400 });
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) return Response.json({ ok: false, error: "unsupported_file_type" }, { status: 415 });
    if (file.size <= 0 || file.size > MAX_IMAGE_BYTES) return Response.json({ ok: false, error: "file_too_large" }, { status: 413 });

    const now = new Date();
    const key = `media/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${crypto.randomUUID()}-${sanitizeName(file.name)}`;
    const bucket = requireBinding(getSysOneEnv().SYSONE_ASSETS, "SYSONE_ASSETS");
    await bucket.put(key, file.stream(), {
      httpMetadata: { contentType: file.type, cacheControl: "public, max-age=31536000, immutable" },
      customMetadata: { originalName: file.name.slice(0, 150), source: "control-center" },
    });

    await writeAdminAudit("media.upload", "r2_object", key, { size: file.size, type: file.type });
    return Response.json({
      ok: true,
      asset: { key, name: file.name, size: file.size, contentType: file.type, url: publicMediaUrl(key) },
    }, { status: 201 });
  } catch (error) {
    console.error("Admin media upload failed", error);
    return Response.json({ ok: false, error: "upload_failed" }, { status: 500 });
  }
}
