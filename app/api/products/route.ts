import { listPublishedProducts } from "@/lib/server/products";

export const dynamic = "force-dynamic";

const ALLOWED_KINDS = new Set(["SOFTWARE", "GAME"]);

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const rawKind = url.searchParams.get("kind")?.trim().toUpperCase();
    const kind = rawKind && ALLOWED_KINDS.has(rawKind) ? rawKind : undefined;
    const products = await listPublishedProducts(kind);

    return Response.json(
      { ok: true, count: products.length, products },
      { headers: { "Cache-Control": "public, max-age=60, s-maxage=300" } },
    );
  } catch (error) {
    console.error("Failed to list SysOne products", error);
    return Response.json(
      { ok: false, error: "products_unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
