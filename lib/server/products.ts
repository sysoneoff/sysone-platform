import { getSysOneEnv, requireBinding } from "@/lib/server/cloudflare";

export type StorePlatform = {
  platform: string;
  architecture: string | null;
  minOs: string | null;
  minSystem: string | null;
  recommendedSystem: string | null;
};

export type StoreMedia = {
  id: string;
  type: string;
  key: string;
  alt: string | null;
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
  sortOrder: number;
};

export type StoreFeature = {
  id: string;
  title: string;
  description: string | null;
  sortOrder: number;
};

export type StorePromotion = {
  salePriceMinor: number;
  currency: string;
  startsAt: string | null;
  endsAt: string | null;
};

export type PublicProduct = {
  id: string;
  slug: string;
  name: string;
  kind: string;
  category: string | null;
  description: string | null;
  status: string;

  pricingModel: string;
  priceMinor: number;
  currency: string;
  currentPriceMinor: number;

  featured: boolean;
  featuredRank: number;

  tagline: string | null;
  shortDescription: string | null;
  developerName: string | null;
  releaseDate: string | null;
  ageRating: string | null;

  platforms: StorePlatform[];
  media: StoreMedia[];
  features: StoreFeature[];
  tags: string[];

  promotion: StorePromotion | null;

  createdAt: string;
  updatedAt: string;
};

type ProductRow = {
  id: string;
  slug: string;
  name: string;
  kind: string;
  category: string | null;
  description: string | null;
  status: string;

  pricing_model: string;
  price_minor: number;
  currency: string;

  featured: number;

  tagline: string | null;
  short_description: string | null;
  developer_name: string | null;
  release_date: string | null;
  age_rating: string | null;
  featured_rank: number | null;

  created_at: string;
  updated_at: string;
};

type PlatformRow = {
  product_id: string;
  platform: string;
  architecture: string | null;
  min_os: string | null;
  min_system: string | null;
  recommended_system: string | null;
};

type MediaRow = {
  id: string;
  product_id: string;
  media_type: string;
  r2_key: string;
  alt_text: string | null;
  width: number | null;
  height: number | null;
  duration_seconds: number | null;
  sort_order: number;
};

type FeatureRow = {
  id: string;
  product_id: string;
  title: string;
  description: string | null;
  sort_order: number;
};

type TagRow = {
  product_id: string;
  tag: string;
};

type PromotionRow = {
  product_id: string;
  sale_price_minor: number;
  currency: string;
  starts_at: string | null;
  ends_at: string | null;
};

function getDb() {
  const env = getSysOneEnv();
  return requireBinding(env.SYSONE_DB, "SYSONE_DB");
}

function normalizeKind(kind?: string) {
  return kind?.trim().toUpperCase();
}

function makePlaceholders(count: number) {
  return new Array(count).fill("?").join(",");
}

function mapPlatform(row: PlatformRow): StorePlatform {
  return {
    platform: row.platform,
    architecture: row.architecture,
    minOs: row.min_os,
    minSystem: row.min_system,
    recommendedSystem: row.recommended_system,
  };
}

function mapMedia(row: MediaRow): StoreMedia {
  return {
    id: row.id,
    type: row.media_type,
    key: row.r2_key,
    alt: row.alt_text,
    width: row.width,
    height: row.height,
    durationSeconds: row.duration_seconds,
    sortOrder: row.sort_order,
  };
}

function mapFeature(row: FeatureRow): StoreFeature {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    sortOrder: row.sort_order,
  };
}

