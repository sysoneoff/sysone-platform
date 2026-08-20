PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS product_versions (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  version TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'STABLE',
  changelog TEXT,
  min_system TEXT,
  published_at TEXT,
  UNIQUE(product_id, version, channel),
  FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS product_files (
  id TEXT PRIMARY KEY,
  product_version_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  size_bytes INTEGER,
  checksum_sha256 TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(product_version_id) REFERENCES product_versions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_product_versions_product ON product_versions(product_id, published_at);
CREATE INDEX IF NOT EXISTS idx_product_files_version ON product_files(product_version_id, created_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_files_r2_key ON product_files(r2_key);
