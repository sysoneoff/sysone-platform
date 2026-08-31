PRAGMA foreign_keys = ON;

INSERT INTO products (id, slug, name, kind, category, description, status, pricing_model, price_minor, currency, featured, published)
VALUES
  ('prd_zeta_security', 'zeta-security', 'Zeta Security', 'SOFTWARE', 'Desktop Software', 'Windows cleanup, startup control, performance tuning and system health.', 'BETA', 'FREEMIUM', 0, 'UZS', 1, 1),
  ('prd_onecast', 'onecast', 'OneCast Studio', 'SOFTWARE', 'Creator Tools', 'Lightweight screen recording with adaptive capture, audio recording and a focused library.', 'BETA', 'FREEMIUM', 0, 'UZS', 1, 1),
  ('prd_hujjat_plus', 'hujjat-plus', 'Hujjat+', 'SOFTWARE', 'Business Tools', 'Structured Word and PDF document automation with reusable templates.', 'COMING_SOON', 'CUSTOM', 0, 'UZS', 1, 1),
  ('prd_sysone_work', 'sysone-work', 'SysOne Work', 'SOFTWARE', 'Business Systems', 'Mobile-first field reporting, media evidence, geolocation and management dashboards.', 'COMING_SOON', 'CUSTOM', 0, 'UZS', 0, 1)
ON CONFLICT(slug) DO UPDATE SET
  name = excluded.name,
  kind = excluded.kind,
  category = excluded.category,
  description = excluded.description,
  status = excluded.status,
  pricing_model = excluded.pricing_model,
  price_minor = excluded.price_minor,
  currency = excluded.currency,
  featured = excluded.featured,
  published = excluded.published,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO product_versions (id, product_id, version, channel, changelog, published_at)
VALUES
  ('ver_zeta_3_2', 'prd_zeta_security', '3.2', 'BETA', 'Current SysOne platform catalog version.', CURRENT_TIMESTAMP),
  ('ver_onecast_0_9', 'prd_onecast', '0.9', 'BETA', 'Current SysOne platform catalog version.', CURRENT_TIMESTAMP),
  ('ver_hujjat_1_0', 'prd_hujjat_plus', '1.0', 'STABLE', 'Initial planned release.', NULL),
  ('ver_work_1_0', 'prd_sysone_work', '1.0', 'STABLE', 'Initial planned release.', NULL)
ON CONFLICT(product_id, version, channel) DO UPDATE SET
  changelog = excluded.changelog,
  published_at = excluded.published_at;
