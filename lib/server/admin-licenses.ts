import { getSysOneEnv, requireBinding } from "@/lib/server/cloudflare";

export type AdminLicense = {
  id: string;
  entitlementId: string;
  userId: string;
  userEmail: string | null;
  userName: string;
  productId: string;
  productSlug: string;
  productName: string;
  deviceLimit: number;
  status: string;
  expiresAt: string | null;
  createdAt: string;
};

type LicenseRow = {
  id: string;
  entitlement_id: string;
  user_id: string;
  user_email: string | null;
  user_name: string;
  product_id: string;
  product_slug: string;
  product_name: string;
  device_limit: number;
  status: string;
  expires_at: string | null;
  created_at: string;
};

type EntitlementRow = {
  id: string;
  status: string;
  starts_at: string;
  ends_at: string | null;
};

export type LicenseCreateInput = {
  entitlementId?: string;
  deviceLimit?: number;
  status?: string;
  expiresAt?: string | null;
};

export type LicenseUpdateInput = {
  deviceLimit?: number;
  status?: string;
  expiresAt?: string | null;
};

function getDb() {
  return requireBinding(getSysOneEnv().SYSONE_DB, "SYSONE_DB");
}

function mapLicense(row: LicenseRow): AdminLicense {
  return {
    id: row.id,
    entitlementId: row.entitlement_id,
    userId: row.user_id,
    userEmail: row.user_email,
    userName: row.user_name,
    productId: row.product_id,
    productSlug: row.product_slug,
    productName: row.product_name,
    deviceLimit: row.device_limit,
    status: row.status,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  };
}

const LICENSE_SELECT = `
  SELECT
    l.id,
    l.entitlement_id,
    e.user_id,
    u.email AS user_email,
    u.name AS user_name,
    e.product_id,
    p.slug AS product_slug,
    p.name AS product_name,
    l.device_limit,
    l.status,
    l.expires_at,
    l.created_at
  FROM licenses l
  JOIN entitlements e ON e.id = l.entitlement_id
  JOIN users u ON u.id = e.user_id
  JOIN products p ON p.id = e.product_id
`;

function cleanId(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, 160);
}

function normalizeLicenseStatus(value: unknown) {
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

function normalizeDeviceLimit(value: unknown) {
  if (value === undefined) return 1;

  if (
    typeof value !== "number" ||
    !Number.isSafeInteger(value) ||
    value < 1
  ) {
    throw new Error("invalid_device_limit");
  }

  return value;
}

function normalizeExpiresAt(value: unknown) {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") throw new Error("invalid_expires_at");

  const text = value.trim().slice(0, 64);
  const parsed = Date.parse(text);

  if (!text || Number.isNaN(parsed)) {
    throw new Error("invalid_expires_at");
  }

  return new Date(parsed)
    .toISOString()
    .replace("T", " ")
    .replace(/\.\d{3}Z$/, "");
}

function databaseDateToMs(value: string | null) {
  if (!value) return null;

  const parsed = Date.parse(
    value.includes("T") ? value : `${value.replace(" ", "T")}Z`,
  );

  return Number.isNaN(parsed) ? null : parsed;
}

async function getDatabaseNow() {
  const row = await getDb()
    .prepare("SELECT CURRENT_TIMESTAMP AS now")
    .first<{ now: string }>();

  if (!row?.now) {
    throw new Error("database_time_unavailable");
  }

  return row.now;
}

async function getEntitlementRecord(
  entitlementId: string,
): Promise<EntitlementRow | null> {
  return getDb()
    .prepare(
      `SELECT
         id,
         status,
         starts_at,
         ends_at
       FROM entitlements
       WHERE id = ?
       LIMIT 1`,
    )
    .bind(entitlementId)
    .first<EntitlementRow>();
}

function assertEntitlementUsable(
  entitlement: EntitlementRow,
  databaseNow: string,
) {
  if (entitlement.status !== "ACTIVE") {
    throw new Error("entitlement_not_active");
  }

  const nowMs = databaseDateToMs(databaseNow);
  const startsAtMs = databaseDateToMs(entitlement.starts_at);
  const endsAtMs = databaseDateToMs(entitlement.ends_at);

  if (nowMs === null || startsAtMs === null) {
    throw new Error("invalid_entitlement_dates");
  }

  if (startsAtMs > nowMs) {
    throw new Error("entitlement_not_started");
  }

  if (endsAtMs !== null && endsAtMs <= nowMs) {
    throw new Error("entitlement_expired");
  }
}

function validateLicenseExpiry(
  expiresAt: string | null,
  entitlementEndsAt: string | null,
  databaseNow: string,
) {
  if (!expiresAt) return;

  const expiresAtMs = databaseDateToMs(expiresAt);
  const nowMs = databaseDateToMs(databaseNow);

  if (
    expiresAtMs === null ||
    nowMs === null ||
    expiresAtMs <= nowMs
  ) {
    throw new Error("invalid_expires_at");
  }

  if (entitlementEndsAt) {
    const entitlementEndsAtMs = databaseDateToMs(entitlementEndsAt);

    if (
      entitlementEndsAtMs === null ||
      expiresAtMs > entitlementEndsAtMs
    ) {
      throw new Error("invalid_expires_at");
    }
  }
}

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function createRawLicenseKey() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);

  return `SYSONE-${bytesToBase64Url(bytes)}`;
}

