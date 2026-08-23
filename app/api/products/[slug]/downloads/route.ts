import { getPublishedProductBySlug } from "@/lib/server/products";
import { listPublicDownloadsBySlug } from "@/lib/server/public-downloads";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { slug } = await context.params;
    const cleanSlug = slug.trim().toLowerCase();

    const product = await getPublishedProductBySlug(cleanSlug);

    if (!product) {
      return Response.json(
        { ok: false, error: "product_not_found" },
        {
          status: 404,
          headers: { "Cache-Control": "no-store" },
        },
      );
    }

    if (!["FREE", "FREEMIUM"].includes(product.pricingModel.toUpperCase())) {
      return Response.json(
        { ok: false, error: "downloads_unavailable" },
        {
          status: 403,
          headers: { "Cache-Control": "no-store" },
        },
      );
    }

    const files = await listPublicDownloadsBySlug(cleanSlug);

    const downloads = files.map((file) => ({
      id: file.id,
      productSlug: file.productSlug,
      productName: file.productName,
      version: file.version,
      channel: file.channel,
      platform: file.platform,
      sizeBytes: file.sizeBytes,
      checksumSha256: file.checksumSha256,
      createdAt: file.createdAt,
      downloadUrl: `/api/downloads/${encodeURIComponent(file.id)}`,
    }));

    return Response.json(
      {
        ok: true,
        product: {
          slug: product.slug,
          name: product.name,
          status: product.status,
          pricingModel: product.pricingModel,
        },
        count: downloads.length,
        downloads,
      },
      {
        headers: {
          "Cache-Control": "public, max-age=30, s-maxage=60",
        },
      },
    );
  } catch (error) {
    console.error("Failed to list public downloads", error);

    return Response.json(
      { ok: false, error: "downloads_unavailable" },
      {
        status: 503,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }
}