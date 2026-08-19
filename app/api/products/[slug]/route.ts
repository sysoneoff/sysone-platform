import { getPublishedProductBySlug } from "@/lib/server/products";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { slug } = await context.params;
    const product = await getPublishedProductBySlug(slug);

    if (!product) {
      return Response.json(
        { ok: false, error: "product_not_found" },
        { status: 404, headers: { "Cache-Control": "no-store" } },
      );
    }

    return Response.json(
      { ok: true, product },
      { headers: { "Cache-Control": "public, max-age=60, s-maxage=300" } },
    );
  } catch (error) {
    console.error("Failed to read SysOne product", error);
    return Response.json(
      { ok: false, error: "product_unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
