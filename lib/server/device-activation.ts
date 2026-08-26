import { hashLicenseKey } from "@/lib/server/admin-licenses";
import { getSysOneEnv, requireBinding } from "@/lib/server/cloudflare";

type ActivationLicenseRow = {
  id: string;
  entitlement_id: string;
  product_id: string;
  device_limit: number;
  license_status: string;
  license_expires_at: string | null;
  entitlement_status: string;
  entitlement_starts_at: string;
  entitlement_ends_at: string | null;
};

type LicenseDeviceRow = {
  id: string;
  license_id: string;
  device_hash: string;
  label: string | null;
  activated_at: string;
  last_seen_at: string | null;
};

export type DeviceActivationInput = {
  licenseKey?: string;
  deviceId?: string;
  label?: string | null;
};

export type DeviceActivationResult = {
  device: {
    id: string;
    label: string | null;
    activatedAt: string;
    lastSeenAt: string | null;
  };
  license: {
    id: string;
    entitlementId: string;
    productId: string;
    deviceLimit: number;
    expiresAt: string | null;
  };
  activeDevices: number;
  reused: boolean;
};

function getDb() {
  return requireBinding(getSysOneEnv().SYSONE_DB, "SYSONE_DB");
}

function normalizeLicenseKey(value: unknown) {
  if (typeof value !== "string") {
    throw new Error("license_key_required");
  }

  const normalized = value.trim();

  if (
    !normalized ||
    normalized.length > 256 ||
    !normalized.startsWith("SYSONE-")
  ) {
    throw new Error("invalid_license_key");
  }

  return normalized;
}

function normalizeDeviceId(value: unknown) {
  if (typeof value !== "string") {
    throw new Error("device_id_required");
  }

  const normalized = value.trim();

  if (!normalized || normalized.length > 1024) {
    throw new Error("invalid_device_id");
  }

  return normalized;
}

