import { getSysOneEnv, requireBinding } from "@/lib/server/cloudflare";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ key: string[] }> };

export async function GET(_request: Request, context: RouteContext) {
  const { key: parts } = await context.params;
  const key = parts.join("/");
  if (!key.startsWith("media/")) return new Response("Not found", { status: 404 });

  try {
    const bucket = requireBinding(getSysOneEnv().SYSONE_ASSETS, "SYSONE_ASSETS");
    const object = await bucket.get(key);
    if (!object) return new Response("Not found", { status: 404 });

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    headers.set("Cache-Control", "public, max-age=31536000, immutable");
    headers.set("X-Content-Type-Options", "nosniff");
    return new Response(object.body, { headers });
  } catch (error) {
    console.error("Public media read failed", error);
    return new Response("Unavailable", { status: 503 });
  }
}
