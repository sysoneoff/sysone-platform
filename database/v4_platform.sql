PRAGMA foreign_keys = ON;

-- SysOne V4 Platform
-- Additive migration for announcements, web runtimes, uploaded web builds,
-- runtime access, and owner-managed settings.

CREATE TABLE IF NOT EXISTS announcements (
  id TEXT PRIMARY KEY,
  label TEXT,
  title TEXT NOT NULL,
  href TEXT,
  style TEXT NOT NULL DEFAULT 'DEFAULT'
    CHECK(style IN ('DEFAULT','NEW','UPDATE','GAME','APP','SALE')),
  priority INTEGER NOT NULL DEFAULT 0,
  enabled INTEGER NOT NULL DEFAULT 1 CHECK(enabled IN (0,1)),
  starts_at TEXT,
  ends_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK(ends_at IS NULL OR starts_at IS NULL OR datetime(ends_at) > datetime(starts_at))
);

CREATE TABLE IF NOT EXISTS product_runtime_profiles (
  product_id TEXT PRIMARY KEY,
  delivery_mode TEXT NOT NULL DEFAULT 'DOWNLOAD'
    CHECK(delivery_mode IN ('DOWNLOAD','WEB','HYBRID')),
  runtime_type TEXT NOT NULL DEFAULT 'NONE'
    CHECK(runtime_type IN ('NONE','INTERNAL','EXTERNAL')),
  launch_url TEXT,
  embed_mode TEXT NOT NULL DEFAULT 'FRAME'
    CHECK(embed_mode IN ('FRAME','NEW_TAB')),
  active_build_id TEXT,
  requires_auth INTEGER NOT NULL DEFAULT 0 CHECK(requires_auth IN (0,1)),
  requires_entitlement INTEGER NOT NULL DEFAULT 0 CHECK(requires_entitlement IN (0,1)),
  supports_fullscreen INTEGER NOT NULL DEFAULT 1 CHECK(supports_fullscreen IN (0,1)),
  healthcheck_url TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS web_app_builds (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  version TEXT NOT NULL,
  r2_prefix TEXT NOT NULL UNIQUE,
  entry_file TEXT NOT NULL DEFAULT 'index.html',
  file_count INTEGER NOT NULL DEFAULT 0,
  size_bytes INTEGER NOT NULL DEFAULT 0,
  checksum_sha256 TEXT,
  status TEXT NOT NULL DEFAULT 'READY'
    CHECK(status IN ('UPLOADING','READY','FAILED','ARCHIVED')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  activated_at TEXT,
  FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS platform_settings (
  key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_announcements_live
ON announcements(enabled, priority DESC, starts_at, ends_at);

CREATE INDEX IF NOT EXISTS idx_runtime_delivery
ON product_runtime_profiles(delivery_mode, runtime_type);

CREATE INDEX IF NOT EXISTS idx_web_builds_product
ON web_app_builds(product_id, created_at DESC);

INSERT OR IGNORE INTO platform_settings(key, value_json)
VALUES
  ('home', '{"showAnnouncementBar":true,"announcementSpeed":34,"showWebApps":true,"showWebGames":true}'),
  ('runtime', '{"origin":"https://runtime.sysone.top","maxUploadMb":25,"maxFiles":500}');