function normalizeLabel(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (typeof value !== "string") {
    throw new Error("invalid_device_label");
  }

  const normalized = value.trim().replace(/\s+/g, " ").slice(0, 120);

  return normalized || null;
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function hashDeviceId(deviceId: string) {
  return sha256(`sysone-device-v1:${deviceId}`);
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

async function getLicenseByHash(
  licenseHash: string,
): Promise<ActivationLicenseRow | null> {
  return getDb()
    .prepare(
      `SELECT
         l.id,
         l.entitlement_id,
         e.product_id,
         l.device_limit,
         l.status AS license_status,
         l.expires_at AS license_expires_at,
         e.status AS entitlement_status,
         e.starts_at AS entitlement_starts_at,
         e.ends_at AS entitlement_ends_at
       FROM licenses l
       JOIN entitlements e ON e.id = l.entitlement_id
       WHERE l.license_hash = ?
       LIMIT 1`,
    )
    .bind(licenseHash)
    .first<ActivationLicenseRow>();
}

function assertActivationAllowed(
  license: ActivationLicenseRow,
  databaseNow: string,
) {
  if (license.license_status !== "ACTIVE") {
    throw new Error("license_not_active");
  }

  const nowMs = databaseDateToMs(databaseNow);

  if (nowMs === null) {
    throw new Error("database_time_unavailable");
  }

  if (license.license_expires_at) {
    const licenseExpiresAtMs = databaseDateToMs(
      license.license_expires_at,
    );

    if (licenseExpiresAtMs === null) {
      throw new Error("invalid_license_dates");
    }

    if (licenseExpiresAtMs <= nowMs) {
      throw new Error("license_expired");
    }
  }

  if (license.entitlement_status !== "ACTIVE") {
    throw new Error("entitlement_not_active");
  }

  const startsAtMs = databaseDateToMs(
    license.entitlement_starts_at,
  );

  if (startsAtMs === null) {
    throw new Error("invalid_entitlement_dates");
  }

  if (startsAtMs > nowMs) {
    throw new Error("entitlement_not_started");
  }

  if (license.entitlement_ends_at) {
    const endsAtMs = databaseDateToMs(
      license.entitlement_ends_at,
    );

    if (endsAtMs === null) {
      throw new Error("invalid_entitlement_dates");
    }

    if (endsAtMs <= nowMs) {
      throw new Error("entitlement_expired");
    }
  }
}

async function getExistingDevice(
  licenseId: string,
  deviceHash: string,
): Promise<LicenseDeviceRow | null> {
  return getDb()
    .prepare(
      `SELECT
         id,
         license_id,
         device_hash,
         label,
         activated_at,
         last_seen_at
       FROM license_devices
       WHERE license_id = ?
         AND device_hash = ?
       LIMIT 1`,
    )
    .bind(licenseId, deviceHash)
    .first<LicenseDeviceRow>();
}

async function updateExistingDevice(
  device: LicenseDeviceRow,
  label: string | null,
  databaseNow: string,
) {
  await getDb()
    .prepare(
      `UPDATE license_devices
       SET
         label = COALESCE(?, label),
         last_seen_at = ?
       WHERE id = ?`,
    )
    .bind(label, databaseNow, device.id)
    .run();

  const updated = await getDb()
    .prepare(
      `SELECT
         id,
         license_id,
         device_hash,
         label,
         activated_at,
         last_seen_at
       FROM license_devices
       WHERE id = ?
       LIMIT 1`,
    )
    .bind(device.id)
    .first<LicenseDeviceRow>();

  if (!updated) {
    throw new Error("device_refresh_failed");
  }

  return updated;
}

async function countDevices(licenseId: string) {
  const row = await getDb()
    .prepare(
      `SELECT COUNT(*) AS count
       FROM license_devices
       WHERE license_id = ?`,
    )
    .bind(licenseId)
    .first<{ count: number }>();

  return Number(row?.count ?? 0);
}

function buildResult(
  license: ActivationLicenseRow,
  device: LicenseDeviceRow,
  activeDevices: number,
  reused: boolean,
): DeviceActivationResult {
  return {
    device: {
      id: device.id,
      label: device.label,
      activatedAt: device.activated_at,
      lastSeenAt: device.last_seen_at,
    },
    license: {
      id: license.id,
      entitlementId: license.entitlement_id,
      productId: license.product_id,
      deviceLimit: license.device_limit,
      expiresAt: license.license_expires_at,
    },
    activeDevices,
    reused,
  };
}

export async function activateDevice(
  input: DeviceActivationInput,
): Promise<DeviceActivationResult> {
  const licenseKey = normalizeLicenseKey(input.licenseKey);
  const deviceId = normalizeDeviceId(input.deviceId);
  const label = normalizeLabel(input.label);

  const licenseHash = await hashLicenseKey(licenseKey);
  const deviceHash = await hashDeviceId(deviceId);

  const license = await getLicenseByHash(licenseHash);

  if (!license) {
    throw new Error("license_not_found");
  }

  const databaseNow = await getDatabaseNow();

  assertActivationAllowed(license, databaseNow);

  const existing = await getExistingDevice(
    license.id,
    deviceHash,
  );

  if (existing) {
    const refreshed = await updateExistingDevice(
      existing,
      label,
      databaseNow,
    );

    return buildResult(
      license,
      refreshed,
      await countDevices(license.id),
      true,
    );
  }

  const deviceRecordId = crypto.randomUUID();

  await getDb()
    .prepare(
      `INSERT OR IGNORE INTO license_devices
       (
         id,
         license_id,
         device_hash,
         label,
         activated_at,
         last_seen_at
       )
       SELECT
         ?,
         ?,
         ?,
         ?,
         ?,
         ?
       WHERE
         (
           SELECT COUNT(*)
           FROM license_devices
           WHERE license_id = ?
         ) < ?`,
    )
    .bind(
      deviceRecordId,
      license.id,
      deviceHash,
      label,
      databaseNow,
      databaseNow,
      license.id,
      license.device_limit,
    )
    .run();

  const activated = await getExistingDevice(
    license.id,
    deviceHash,
  );

  if (!activated) {
    throw new Error("device_limit_reached");
  }

  const reused = activated.id !== deviceRecordId;

  if (reused) {
    const refreshed = await updateExistingDevice(
      activated,
      label,
      databaseNow,
    );

    return buildResult(
      license,
      refreshed,
      await countDevices(license.id),
      true,
    );
  }

  return buildResult(
    license,
    activated,
    await countDevices(license.id),
    false,
  );
}