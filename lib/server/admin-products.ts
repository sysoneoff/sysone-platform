import { getSysOneEnv, requireBinding } from "@/lib/server/cloudflare";

export type AdminProduct = {
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
  featured: boolean;
  published: boolean;
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
  published: number;
  created_at: string;
  updated_at: string;
};

export type ProductMutationInput = {
  slug?: string;
  name?: string;
  kind?: string;
  category?: string | null;
  description?: string | null;
  status?: string;
  pricingModel?: string;
  priceMinor?: number;
  currency?: string;
  featured?: boolean;
  published?: boolean;
};

function getDb() {
  return requireBinding(getSysOneEnv().SYSONE_DB, "SYSONE_DB");
}

function mapProduct(row: ProductRow): AdminProduct {
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
    featured: row.featured === 1,
    published: row.published === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function cleanText(value: unknown, max = 180) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

function cleanNullableText(value: unknown, max = 3000) {
  const text = cleanText(value, max);
  return text || null;
}

export function makeSlug(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function normalizeInput(input: ProductMutationInput, partial = false) {
  const output: ProductMutationInput = {};

  if (!partial || input.name !== undefined) {
    const name = cleanText(input.name, 120);
    if (!name) throw new Error("name_required");
    output.name = name;
  }

  if (!partial || input.slug !== undefined || input.name !== undefined) {
    const source = cleanText(input.slug, 100) || cleanText(input.name, 120);
    const slug = makeSlug(source);
    if (!slug) throw new Error("slug_required");
    output.slug = slug;
  }

  if (!partial || input.kind !== undefined) {
    const kind = cleanText(input.kind, 24).toUpperCase() || "SOFTWARE";
    if (!["SOFTWARE", "GAME"].includes(kind)) throw new Error("invalid_kind");
    output.kind = kind;
  }

  if (!partial || input.status !== undefined) {
    const status = cleanText(input.status, 32).toUpperCase() || "DRAFT";
    const allowed = ["DRAFT", "ALPHA", "BETA", "COMING_SOON", "ACTIVE", "RELEASED", "ARCHIVED"];
    if (!allowed.includes(status)) throw new Error("invalid_status");
    output.status = status;
  }

  if (!partial || input.pricingModel !== undefined) {
    const pricingModel = cleanText(input.pricingModel, 32).toUpperCase() || "FREE";
    const allowed = ["FREE", "FREEMIUM", "ONE_TIME", "SUBSCRIPTION", "CUSTOM", "TBD"];
    if (!allowed.includes(pricingModel)) throw new Error("invalid_pricing_model");
    output.pricingModel = pricingModel;
  }

  if (!partial || input.currency !== undefined) {
    const currency = cleanText(input.currency, 8).toUpperCase() || "UZS";
    if (!/^[A-Z]{3}$/.test(currency)) throw new Error("invalid_currency");
    output.currency = currency;
  }

  if (!partial || input.priceMinor !== undefined) {
    const price = Number(input.priceMinor ?? 0);
    if (!Number.isInteger(price) || price < 0 || price > 2_000_000_000) throw new Error("invalid_price");
    output.priceMinor = price;
  }

  if (!partial || input.category !== undefined) output.category = cleanNullableText(input.category, 100);
  if (!partial || input.description !== undefined) output.description = cleanNullableText(input.description, 4000);
  if (!partial || input.featured !== undefined) output.featured = Boolean(input.featured);
  if (!partial || input.published !== undefined) output.published = Boolean(input.published);

  return output;
}

export async function listAdminProducts() {
  const result = await getDb()
    .prepare(
      `SELECT id, slug, name, kind, category, description, status, pricing_model, price_minor,
              currency, featured, published, created_at, updated_at
       FROM products
       ORDER BY updated_at DESC, name ASC`,
    )
    .all<ProductRow>();
  return (result.results ?? []).map(mapProduct);
}

export async function createAdminProduct(input: ProductMutationInput) {
  const value = normalizeInput(input, false);
  const id = crypto.randomUUID();
  await getDb()
    .prepare(
      `INSERT INTO products
       (id, slug, name, kind, category, description, status, pricing_model, price_minor, currency, featured, published, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    )
    .bind(
      id,
      value.slug,
      value.name,
      value.kind,
      value.category,
      value.description,
      value.status,
      value.pricingModel,
      value.priceMinor,
      value.currency,
      value.featured ? 1 : 0,
      value.published ? 1 : 0,
    )
    .run();
  return getAdminProductById(id);
}

export async function getAdminProductById(id: string) {
  const row = await getDb()
    .prepare(
      `SELECT id, slug, name, kind, category, description, status, pricing_model, price_minor,
              currency, featured, published, created_at, updated_at
       FROM products WHERE id = ? LIMIT 1`,
    )
    .bind(id)
    .first<ProductRow>();
  return row ? mapProduct(row) : null;
}

export async function updateAdminProduct(id: string, input: ProductMutationInput) {
  const value = normalizeInput(input, true);
  const entries = Object.entries(value);
  if (!entries.length) return getAdminProductById(id);

  const columnMap: Record<string, string> = {
    slug: "slug",
    name: "name",
    kind: "kind",
    category: "category",
    description: "description",
    status: "status",
    pricingModel: "pricing_model",
    priceMinor: "price_minor",
    currency: "currency",
    featured: "featured",
    published: "published",
  };

  const assignments: string[] = [];
  const bindings: unknown[] = [];
  for (const [key, raw] of entries) {
    const column = columnMap[key];
    if (!column) continue;
    assignments.push(`${column} = ?`);
    bindings.push(typeof raw === "boolean" ? (raw ? 1 : 0) : raw);
  }
  assignments.push("updated_at = CURRENT_TIMESTAMP");
  bindings.push(id);

  await getDb()
    .prepare(`UPDATE products SET ${assignments.join(", ")} WHERE id = ?`)
    .bind(...bindings)
    .run();
  return getAdminProductById(id);
}

export async function deleteAdminProduct(id: string) {
  const result = await getDb().prepare("DELETE FROM products WHERE id = ?").bind(id).run();
  return Number(result.meta.changes ?? 0) > 0;
}

export async function writeAdminAudit(action: string, entityType: string, entityId?: string, metadata?: unknown) {
  try {
    await getDb()
      .prepare(
        `INSERT INTO audit_logs (id, actor_user_id, action, entity_type, entity_id, metadata_json, created_at)
         VALUES (?, NULL, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      )
      .bind(
        crypto.randomUUID(),
        action.slice(0, 100),
        entityType.slice(0, 80),
        entityId ?? null,
        metadata === undefined ? null : JSON.stringify(metadata).slice(0, 4000),
      )
      .run();
  } catch (error) {
    console.error("Failed to write admin audit log", error);
  }
}
