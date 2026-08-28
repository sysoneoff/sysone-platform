interface RateLimit {
  limit(input: { key: string }): Promise<{ success: boolean }>;
}

interface CloudflareEnv {
  ASSETS: Fetcher;

  SYSONE_DB?: D1Database;
  SYSONE_ASSETS?: R2Bucket;
  SYSONE_DOWNLOADS?: R2Bucket;
  SYSONE_CONFIG?: KVNamespace;

  SYSONE_ADMIN_SECRET?: string;

  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;

  TELEGRAM_CLIENT_ID?: string;
  TELEGRAM_CLIENT_SECRET?: string;

  SYSONE_ACTIVATION_IP_RATE_LIMIT?: RateLimit;
  SYSONE_ACTIVATION_LICENSE_RATE_LIMIT?: RateLimit;
  SYSONE_PROJECT_REQUEST_RATE_LIMIT?: RateLimit;
}