export async function hashLicenseKey(value: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function listAdminLicenses(): Promise<AdminLicense[]> {
  const result = await getDb()
    .prepare(
      `${LICENSE_SELECT}
       ORDER BY l.created_at DESC, l.id DESC`,
    )
    .all<LicenseRow>();

  return (result.results ?? []).map(mapLicense);
}

export async function getAdminLicenseById(
  id: string,
): Promise<AdminLicense | null> {
  const licenseId = cleanId(id);

  if (!licenseId) return null;

  const row = await getDb()
    .prepare(
      `${LICENSE_SELECT}
       WHERE l.id = ?
       LIMIT 1`,
    )
    .bind(licenseId)
    .first<LicenseRow>();

  return row ? mapLicense(row) : null;
}

export async function createAdminLicense(
  input: LicenseCreateInput,
): Promise<{
  license: AdminLicense;
  licenseKey: string;
}> {
  const entitlementId = cleanId(input.entitlementId);
  const deviceLimit = normalizeDeviceLimit(input.deviceLimit);
  const status = normalizeLicenseStatus(input.status);
  const expiresAt = normalizeExpiresAt(input.expiresAt);

  if (!entitlementId) {
    throw new Error("entitlement_id_required");
  }

  const entitlement = await getEntitlementRecord(entitlementId);

  if (!entitlement) {
    throw new Error("entitlement_not_found");
  }

  const databaseNow = await getDatabaseNow();

  assertEntitlementUsable(entitlement, databaseNow);

  validateLicenseExpiry(
    expiresAt,
    entitlement.ends_at,
    databaseNow,
  );

  const id = crypto.randomUUID();
  const licenseKey = createRawLicenseKey();
  const licenseHash = await hashLicenseKey(licenseKey);

  await getDb()
    .prepare(
      `INSERT INTO licenses
       (
         id,
         entitlement_id,
         license_hash,
         device_limit,
         status,
         expires_at,
         created_at
       )
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      entitlementId,
      licenseHash,
      deviceLimit,
      status,
      expiresAt,
      databaseNow,
    )
    .run();

  const license = await getAdminLicenseById(id);

  if (!license) {
    throw new Error("license_create_failed");
  }

  return {
    license,
    licenseKey,
  };
}

export async function updateAdminLicense(
  id: string,
  input: LicenseUpdateInput,
): Promise<AdminLicense | null> {
  const licenseId = cleanId(id);

  if (!licenseId) {
    throw new Error("license_id_required");
  }

  const existing = await getAdminLicenseById(licenseId);

  if (!existing) {
    return null;
  }

  const hasDeviceLimit = Object.prototype.hasOwnProperty.call(
    input,
    "deviceLimit",
  );
  const hasStatus = Object.prototype.hasOwnProperty.call(
    input,
    "status",
  );
  const hasExpiresAt = Object.prototype.hasOwnProperty.call(
    input,
    "expiresAt",
  );

  if (!hasDeviceLimit && !hasStatus && !hasExpiresAt) {
    throw new Error("no_updates");
  }

  const deviceLimit = hasDeviceLimit
    ? normalizeDeviceLimit(input.deviceLimit)
    : existing.deviceLimit;

  const status = hasStatus
    ? normalizeLicenseStatus(input.status)
    : existing.status;

  const expiresAt = hasExpiresAt
    ? normalizeExpiresAt(input.expiresAt)
    : existing.expiresAt;

  const entitlement = await getEntitlementRecord(
    existing.entitlementId,
  );

  if (!entitlement) {
    throw new Error("entitlement_not_found");
  }

  const databaseNow = await getDatabaseNow();

if (status === "ACTIVE") {
  assertEntitlementUsable(entitlement, databaseNow);
}

if (status === "ACTIVE" || hasExpiresAt) {
  validateLicenseExpiry(
    expiresAt,
    entitlement.ends_at,
    databaseNow,
  );
}

  await getDb()
    .prepare(
      `UPDATE licenses
       SET
         device_limit = ?,
         status = ?,
         expires_at = ?
       WHERE id = ?`,
    )
    .bind(
      deviceLimit,
      status,
      expiresAt,
      licenseId,
    )
    .run();

  return getAdminLicenseById(licenseId);
}