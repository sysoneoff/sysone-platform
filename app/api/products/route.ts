import { listPublishedProducts } from "@/lib/server/products";

export const dynamic = "force-dynamic";

const ALLOWED_KINDS = new Set([
  "SOFTWARE",
  "GAME",
  "AI_TOOL",
  "DIGITAL_PRODUCT",
]);

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const rawKind = url.searchParams.get("kind")?.trim().toUpperCase();

    if (rawKind && !ALLOWED_KINDS.has(rawKind)) {
      return Response.json(
        {
          ok: false,
          error: "invalid_product_kind",
          allowedKinds: Array.from(ALLOWED_KINDS),
        },
        {
          status: 400,
          headers: { "Cache-Control": "no-store" },
        },
      );
    }

    const products = await listPublishedProducts(rawKind || undefined);

    return Response.json(
      {
        ok: true,
        count: products.length,
        products,
      },
      {
        headers: {
          "Cache-Control": "public, max-age=60, s-maxage=300",
        },
      },
    );
  } catch (error) {
    console.error("Failed to list SysOne products", error);

    return Response.json(
      {
        ok: false,
        error: "products_unavailable",
      },
      {
        status: 503,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }
}