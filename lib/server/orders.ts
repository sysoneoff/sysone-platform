import { getSysOneEnv, requireBinding } from "@/lib/server/cloudflare";
import { getPublishedProductBySlug } from "@/lib/server/products";

export type PendingOrder = {
  id: string;
  userId: string;
  status: "PENDING";
  subtotalMinor: number;
  discountMinor: number;
  totalMinor: number;
  currency: string;
  createdAt: string;
  product: {
    id: string;
    slug: string;
    name: string;
    unitPriceMinor: number;
  };
};

type PendingOrderRow = {
  id: string;
  user_id: string;
  subtotal_minor: number;
  discount_minor: number;
  total_minor: number;
  currency: string;
  created_at: string;
};

function getDb() {
  return requireBinding(getSysOneEnv().SYSONE_DB, "SYSONE_DB");
}

function normalizeSlug(value: string) {
  return value.trim().toLowerCase();
}

function normalizeCurrency(value: string) {
  return value.trim().toUpperCase();
}

export async function createPendingOneTimeOrder(
  userId: string,
  productSlug: string,
): Promise<{ order: PendingOrder; reused: boolean }> {
  const cleanUserId = userId.trim();
  const cleanSlug = normalizeSlug(productSlug);

  if (!cleanUserId) {
    throw new Error("authentication_required");
  }

  if (!cleanSlug || cleanSlug.length > 160) {
    throw new Error("invalid_product_slug");
  }

  const product = await getPublishedProductBySlug(cleanSlug);

  if (!product) {
    throw new Error("product_not_found");
  }

  if (product.pricingModel.trim().toUpperCase() !== "ONE_TIME") {
    throw new Error("unsupported_pricing_model");
  }

  const basePriceMinor = Number(product.priceMinor);
  const totalMinor = Number(product.currentPriceMinor);

  if (
    !Number.isSafeInteger(basePriceMinor) ||
    !Number.isSafeInteger(totalMinor) ||
    basePriceMinor <= 0 ||
    totalMinor <= 0 ||
    totalMinor > basePriceMinor
  ) {
    throw new Error("invalid_product_price");
  }

  const currency = normalizeCurrency(product.currency);

  if (!/^[A-Z]{3}$/.test(currency)) {
    throw new Error("invalid_product_currency");
  }

  const subtotalMinor = basePriceMinor;
  const discountMinor = subtotalMinor - totalMinor;
  const db = getDb();

  const activeEntitlement = await db
    .prepare(
      `SELECT id
       FROM entitlements
       WHERE user_id = ?
         AND product_id = ?
         AND status = 'ACTIVE'
         AND datetime(starts_at) <= datetime('now')
         AND (ends_at IS NULL OR datetime(ends_at) > datetime('now'))
       LIMIT 1`,
    )
    .bind(cleanUserId, product.id)
    .first<{ id: string }>();

  if (activeEntitlement) {
    throw new Error("product_already_owned");
  }

  const existing = await db
    .prepare(
      `SELECT
         o.id,
         o.user_id,
         o.subtotal_minor,
         o.discount_minor,
         o.total_minor,
         o.currency,
         o.created_at
       FROM orders o
       INNER JOIN order_items oi ON oi.order_id = o.id
       WHERE o.user_id = ?
         AND o.status = 'PENDING'
         AND oi.product_id = ?
         AND oi.quantity = 1
         AND oi.unit_price_minor = ?
         AND o.subtotal_minor = ?
         AND o.discount_minor = ?
         AND o.total_minor = ?
         AND o.currency = ?
       ORDER BY datetime(o.created_at) DESC
       LIMIT 1`,
    )
    .bind(
      cleanUserId,
      product.id,
      basePriceMinor,
      subtotalMinor,
      discountMinor,
      totalMinor,
      currency,
    )
    .first<PendingOrderRow>();

  if (existing) {
    return {
      reused: true,
      order: {
        id: existing.id,
        userId: existing.user_id,
        status: "PENDING",
        subtotalMinor: Number(existing.subtotal_minor),
        discountMinor: Number(existing.discount_minor),
        totalMinor: Number(existing.total_minor),
        currency: existing.currency,
        createdAt: existing.created_at,
        product: {
          id: product.id,
          slug: product.slug,
          name: product.name,
          unitPriceMinor: basePriceMinor,
        },
      },
    };
  }

  const orderId = crypto.randomUUID();
  const orderItemId = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  await db.batch([
    db
      .prepare(
        `INSERT INTO orders (
           id,
           user_id,
           status,
           subtotal_minor,
           discount_minor,
           total_minor,
           currency,
           payment_provider,
           payment_reference,
           created_at,
           paid_at
         )
         VALUES (?, ?, 'PENDING', ?, ?, ?, ?, NULL, NULL, ?, NULL)`,
      )
      .bind(
        orderId,
        cleanUserId,
        subtotalMinor,
        discountMinor,
        totalMinor,
        currency,
        createdAt,
      ),
    db
      .prepare(
        `INSERT INTO order_items (
           id,
           order_id,
           product_id,
           quantity,
           unit_price_minor
         )
         VALUES (?, ?, ?, 1, ?)`,
      )
      .bind(orderItemId, orderId, product.id, basePriceMinor),
  ]);

  return {
    reused: false,
    order: {
      id: orderId,
      userId: cleanUserId,
      status: "PENDING",
      subtotalMinor,
      discountMinor,
      totalMinor,
      currency,
      createdAt,
      product: {
        id: product.id,
        slug: product.slug,
        name: product.name,
        unitPriceMinor: basePriceMinor,
      },
    },
  };
}
