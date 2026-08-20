import { getSysOneEnv, requireBinding } from "@/lib/server/cloudflare";

export type AdminReleaseFile = {
  id: string;
  productVersionId: string;
  platform: string;
  r2Key: string;
  sizeBytes: number | null;
  checksumSha256: string | null;
  createdAt: string;
};

export type AdminRelease = {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  productKind: string;
  version: string;
  channel: string;
  changelog: string | null;
  minSystem: string | null;
  publishedAt: string | null;
  files: AdminReleaseFile[];
};

export type ReleaseMutationInput = {
  productId?: string;
  version?: string;
  channel?: string;
  changelog?: string | null;
  minSystem?: string | null;
  published?: boolean;
};

type ReleaseRow = {
  id: string;
  product_id: string;
  product_name: string;
  product_slug: string;
  product_kind: string;
  version: string;
  channel: string;
  changelog: string | null;
  min_system: string | null;
  published_at: string | null;
};

type FileRow = {
  id: string;
  product_version_id: string;
  platform: string;
  r2_key: string;
  size_bytes: number | null;
  checksum_sha256: string | null;
  created_at: string;
};

function db() {
  return requireBinding(getSysOneEnv().SYSONE_DB, "SYSONE_DB");
}

function downloads() {
  return requireBinding(getSysOneEnv().SYSONE_DOWNLOADS, "SYSONE_DOWNLOADS");
}

function cleanText(value: unknown, max: number) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

function nullableText(value: unknown, max: number) {
  const text = cleanText(value, max);
  return text || null;
}

function mapFile(row: FileRow): AdminReleaseFile {
  return {
    id: row.id,
    productVersionId: row.product_version_id,
    platform: row.platform,
    r2Key: row.r2_key,
    sizeBytes: row.size_bytes,
    checksumSha256: row.checksum_sha256,
    createdAt: row.created_at,
  };
}

function mapRelease(row: ReleaseRow, releaseFiles: AdminReleaseFile[]): AdminRelease {
  return {
    id: row.id,
    productId: row.product_id,
    productName: row.product_name,
    productSlug: row.product_slug,
    productKind: row.product_kind,
    version: row.version,
    channel: row.channel,
    changelog: row.changelog,
    minSystem: row.min_system,
    publishedAt: row.published_at,
    files: releaseFiles,
  };
}

function normalizeRelease(input: ReleaseMutationInput, partial = false) {
  const value: ReleaseMutationInput = {};

  if (!partial || input.productId !== undefined) {
    const productId = cleanText(input.productId, 80);
    if (!productId) throw new Error("product_required");
    value.productId = productId;
  }

  if (!partial || input.version !== undefined) {
    const version = cleanText(input.version, 40);
    if (!/^[0-9A-Za-z][0-9A-Za-z._+-]{0,39}$/.test(version)) throw new Error("invalid_version");
    value.version = version;
  }

  if (!partial || input.channel !== undefined) {
    const channel = cleanText(input.channel, 20).toUpperCase() || "STABLE";
    if (!["STABLE", "BETA", "ALPHA", "NIGHTLY"].includes(channel)) throw new Error("invalid_channel");
    value.channel = channel;
  }

  if (!partial || input.changelog !== undefined) value.changelog = nullableText(input.changelog, 6000);
  if (!partial || input.minSystem !== undefined) value.minSystem = nullableText(input.minSystem, 1500);
  if (!partial || input.published !== undefined) value.published = Boolean(input.published);

  return value;
}

async function listFilesForReleaseIds(ids: string[]) {
  if (!ids.length) return new Map<string, AdminReleaseFile[]>();
  const placeholders = ids.map(() => "?").join(",");
  const result = await db()
    .prepare(
      `SELECT id, product_version_id, platform, r2_key, size_bytes, checksum_sha256, created_at
       FROM product_files WHERE product_version_id IN (${placeholders})
       ORDER BY created_at DESC`,
    )
    .bind(...ids)
    .all<FileRow>();

  const grouped = new Map<string, AdminReleaseFile[]>();
  for (const row of result.results ?? []) {
    const item = mapFile(row);
    const current = grouped.get(item.productVersionId) ?? [];
    current.push(item);
    grouped.set(item.productVersionId, current);
  }
  return grouped;
}

export async function listAdminReleases() {
  const result = await db()
    .prepare(
      `SELECT pv.id, pv.product_id, p.name AS product_name, p.slug AS product_slug, p.kind AS product_kind,
              pv.version, pv.channel, pv.changelog, pv.min_system, pv.published_at
       FROM product_versions pv
       JOIN products p ON p.id = pv.product_id
       ORDER BY COALESCE(pv.published_at, '0000-00-00') DESC, p.name ASC, pv.version DESC`,
    )
    .all<ReleaseRow>();

  const rows = (result.results ?? []) as ReleaseRow[];
  const grouped = await listFilesForReleaseIds(rows.map((row) => row.id));
  return rows.map((row) => mapRelease(row, grouped.get(row.id) ?? []));
}

