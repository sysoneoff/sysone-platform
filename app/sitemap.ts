import type { MetadataRoute } from "next";

import { listPublishedProducts } from "@/lib/server/products";

export const dynamic = "force-dynamic";

const FALLBACK_SITE_URL =
  "https://sysone.top";

function getBaseUrl() {
  const configured =
    process.env.NEXT_PUBLIC_SITE_URL?.trim();

  return (configured || FALLBACK_SITE_URL).replace(
    /\/+$/,
    "",
  );
}

function getValidDate(value: string) {
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? undefined
    : date;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getBaseUrl();

  const products =
    await listPublishedProducts();

  const staticPaths = [
    {
      path: "",
      priority: 1,
      changeFrequency: "weekly" as const,
    },
    {
      path: "/products",
      priority: 0.9,
      changeFrequency: "daily" as const,
    },
    {
      path: "/games",
      priority: 0.9,
      changeFrequency: "daily" as const,
    },
    {
      path: "/marketplace",
      priority: 0.9,
      changeFrequency: "daily" as const,
    },
    {
      path: "/ai",
      priority: 0.7,
      changeFrequency: "weekly" as const,
    },
    {
      path: "/labs",
      priority: 0.6,
      changeFrequency: "weekly" as const,
    },
    {
      path: "/docs",
      priority: 0.7,
      changeFrequency: "weekly" as const,
    },
    {
      path: "/support",
      priority: 0.7,
      changeFrequency: "weekly" as const,
    },
    {
      path: "/pricing",
      priority: 0.6,
      changeFrequency: "monthly" as const,
    },
    {
      path: "/about",
      priority: 0.5,
      changeFrequency: "monthly" as const,
    },
    {
      path: "/contact",
      priority: 0.5,
      changeFrequency: "monthly" as const,
    },
  ];

  const staticEntries: MetadataRoute.Sitemap =
    staticPaths.map((item) => ({
      url: `${base}${item.path}`,
      changeFrequency:
        item.changeFrequency,
      priority: item.priority,
    }));

  const productEntries: MetadataRoute.Sitemap =
    products.map((product) => {
      const path =
        product.kind === "GAME"
          ? `/games/${product.slug}`
          : `/products/${product.slug}`;

      const lastModified =
        getValidDate(
          product.updatedAt,
        );

      return {
        url: `${base}${path}`,
        ...(lastModified
          ? { lastModified }
          : {}),
        changeFrequency:
          "weekly" as const,
        priority: product.featured
          ? 0.9
          : 0.8,
      };
    });

  return [
    ...staticEntries,
    ...productEntries,
  ];
}