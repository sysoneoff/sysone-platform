import { getPublishedProductBySlug } from "@/lib/server/products";
import { listPublicDownloadsBySlug } from "@/lib/server/public-downloads";
import { listPrivateDownloadsForUser } from "@/lib/server/private-downloads";
import { getCurrentUser } from "@/lib/server/user-auth";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { slug } = await context.params;
    const cleanSlug = slug?.trim().toLowerCase();

    if (!cleanSlug) {
      return Response.json(
        { ok: false, error: "product_not_found" },
        {
          status: 404,
          headers: { "Cache-Control": "no-store" },
        },
      );
    }

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

    const pricingModel = product.pricingModel.toUpperCase();

    if (pricingModel === "FREE" || pricingModel === "FREEMIUM") {
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
    }

    const user = await getCurrentUser();

    if (!user) {
      return Response.json(
        { ok: false, error: "authentication_required" },
        {
          status: 401,
          headers: { "Cache-Control": "no-store" },
        },
      );
    }

    const files = await listPrivateDownloadsForUser(user.id, cleanSlug);

    if (files.length === 0) {
      return Response.json(
        { ok: false, error: "entitlement_required" },
        {
          status: 403,
          headers: { "Cache-Control": "no-store" },
        },
      );
    }

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
      downloadUrl: `/api/private-downloads/${encodeURIComponent(file.id)}`,
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
          "Cache-Control": "private, no-store",
        },
      },
    );
  } catch (error) {
    console.error("Failed to list product downloads", error);

    return Response.json(
      { ok: false, error: "downloads_unavailable" },
      {
        status: 503,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }
}