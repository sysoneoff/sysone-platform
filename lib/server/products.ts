import { getSysOneEnv, requireBinding } from "@/lib/server/cloudflare";

export type PublicProduct = {
  slug: string;
  name: string;
  kind: string;
  category: string | null;
  description: string | null;
  status: string;
  pricingModel: string;
  priceMinor: number;
  currency: string;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
};

type ProductRow = {
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
  created_at: string;
  updated_at: string;
};

function toPublicProduct(row: ProductRow): PublicProduct {
  return {
    slug: row.slug,
    name: row.name,
    kind: row.kind,
    category: row.category,
    description: row.description,
    status: row.status,
    pricingModel: row.pricing_model,
    priceMinor: row.price_minor,
    currency: row.currency,
    featured: row.featured === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function getDb() {
  const env = getSysOneEnv();
  return requireBinding(env.SYSONE_DB, "SYSONE_DB");
}

export async function listPublishedProducts(kind?: string): Promise<PublicProduct[]> {
  const db = getDb();
  const whereKind = kind ? " AND kind = ?" : "";
  const statement = db.prepare(
    `SELECT slug, name, kind, category, description, status, pricing_model, price_minor, currency, featured, created_at, updated_at
     FROM products
     WHERE published = 1${whereKind}
     ORDER BY featured DESC, updated_at DESC, name ASC`,
  );

  const result = kind
    ? await statement.bind(kind.toUpperCase()).all<ProductRow>()
    : await statement.all<ProductRow>();

  return (result.results ?? []).map(toPublicProduct);
}

export async function getPublishedProductBySlug(slug: string): Promise<PublicProduct | null> {
  const db = getDb();
  const row = await db
    .prepare(
      `SELECT slug, name, kind, category, description, status, pricing_model, price_minor, currency, featured, created_at, updated_at
       FROM products
       WHERE slug = ? AND published = 1
       LIMIT 1`,
    )
    .bind(slug)
    .first<ProductRow>();

  return row ? toPublicProduct(row) : null;
}
