import { getSysOneEnv, requireBinding } from "@/lib/server/cloudflare";

export type PrivateDownloadFile = {
  id: string;
  productId: string;
  productSlug: string;
  productName: string;
  pricingModel: string;
  version: string;
  channel: string;
  platform: string;
  r2Key: string;
  sizeBytes: number | null;
  checksumSha256: string | null;
  createdAt: string;
};

type PrivateDownloadRow = {
  id: string;
  product_id: string;
  product_slug: string;
  product_name: string;
  pricing_model: string;
  version: string;
  channel: string;
  platform: string;
  r2_key: string;
  size_bytes: number | null;
  checksum_sha256: string | null;
  created_at: string;
};

function getDb() {
  return requireBinding(getSysOneEnv().SYSONE_DB, "SYSONE_DB");
}

function mapDownload(row: PrivateDownloadRow): PrivateDownloadFile {
  return {
    id: row.id,
    productId: row.product_id,
    productSlug: row.product_slug,
    productName: row.product_name,
    pricingModel: row.pricing_model,
    version: row.version,
    channel: row.channel,
    platform: row.platform,
    r2Key: row.r2_key,
    sizeBytes: row.size_bytes,
    checksumSha256: row.checksum_sha256,
    createdAt: row.created_at,
  };
}

export async function getPrivateDownloadFileForUser(
  userId: string,
  fileId: string,
): Promise<PrivateDownloadFile | null> {
  const cleanUserId = userId.trim();
  const cleanFileId = fileId.trim();

  if (!cleanUserId || !cleanFileId) return null;

  const row = await getDb()
    .prepare(`
      SELECT
        pf.id,
        p.id AS product_id,
        p.slug AS product_slug,
        p.name AS product_name,
        p.pricing_model,
        pv.version,
        pv.channel,
        pf.platform,
        pf.r2_key,
        pf.size_bytes,
        pf.checksum_sha256,
        pf.created_at
      FROM product_files pf
      INNER JOIN product_versions pv
        ON pv.id = pf.product_version_id
      INNER JOIN products p
        ON p.id = pv.product_id
      WHERE
        pf.id = ?
        AND p.published = 1
        AND pv.published_at IS NOT NULL
        AND EXISTS (
          SELECT 1
          FROM entitlements e
          WHERE
            e.product_id = p.id
            AND e.user_id = ?
            AND e.status = 'ACTIVE'
            AND datetime(e.starts_at) <= datetime('now')
            AND (
              e.ends_at IS NULL
              OR datetime(e.ends_at) > datetime('now')
            )
        )
      LIMIT 1
    `)
    .bind(cleanFileId, cleanUserId)
    .first<PrivateDownloadRow>();

  return row ? mapDownload(row) : null;
}

export async function listPrivateDownloadsForUser(
  userId: string,
  productSlug: string,
): Promise<PrivateDownloadFile[]> {
  const cleanUserId = userId.trim();
  const cleanSlug = productSlug.trim().toLowerCase();

  if (!cleanUserId || !cleanSlug) return [];

  const result = await getDb()
    .prepare(`
      SELECT
        pf.id,
        p.id AS product_id,
        p.slug AS product_slug,
        p.name AS product_name,
        p.pricing_model,
        pv.version,
        pv.channel,
        pf.platform,
        pf.r2_key,
        pf.size_bytes,
        pf.checksum_sha256,
        pf.created_at
      FROM product_files pf
      INNER JOIN product_versions pv
        ON pv.id = pf.product_version_id
      INNER JOIN products p
        ON p.id = pv.product_id
      WHERE
        p.slug = ?
        AND p.published = 1
        AND pv.published_at IS NOT NULL
        AND EXISTS (
          SELECT 1
          FROM entitlements e
          WHERE
            e.product_id = p.id
            AND e.user_id = ?
            AND e.status = 'ACTIVE'
            AND datetime(e.starts_at) <= datetime('now')
            AND (
              e.ends_at IS NULL
              OR datetime(e.ends_at) > datetime('now')
            )
        )
      ORDER BY
        CASE UPPER(pv.channel)
          WHEN 'STABLE' THEN 0
          WHEN 'BETA' THEN 1
          WHEN 'ALPHA' THEN 2
          WHEN 'NIGHTLY' THEN 3
          ELSE 4
        END,
        pv.published_at DESC,
        pf.created_at DESC
    `)
    .bind(cleanSlug, cleanUserId)
    .all<PrivateDownloadRow>();

  return (result.results ?? []).map(mapDownload);
}