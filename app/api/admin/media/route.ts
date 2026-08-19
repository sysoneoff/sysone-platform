import { isAdminAuthenticated, isSafeAdminMutation } from "@/lib/server/admin-auth";
import { getSysOneEnv, requireBinding } from "@/lib/server/cloudflare";
import { writeAdminAudit } from "@/lib/server/admin-products";

export const dynamic = "force-dynamic";

type MediaObject = {
  key: string;
  size: number;
  uploaded: Date;
  httpMetadata?: {
    contentType?: string;
  };
};

function publicMediaUrl(key: string) {
  return `/api/media/${key.split("/").map(encodeURIComponent).join("/")}`;
}

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    const bucket = requireBinding(getSysOneEnv().SYSONE_ASSETS, "SYSONE_ASSETS");
    const result = await bucket.list({ prefix: "media/", limit: 200 });
    const objects = result.objects as MediaObject[];

    return Response.json(
      {
        ok: true,
        assets: objects
          .sort((a: MediaObject, b: MediaObject) => b.uploaded.getTime() - a.uploaded.getTime())
          .map((object: MediaObject) => ({
            key: object.key,
            size: object.size,
            uploaded: object.uploaded.toISOString(),
            contentType: object.httpMetadata?.contentType ?? null,
            url: publicMediaUrl(object.key),
          })),
        truncated: result.truncated,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Admin media list failed", error);
    return Response.json({ ok: false, error: "media_unavailable" }, { status: 503 });
  }
}

export async function DELETE(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  if (!isSafeAdminMutation(request)) {
    return Response.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const key = new URL(request.url).searchParams.get("key") ?? "";
  if (!key.startsWith("media/") || key.length > 500) {
    return Response.json({ ok: false, error: "invalid_key" }, { status: 400 });
  }

  try {
    const bucket = requireBinding(getSysOneEnv().SYSONE_ASSETS, "SYSONE_ASSETS");
    await bucket.delete(key);
    await writeAdminAudit("media.delete", "r2_object", key);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Admin media delete failed", error);
    return Response.json({ ok: false, error: "media_delete_failed" }, { status: 500 });
  }
}
