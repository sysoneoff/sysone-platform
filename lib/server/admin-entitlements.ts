import { getSysOneEnv, requireBinding } from "@/lib/server/cloudflare";

export type AdminEntitlement = {
  id: string;
  userId: string;
  userEmail: string | null;
  userName: string;
  productId: string;
  productSlug: string;
  productName: string;
  orderId: string | null;
  status: string;
  startsAt: string;
  endsAt: string | null;
};

type EntitlementRow = {
  id: string;
  user_id: string;
  user_email: string | null;
  user_name: string;
  product_id: string;
  product_slug: string;
  product_name: string;
  order_id: string | null;
  status: string;
  starts_at: string;
  ends_at: string | null;
};

function getDb() {
  return requireBinding(getSysOneEnv().SYSONE_DB, "SYSONE_DB");
}

function mapEntitlement(row: EntitlementRow): AdminEntitlement {
  return {
    id: row.id,
    userId: row.user_id,
    userEmail: row.user_email,
    userName: row.user_name,
    productId: row.product_id,
    productSlug: row.product_slug,
    productName: row.product_name,
    orderId: row.order_id,
    status: row.status,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
  };
}

const ENTITLEMENT_SELECT = `
  SELECT
    e.id,
    e.user_id,
    u.email AS user_email,
    u.name AS user_name,
    e.product_id,
    p.slug AS product_slug,
    p.name AS product_name,
    e.order_id,
    e.status,
    e.starts_at,
    e.ends_at
  FROM entitlements e
  JOIN users u ON u.id = e.user_id
  JOIN products p ON p.id = e.product_id
`;

export async function listAdminEntitlements(): Promise<AdminEntitlement[]> {
  const result = await getDb()
    .prepare(`${ENTITLEMENT_SELECT} ORDER BY e.starts_at DESC, e.id DESC`)
    .all<EntitlementRow>();

  return (result.results ?? []).map(mapEntitlement);
}

export async function getAdminEntitlementById(id: string): Promise<AdminEntitlement | null> {
  const row = await getDb()
    .prepare(`${ENTITLEMENT_SELECT} WHERE e.id = ? LIMIT 1`)
    .bind(id)
    .first<EntitlementRow>();

  return row ? mapEntitlement(row) : null;
}


export type EntitlementMutationInput = {
  userId?: string;
  productId?: string;
  orderId?: string | null;
  status?: string;
  endsAt?: string | null;
};

function cleanEntitlementId(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, 160);
}

function normalizeEntitlementStatus(value: unknown) {
  if (value === undefined) return "ACTIVE";
  if (typeof value !== "string") throw new Error("invalid_status");

  const normalized = value.trim().toUpperCase().slice(0, 32);

  if (
    !normalized ||
    !["ACTIVE", "SUSPENDED", "EXPIRED", "REVOKED"].includes(normalized)
  ) {
    throw new Error("invalid_status");
  }

  return normalized;
}

function normalizeEntitlementEndsAt(value: unknown) {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") throw new Error("invalid_ends_at");

  const text = value.trim().slice(0, 64);
  const parsed = Date.parse(text);
  if (!text || Number.isNaN(parsed)) throw new Error("invalid_ends_at");

  return new Date(parsed).toISOString().replace("T", " ").replace(/\.\d{3}Z$/, "");
}

async function validateEntitlementReferences(
  userId: string,
  productId: string,
  orderId: string | null,
) {
  const db = getDb();

  const user = await db
    .prepare("SELECT id FROM users WHERE id = ? LIMIT 1")
    .bind(userId)
    .first<{ id: string }>();

  if (!user) throw new Error("user_not_found");

  const product = await db
    .prepare("SELECT id FROM products WHERE id = ? LIMIT 1")
    .bind(productId)
    .first<{ id: string }>();

  if (!product) throw new Error("product_not_found");

  if (!orderId) return;

  const order = await db
    .prepare(
      `SELECT o.id
       FROM orders o
       JOIN order_items oi ON oi.order_id = o.id
       WHERE o.id = ? AND o.user_id = ? AND oi.product_id = ?
       LIMIT 1`,
    )
    .bind(orderId, userId, productId)
    .first<{ id: string }>();

  if (!order) throw new Error("invalid_order");
}

export async function createAdminEntitlement(input: EntitlementMutationInput) {
  const userId = cleanEntitlementId(input.userId);
  const productId = cleanEntitlementId(input.productId);
  const orderId =
    input.orderId === null ? null : cleanEntitlementId(input.orderId) || null;
  const status = normalizeEntitlementStatus(input.status);
  const endsAt = normalizeEntitlementEndsAt(input.endsAt);

  if (!userId) throw new Error("user_id_required");
  if (!productId) throw new Error("product_id_required");

  await validateEntitlementReferences(userId, productId, orderId);

  const nowRow = await getDb()
    .prepare("SELECT CURRENT_TIMESTAMP AS now")
    .first<{ now: string }>();

  if (!nowRow?.now) throw new Error("database_time_unavailable");

  const startsAt = nowRow.now;

  if (endsAt) {
    const startsAtMs = Date.parse(startsAt.replace(" ", "T") + "Z");
    const endsAtMs = Date.parse(endsAt.replace(" ", "T") + "Z");

    if (
      Number.isNaN(startsAtMs) ||
      Number.isNaN(endsAtMs) ||
      endsAtMs <= startsAtMs
    ) {
      throw new Error("invalid_ends_at");
    }
  }

  const id = crypto.randomUUID();

  await getDb()
    .prepare(
      `INSERT INTO entitlements
       (id, user_id, product_id, order_id, status, starts_at, ends_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(id, userId, productId, orderId, status, startsAt, endsAt)
    .run();

  return getAdminEntitlementById(id);
}

export type EntitlementUpdateInput = {
  status?: string;
  endsAt?: string | null;
};

export async function updateAdminEntitlement(
  id: string,
  input: EntitlementUpdateInput,
): Promise<AdminEntitlement | null> {
  const entitlementId = cleanEntitlementId(id);

  if (!entitlementId) throw new Error("entitlement_id_required");

  const existing = await getAdminEntitlementById(entitlementId);
  if (!existing) return null;

  const hasStatus = Object.prototype.hasOwnProperty.call(input, "status");
  const hasEndsAt = Object.prototype.hasOwnProperty.call(input, "endsAt");

  if (!hasStatus && !hasEndsAt) {
    throw new Error("no_updates");
  }

  const status = hasStatus
    ? normalizeEntitlementStatus(input.status)
    : existing.status;

  const endsAt = hasEndsAt
    ? normalizeEntitlementEndsAt(input.endsAt)
    : existing.endsAt;

  if (endsAt) {
    const startsAtMs = Date.parse(
      existing.startsAt.replace(" ", "T") + "Z",
    );
    const endsAtMs = Date.parse(
      endsAt.replace(" ", "T") + "Z",
    );

    if (
      Number.isNaN(startsAtMs) ||
      Number.isNaN(endsAtMs) ||
      endsAtMs <= startsAtMs
    ) {
      throw new Error("invalid_ends_at");
    }
  }

  await getDb()
    .prepare(
      `UPDATE entitlements
       SET status = ?, ends_at = ?
       WHERE id = ?`,
    )
    .bind(status, endsAt, entitlementId)
    .run();

  return getAdminEntitlementById(entitlementId);
}
