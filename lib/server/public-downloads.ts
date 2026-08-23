import { getSysOneEnv, requireBinding } from "@/lib/server/cloudflare";

export type PublicDownloadFile = {
  id: string;
  productSlug: string;
  productName: string;
  version: string;
  channel: string;
  platform: string;
  r2Key: string;
  sizeBytes: number | null;
  checksumSha256: string | null;
  createdAt: string;
};

type PublicDownloadRow = {
  id: string;
  product_slug: string;
  product_name: string;
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

function mapDownload(row: PublicDownloadRow): PublicDownloadFile {
  return {
    id: row.id,
    productSlug: row.product_slug,
    productName: row.product_name,
    version: row.version,
    channel: row.channel,
    platform: row.platform,
    r2Key: row.r2_key,
    sizeBytes: row.size_bytes,
    checksumSha256: row.checksum_sha256,
    createdAt: row.created_at,
  };
}

export async function listPublicDownloadsBySlug(
  slug: string,
): Promise<PublicDownloadFile[]> {
  const result = await getDb()
    .prepare(
      `SELECT
         pf.id,
         p.slug AS product_slug,
         p.name AS product_name,
         pv.version,
         pv.channel,
         pf.platform,
         pf.r2_key,
         pf.size_bytes,
         pf.checksum_sha256,
         pf.created_at
       FROM product_files pf
       JOIN product_versions pv ON pv.id = pf.product_version_id
       JOIN products p ON p.id = pv.product_id
       WHERE p.slug = ?
         AND p.published = 1
         AND p.pricing_model IN ('FREE', 'FREEMIUM')
         AND pv.published_at IS NOT NULL
       ORDER BY
         CASE UPPER(pv.channel)
           WHEN 'STABLE' THEN 0
           WHEN 'BETA' THEN 1
           WHEN 'ALPHA' THEN 2
           WHEN 'NIGHTLY' THEN 3
           ELSE 4
         END,
         pv.published_at DESC,
         pf.created_at DESC`,
    )
    .bind(slug.trim().toLowerCase())
    .all<PublicDownloadRow>();

  return (result.results ?? []).map(mapDownload);
}

export async function getPublicDownloadFileById(
  id: string,
): Promise<PublicDownloadFile | null> {
  const row = await getDb()
    .prepare(
      `SELECT
         pf.id,
         p.slug AS product_slug,
         p.name AS product_name,
         pv.version,
         pv.channel,
         pf.platform,
         pf.r2_key,
         pf.size_bytes,
         pf.checksum_sha256,
         pf.created_at
       FROM product_files pf
       JOIN product_versions pv ON pv.id = pf.product_version_id
       JOIN products p ON p.id = pv.product_id
       WHERE pf.id = ?
         AND p.published = 1
         AND p.pricing_model IN ('FREE', 'FREEMIUM')
         AND pv.published_at IS NOT NULL
       LIMIT 1`,
    )
    .bind(id.trim())
    .first<PublicDownloadRow>();

  return row ? mapDownload(row) : null;
}