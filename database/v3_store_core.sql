PRAGMA foreign_keys = ON;

-- SYSONE V3 STORE CORE
-- Additive migration.
-- V2 authentication, entitlements, licenses and downloads remain intact.
-- No demo data. No fake records.

CREATE TABLE IF NOT EXISTS product_store_profiles (
  product_id TEXT PRIMARY KEY,
  tagline TEXT,
  short_description TEXT,
  developer_name TEXT,
  release_date TEXT,
  age_rating TEXT,
  featured_rank INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS product_platforms (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  architecture TEXT,
  min_os TEXT,
  min_system TEXT,
  recommended_system TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(product_id, platform, architecture),
  FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS product_media (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  media_type TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  alt_text TEXT,
  width INTEGER,
  height INTEGER,
  duration_seconds INTEGER,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS product_features (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS product_tags (
  product_id TEXT NOT NULL,
  tag TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(product_id, tag),
  FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS product_translations (
  product_id TEXT NOT NULL,
  locale TEXT NOT NULL,
  name TEXT,
  tagline TEXT,
  short_description TEXT,
  description TEXT,
  seo_title TEXT,
  seo_description TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(product_id, locale),
  FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS product_promotions (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  sale_price_minor INTEGER NOT NULL
    CHECK(sale_price_minor >= 0),
  currency TEXT NOT NULL DEFAULT 'UZS',
  starts_at TEXT,
  ends_at TEXT,
  enabled INTEGER NOT NULL DEFAULT 1
    CHECK(enabled IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK(
    ends_at IS NULL
    OR starts_at IS NULL
    OR datetime(ends_at) > datetime(starts_at)
  ),
  FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS product_relations (
  product_id TEXT NOT NULL,
  related_product_id TEXT NOT NULL,
  relation_type TEXT NOT NULL DEFAULT 'RELATED',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(product_id, related_product_id, relation_type),
  CHECK(product_id <> related_product_id),
  FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY(related_product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_store_profiles_featured
ON product_store_profiles(
  featured_rank DESC,
  updated_at DESC
);

CREATE INDEX IF NOT EXISTS idx_product_platforms_product
ON product_platforms(
  product_id,
  platform
);

CREATE INDEX IF NOT EXISTS idx_product_media_product
ON product_media(
  product_id,
  media_type,
  sort_order
);

CREATE INDEX IF NOT EXISTS idx_product_features_product
ON product_features(
  product_id,
  sort_order
);

CREATE INDEX IF NOT EXISTS idx_product_tags_tag
ON product_tags(
  tag,
  product_id
);

CREATE INDEX IF NOT EXISTS idx_product_translations_locale
ON product_translations(
  locale,
  product_id
);

CREATE INDEX IF NOT EXISTS idx_product_promotions_active
ON product_promotions(
  product_id,
  enabled,
  starts_at,
  ends_at
);

CREATE INDEX IF NOT EXISTS idx_product_relations_product
ON product_relations(
  product_id,
  relation_type,
  sort_order
);