export async function getAdminReleaseById(id: string) {
  const row = await db()
    .prepare(
      `SELECT pv.id, pv.product_id, p.name AS product_name, p.slug AS product_slug, p.kind AS product_kind,
              pv.version, pv.channel, pv.changelog, pv.min_system, pv.published_at
       FROM product_versions pv
       JOIN products p ON p.id = pv.product_id
       WHERE pv.id = ? LIMIT 1`,
    )
    .bind(id)
    .first<ReleaseRow>();
  if (!row) return null;
  const grouped = await listFilesForReleaseIds([id]);
  return mapRelease(row, grouped.get(id) ?? []);
}

export async function createAdminRelease(input: ReleaseMutationInput) {
  const value = normalizeRelease(input, false);
  const product = await db().prepare("SELECT id FROM products WHERE id = ? LIMIT 1").bind(value.productId).first<{ id: string }>();
  if (!product) throw new Error("product_not_found");

  const id = crypto.randomUUID();
  await db()
    .prepare(
      `INSERT INTO product_versions (id, product_id, version, channel, changelog, min_system, published_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      value.productId,
      value.version,
      value.channel,
      value.changelog,
      value.minSystem,
      value.published ? new Date().toISOString() : null,
    )
    .run();
  return getAdminReleaseById(id);
}

export async function updateAdminRelease(id: string, input: ReleaseMutationInput) {
  const current = await getAdminReleaseById(id);
  if (!current) return null;
  const value = normalizeRelease(input, true);
  const assignments: string[] = [];
  const bindings: unknown[] = [];

  if (value.productId !== undefined) {
    const product = await db().prepare("SELECT id FROM products WHERE id = ? LIMIT 1").bind(value.productId).first<{ id: string }>();
    if (!product) throw new Error("product_not_found");
    assignments.push("product_id = ?");
    bindings.push(value.productId);
  }
  if (value.version !== undefined) { assignments.push("version = ?"); bindings.push(value.version); }
  if (value.channel !== undefined) { assignments.push("channel = ?"); bindings.push(value.channel); }
  if (value.changelog !== undefined) { assignments.push("changelog = ?"); bindings.push(value.changelog); }
  if (value.minSystem !== undefined) { assignments.push("min_system = ?"); bindings.push(value.minSystem); }
  if (value.published !== undefined) {
    assignments.push("published_at = ?");
    bindings.push(value.published ? (current.publishedAt ?? new Date().toISOString()) : null);
  }

  if (!assignments.length) return current;
  bindings.push(id);
  await db().prepare(`UPDATE product_versions SET ${assignments.join(", ")} WHERE id = ?`).bind(...bindings).run();
  return getAdminReleaseById(id);
}

export async function deleteAdminRelease(id: string) {
  const release = await getAdminReleaseById(id);
  if (!release) return false;

  for (const file of release.files) {
    try {
      await downloads().delete(file.r2Key);
    } catch (error) {
      console.error("Failed to delete release object", file.r2Key, error);
      throw new Error("release_file_delete_failed");
    }
  }

  await db().prepare("DELETE FROM product_versions WHERE id = ?").bind(id).run();
  return true;
}

export async function addAdminReleaseFile(input: {
  releaseId: string;
  platform: string;
  key: string;
  sizeBytes: number;
  checksumSha256: string;
}) {
  const id = crypto.randomUUID();
  await db()
    .prepare(
      `INSERT INTO product_files (id, product_version_id, platform, r2_key, size_bytes, checksum_sha256, created_at)
       VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    )
    .bind(id, input.releaseId, input.platform, input.key, input.sizeBytes, input.checksumSha256)
    .run();
  return getAdminReleaseFileById(id);
}

export async function getAdminReleaseFileById(id: string) {
  const row = await db()
    .prepare(
      `SELECT id, product_version_id, platform, r2_key, size_bytes, checksum_sha256, created_at
       FROM product_files WHERE id = ? LIMIT 1`,
    )
    .bind(id)
    .first<FileRow>();
  return row ? mapFile(row) : null;
}

export async function deleteAdminReleaseFile(id: string) {
  const file = await getAdminReleaseFileById(id);
  if (!file) return false;
  await downloads().delete(file.r2Key);
  await db().prepare("DELETE FROM product_files WHERE id = ?").bind(id).run();
  return true;
}
