import { getSysOneEnv, requireBinding } from "@/lib/server/cloudflare";
import { getPublicDownloadFileById } from "@/lib/server/public-downloads";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function safeDownloadName(key: string) {
  const raw = key.split("/").pop() || "download.bin";

  return (
    raw
      .replace(/^[0-9a-f-]{36}-/i, "")
      .replace(/[^a-zA-Z0-9._+-]/g, "_")
      .slice(0, 160) || "download.bin"
  );
}

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  if (!id?.trim()) {
    return Response.json(
      { ok: false, error: "download_not_found" },
      {
        status: 404,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }

  try {
    const file = await getPublicDownloadFileById(id);

    if (!file) {
      return Response.json(
        { ok: false, error: "download_not_found" },
        {
          status: 404,
          headers: { "Cache-Control": "no-store" },
        },
      );
    }

    const bucket = requireBinding(
      getSysOneEnv().SYSONE_DOWNLOADS,
      "SYSONE_DOWNLOADS",
    );

    const object = await bucket.get(file.r2Key);

    if (!object) {
      console.error("Public download object missing", {
        fileId: file.id,
        r2Key: file.r2Key,
      });

      return Response.json(
        { ok: false, error: "download_not_found" },
        {
          status: 404,
          headers: { "Cache-Control": "no-store" },
        },
      );
    }

    const headers = new Headers();

    headers.set(
      "Content-Type",
      object.httpMetadata?.contentType || "application/octet-stream",
    );

    headers.set(
      "Content-Disposition",
      `attachment; filename="${safeDownloadName(file.r2Key)}"`,
    );

    headers.set("Cache-Control", "private, no-store");
    headers.set("X-Content-Type-Options", "nosniff");

    if (file.sizeBytes !== null) {
      headers.set("Content-Length", String(file.sizeBytes));
    }

    if (file.checksumSha256) {
      headers.set("X-SysOne-SHA256", file.checksumSha256);
    }

    headers.set("X-SysOne-Product", file.productSlug);
    headers.set("X-SysOne-Version", file.version);
    headers.set("X-SysOne-Channel", file.channel);

    return new Response(object.body, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Public download failed", error);

    return Response.json(
      { ok: false, error: "download_unavailable" },
      {
        status: 503,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }
}