async function hydrateProducts(rows: ProductRow[]): Promise<PublicProduct[]> {
  if (!rows.length) return [];

  const db = getDb();
  const ids = rows.map((row) => row.id);
  const placeholders = makePlaceholders(ids.length);

  const [
    platformResult,
    mediaResult,
    featureResult,
    tagResult,
    promotionResult,
  ] = await Promise.all([
    db
      .prepare(
        `SELECT
          product_id,
          platform,
          architecture,
          min_os,
          min_system,
          recommended_system
        FROM product_platforms
        WHERE product_id IN (${placeholders})
        ORDER BY product_id, platform, architecture`,
      )
      .bind(...ids)
      .all<PlatformRow>(),

    db
      .prepare(
        `SELECT
          id,
          product_id,
          media_type,
          r2_key,
          alt_text,
          width,
          height,
          duration_seconds,
          sort_order
        FROM product_media
        WHERE product_id IN (${placeholders})
        ORDER BY product_id, sort_order, created_at`,
      )
      .bind(...ids)
      .all<MediaRow>(),

    db
      .prepare(
        `SELECT
          id,
          product_id,
          title,
          description,
          sort_order
        FROM product_features
        WHERE product_id IN (${placeholders})
        ORDER BY product_id, sort_order, created_at`,
      )
      .bind(...ids)
      .all<FeatureRow>(),

    db
      .prepare(
        `SELECT
          product_id,
          tag
        FROM product_tags
        WHERE product_id IN (${placeholders})
        ORDER BY product_id, tag`,
      )
      .bind(...ids)
      .all<TagRow>(),

    db
      .prepare(
        `SELECT
          product_id,
          sale_price_minor,
          currency,
          starts_at,
          ends_at
        FROM product_promotions
        WHERE product_id IN (${placeholders})
          AND enabled = 1
          AND (starts_at IS NULL OR datetime(starts_at) <= datetime('now'))
          AND (ends_at IS NULL OR datetime(ends_at) > datetime('now'))
        ORDER BY product_id, created_at DESC`,
      )
      .bind(...ids)
      .all<PromotionRow>(),
  ]);

  const platformsByProduct = new Map<string, StorePlatform[]>();
  const mediaByProduct = new Map<string, StoreMedia[]>();
  const featuresByProduct = new Map<string, StoreFeature[]>();
  const tagsByProduct = new Map<string, string[]>();
  const promotionByProduct = new Map<string, StorePromotion>();

  for (const row of platformResult.results ?? []) {
    const list = platformsByProduct.get(row.product_id) ?? [];
    list.push(mapPlatform(row));
    platformsByProduct.set(row.product_id, list);
  }

  for (const row of mediaResult.results ?? []) {
    const list = mediaByProduct.get(row.product_id) ?? [];
    list.push(mapMedia(row));
    mediaByProduct.set(row.product_id, list);
  }

  for (const row of featureResult.results ?? []) {
    const list = featuresByProduct.get(row.product_id) ?? [];
    list.push(mapFeature(row));
    featuresByProduct.set(row.product_id, list);
  }

  for (const row of tagResult.results ?? []) {
    const list = tagsByProduct.get(row.product_id) ?? [];
    list.push(row.tag);
    tagsByProduct.set(row.product_id, list);
  }

  for (const row of promotionResult.results ?? []) {
    if (promotionByProduct.has(row.product_id)) continue;

    promotionByProduct.set(row.product_id, {
      salePriceMinor: row.sale_price_minor,
      currency: row.currency,
      startsAt: row.starts_at,
      endsAt: row.ends_at,
    });
  }

  return rows.map((row) => {
    const promotion = promotionByProduct.get(row.id) ?? null;

    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      kind: row.kind,
      category: row.category,
      description: row.description,
      status: row.status,

      pricingModel: row.pricing_model,
      priceMinor: row.price_minor,
      currency: row.currency,
      currentPriceMinor: promotion?.salePriceMinor ?? row.price_minor,

      featured: row.featured === 1,
      featuredRank: row.featured_rank ?? 0,

      tagline: row.tagline,
      shortDescription: row.short_description,
      developerName: row.developer_name,
      releaseDate: row.release_date,
      ageRating: row.age_rating,

      platforms: platformsByProduct.get(row.id) ?? [],
      media: mediaByProduct.get(row.id) ?? [],
      features: featuresByProduct.get(row.id) ?? [],
      tags: tagsByProduct.get(row.id) ?? [],

      promotion,

      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  });
}

const BASE_PRODUCT_SELECT = `
  SELECT
    p.id,
    p.slug,
    p.name,
    p.kind,
    p.category,
    p.description,
    p.status,
    p.pricing_model,
    p.price_minor,
    p.currency,
    p.featured,

    sp.tagline,
    sp.short_description,
    sp.developer_name,
    sp.release_date,
    sp.age_rating,
    sp.featured_rank,

    p.created_at,
    p.updated_at

  FROM products p

  LEFT JOIN product_store_profiles sp
    ON sp.product_id = p.id
`;

export async function listPublishedProducts(
  kind?: string,
): Promise<PublicProduct[]> {
  const db = getDb();
  const normalizedKind = normalizeKind(kind);

  const sql = `
    ${BASE_PRODUCT_SELECT}

    WHERE p.published = 1
    ${normalizedKind ? "AND p.kind = ?" : ""}

    ORDER BY
      COALESCE(sp.featured_rank, 0) DESC,
      p.featured DESC,
      p.updated_at DESC,
      p.name ASC
  `;

  const statement = db.prepare(sql);

  const result = normalizedKind
    ? await statement.bind(normalizedKind).all<ProductRow>()
    : await statement.all<ProductRow>();

  return hydrateProducts(result.results ?? []);
}

export async function getPublishedProductBySlug(
  slug: string,
): Promise<PublicProduct | null> {
  const normalizedSlug = slug.trim();

  if (!normalizedSlug) return null;

  const db = getDb();

  const row = await db
    .prepare(
      `
        ${BASE_PRODUCT_SELECT}

        WHERE p.slug = ?
          AND p.published = 1

        LIMIT 1
      `,
    )
    .bind(normalizedSlug)
    .first<ProductRow>();

  if (!row) return null;

  const [product] = await hydrateProducts([row]);

  return product ?? null;
}