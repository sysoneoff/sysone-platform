interface CloudflareEnv {
  ASSETS: Fetcher;
  SYSONE_DB?: D1Database;
  SYSONE_ASSETS?: R2Bucket;
  SYSONE_DOWNLOADS?: R2Bucket;
  SYSONE_CONFIG?: KVNamespace;
  SYSONE_ADMIN_SECRET?: string;
}
