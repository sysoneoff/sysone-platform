import { getSysOneEnv, requireBinding } from "@/lib/server/cloudflare";

type D1Like = NonNullable<ReturnType<typeof getSysOneEnv>["SYSONE_DB"]>;

function db(): D1Like {
  return requireBinding(getSysOneEnv().SYSONE_DB, "SYSONE_DB");
}

function runtimeBucket() {
  return requireBinding(getSysOneEnv().SYSONE_RUNTIME, "SYSONE_RUNTIME");
}

function clean(value: unknown, max = 300) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}
function nullable(value: unknown, max = 1000) {
  const v = clean(value, max);
  return v || null;
}
function bool(value: unknown) {
  return Boolean(value);
}

export type RuntimeRow = {
  productId: string;
  slug: string;
  name: string;
  kind: string;
  published: boolean;
  deliveryMode: string;
  runtimeType: string;
  launchUrl: string | null;
  embedMode: string;
  activeBuildId: string | null;
  requiresAuth: boolean;
  requiresEntitlement: boolean;
  supportsFullscreen: boolean;
  healthcheckUrl: string | null;
  buildCount: number;
  activeVersion: string | null;
  activePrefix: string | null;
};

type RuntimeDbRow = {
  product_id: string;
  slug: string;
  name: string;
  kind: string;
  published: number;
  delivery_mode: string | null;
  runtime_type: string | null;
  launch_url: string | null;
  embed_mode: string | null;
  active_build_id: string | null;
  requires_auth: number | null;
  requires_entitlement: number | null;
  supports_fullscreen: number | null;
  healthcheck_url: string | null;
  build_count: number;
  active_version: string | null;
  active_prefix: string | null;
};

function mapRuntime(row: RuntimeDbRow): RuntimeRow {
  return {
    productId: row.product_id,
    slug: row.slug,
    name: row.name,
    kind: row.kind,
    published: row.published === 1,
    deliveryMode: row.delivery_mode ?? "DOWNLOAD",
    runtimeType: row.runtime_type ?? "NONE",
    launchUrl: row.launch_url,
    embedMode: row.embed_mode ?? "FRAME",
    activeBuildId: row.active_build_id,
    requiresAuth: row.requires_auth === 1,
    requiresEntitlement: row.requires_entitlement === 1,
    supportsFullscreen: row.supports_fullscreen !== 0,
    healthcheckUrl: row.healthcheck_url,
    buildCount: Number(row.build_count ?? 0),
    activeVersion: row.active_version,
    activePrefix: row.active_prefix,
  };
}

export async function listRuntimeProducts() {
  const result = await db().prepare(
    `SELECT
       p.id AS product_id,p.slug,p.name,p.kind,p.published,
       rp.delivery_mode,rp.runtime_type,rp.launch_url,rp.embed_mode,
       rp.active_build_id,rp.requires_auth,rp.requires_entitlement,
       rp.supports_fullscreen,rp.healthcheck_url,
       COUNT(wb.id) AS build_count,
       active.version AS active_version,
       active.r2_prefix AS active_prefix
     FROM products p
     LEFT JOIN product_runtime_profiles rp ON rp.product_id=p.id
     LEFT JOIN web_app_builds wb ON wb.product_id=p.id
     LEFT JOIN web_app_builds active ON active.id=rp.active_build_id
     GROUP BY p.id
     ORDER BY p.updated_at DESC,p.name ASC`,
  ).all<RuntimeDbRow>();
  return (result.results ?? []).map(mapRuntime);
}

export async function getRuntimeProduct(productId: string) {
  const row = await db().prepare(
    `SELECT
       p.id AS product_id,p.slug,p.name,p.kind,p.published,
       rp.delivery_mode,rp.runtime_type,rp.launch_url,rp.embed_mode,
       rp.active_build_id,rp.requires_auth,rp.requires_entitlement,
       rp.supports_fullscreen,rp.healthcheck_url,
       (SELECT COUNT(*) FROM web_app_builds wb WHERE wb.product_id=p.id) AS build_count,
       active.version AS active_version,
       active.r2_prefix AS active_prefix
     FROM products p
     LEFT JOIN product_runtime_profiles rp ON rp.product_id=p.id
     LEFT JOIN web_app_builds active ON active.id=rp.active_build_id
     WHERE p.id=? LIMIT 1`,
  ).bind(productId).first<RuntimeDbRow>();
  return row ? mapRuntime(row) : null;
}

function normalizeRuntime(input: Record<string, unknown>) {
  const deliveryMode = (clean(input.deliveryMode, 16) || "DOWNLOAD").toUpperCase();
  const runtimeType = (clean(input.runtimeType, 16) || "NONE").toUpperCase();
  const embedMode = (clean(input.embedMode, 16) || "FRAME").toUpperCase();

  if (!["DOWNLOAD","WEB","HYBRID"].includes(deliveryMode)) throw new Error("invalid_delivery_mode");
  if (!["NONE","INTERNAL","EXTERNAL"].includes(runtimeType)) throw new Error("invalid_runtime_type");
  if (!["FRAME","NEW_TAB"].includes(embedMode)) throw new Error("invalid_embed_mode");

  const launchUrl = nullable(input.launchUrl, 800);
  const healthcheckUrl = nullable(input.healthcheckUrl, 800);

  if (runtimeType === "EXTERNAL" && !launchUrl) throw new Error("launch_url_required");
  for (const urlValue of [launchUrl, healthcheckUrl]) {
    if (urlValue && !/^https:\/\/[^\s]+$/i.test(urlValue)) throw new Error("invalid_url");
  }

  if (runtimeType === "EXTERNAL" && embedMode === "FRAME" && launchUrl) {
    const hostname = new URL(launchUrl).hostname.toLowerCase();
    if (!(hostname === "sysone.top" || hostname.endsWith(".sysone.top"))) {
      throw new Error("external_frame_requires_sysone_domain");
    }
  }

  return {
    deliveryMode,
    runtimeType,
    launchUrl,
    embedMode,
    requiresAuth: bool(input.requiresAuth),
    requiresEntitlement: bool(input.requiresEntitlement),
    supportsFullscreen: input.supportsFullscreen === undefined ? true : bool(input.supportsFullscreen),
    healthcheckUrl,
  };
}

export async function saveRuntimeProduct(productId: string, input: Record<string, unknown>) {
  const product = await db().prepare("SELECT id FROM products WHERE id=? LIMIT 1").bind(productId).first<{id:string}>();
  if (!product) throw new Error("product_not_found");
  const v = normalizeRuntime(input);

  await db().prepare(
    `INSERT INTO product_runtime_profiles
      (product_id,delivery_mode,runtime_type,launch_url,embed_mode,requires_auth,requires_entitlement,supports_fullscreen,healthcheck_url,created_at,updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
     ON CONFLICT(product_id) DO UPDATE SET
       delivery_mode=excluded.delivery_mode,
       runtime_type=excluded.runtime_type,
       launch_url=excluded.launch_url,
       embed_mode=excluded.embed_mode,
       requires_auth=excluded.requires_auth,
       requires_entitlement=excluded.requires_entitlement,
       supports_fullscreen=excluded.supports_fullscreen,
       healthcheck_url=excluded.healthcheck_url,
       updated_at=CURRENT_TIMESTAMP`,
  ).bind(
    productId,v.deliveryMode,v.runtimeType,v.launchUrl,v.embedMode,
    v.requiresAuth ? 1 : 0,v.requiresEntitlement ? 1 : 0,
    v.supportsFullscreen ? 1 : 0,v.healthcheckUrl,
  ).run();

  return getRuntimeProduct(productId);
}

export async function createWebBuild(input: {
  productId: string;
  version: string;
  prefix: string;
  fileCount: number;
  sizeBytes: number;
  checksumSha256: string | null;
}) {
  const id = crypto.randomUUID();
  await db().prepare(
    `INSERT INTO web_app_builds
      (id,product_id,version,r2_prefix,entry_file,file_count,size_bytes,checksum_sha256,status,created_at)
     VALUES (?,?,?,?, 'index.html', ?,?,?, 'READY', CURRENT_TIMESTAMP)`,
  ).bind(
    id,input.productId,input.version,input.prefix,input.fileCount,input.sizeBytes,input.checksumSha256,
  ).run();
  return id;
}

export async function activateWebBuild(productId: string, buildId: string) {
  const build = await db().prepare(
    "SELECT id FROM web_app_builds WHERE id=? AND product_id=? LIMIT 1",
  ).bind(buildId, productId).first<{id:string}>();
  if (!build) throw new Error("build_not_found");

  await db().prepare(
    `INSERT INTO product_runtime_profiles
      (product_id,delivery_mode,runtime_type,embed_mode,active_build_id,created_at,updated_at)
     VALUES (?, 'WEB','INTERNAL','FRAME',?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
     ON CONFLICT(product_id) DO UPDATE SET
       delivery_mode=CASE WHEN delivery_mode='DOWNLOAD' THEN 'HYBRID' ELSE delivery_mode END,
       runtime_type='INTERNAL',
       active_build_id=excluded.active_build_id,
       updated_at=CURRENT_TIMESTAMP`,
  ).bind(productId,buildId).run();

  await db().prepare(
    "UPDATE web_app_builds SET activated_at=CASE WHEN id=? THEN CURRENT_TIMESTAMP ELSE activated_at END WHERE product_id=?",
  ).bind(buildId,productId).run();

  return getRuntimeProduct(productId);
}

export async function listWebBuilds(productId: string) {
  const result = await db().prepare(
    `SELECT id,product_id,version,r2_prefix,entry_file,file_count,size_bytes,checksum_sha256,status,created_at,activated_at
     FROM web_app_builds WHERE product_id=? ORDER BY created_at DESC`,
  ).bind(productId).all<Record<string, unknown>>();
  return result.results ?? [];
}

export async function deleteWebBuild(productId: string, buildId: string) {
  const row = await db().prepare(
    `SELECT r2_prefix FROM web_app_builds WHERE id=? AND product_id=? LIMIT 1`,
  ).bind(buildId,productId).first<{r2_prefix:string}>();
  if (!row) return false;

  const profile = await db().prepare(
    `SELECT active_build_id FROM product_runtime_profiles WHERE product_id=? LIMIT 1`,
  ).bind(productId).first<{active_build_id:string|null}>();
  if (profile?.active_build_id === buildId) throw new Error("cannot_delete_active_build");

  let cursor: string | undefined;
  do {
    const listing = await runtimeBucket().list({ prefix: `${row.r2_prefix}/`, cursor, limit: 1000 });
    if (listing.objects.length) {
      await runtimeBucket().delete(listing.objects.map((item:{key:string}) => item.key));
    }
    cursor = listing.truncated ? listing.cursor : undefined;
  } while (cursor);

  await db().prepare("DELETE FROM web_app_builds WHERE id=? AND product_id=?").bind(buildId,productId).run();
  return true;
}

export async function getOwnerOverview() {
  const count = async (table: string, where = "") => {
    const row = await db().prepare(`SELECT COUNT(*) AS c FROM ${table} ${where}`).first<{c:number}>();
    return Number(row?.c ?? 0);
  };

  const [
    products,liveProducts,users,orders,licenses,projects,tickets,webBuilds,announcements,
  ] = await Promise.all([
    count("products"),
    count("products","WHERE published=1"),
    count("users"),
    count("orders"),
    count("licenses"),
    count("projects"),
    count("support_tickets","WHERE status NOT IN ('CLOSED','RESOLVED')"),
    count("web_app_builds"),
    count("announcements","WHERE enabled=1"),
  ]);

  const audit = await db().prepare(
    `SELECT id,action,entity_type,entity_id,metadata_json,created_at
     FROM audit_logs ORDER BY created_at DESC LIMIT 12`,
  ).all<Record<string, unknown>>();

  return {
    counts: { products, liveProducts, users, orders, licenses, projects, openTickets: tickets, webBuilds, announcements },
    audit: audit.results ?? [],
  };
}

type EntityConfig = {
  table: string;
  pk: string;
  select: string[];
  editable: Record<string, "text"|"number"|"boolean"|"nullableText">;
  order: string;
  deletable?: boolean;
};

const ENTITIES: Record<string, EntityConfig> = {
  users: {
    table: "users", pk: "id",
    select: ["id","email","name","role","locale","created_at","updated_at"],
    editable: { name:"text", role:"text", locale:"text" }, order: "created_at DESC",
  },
  sessions: {
    table: "sessions", pk: "id",
    select: ["id","user_id","device_label","expires_at","created_at"],
    editable: {}, order: "created_at DESC", deletable: true,
  },
  organizations: {
    table: "organizations", pk: "id",
    select: ["id","name","slug","owner_user_id","created_at"],
    editable: { name:"text", slug:"text", owner_user_id:"text" }, order: "created_at DESC",
  },
  notifications: {
    table: "notifications", pk: "id",
    select: ["id","user_id","type","title","body","read_at","created_at"],
    editable: { title:"text", body:"nullableText", read_at:"nullableText" }, order: "created_at DESC", deletable: true,
  },
  orders: {
    table: "orders", pk: "id",
    select: ["id","user_id","status","subtotal_minor","discount_minor","total_minor","currency","payment_provider","payment_reference","created_at","paid_at"],
    editable: { status:"text", payment_provider:"nullableText", payment_reference:"nullableText", paid_at:"nullableText" }, order: "created_at DESC",
  },
  entitlements: {
    table: "entitlements", pk: "id",
    select: ["id","user_id","product_id","order_id","status","starts_at","ends_at"],
    editable: { status:"text", ends_at:"nullableText" }, order: "starts_at DESC",
  },
  licenses: {
    table: "licenses", pk: "id",
    select: ["id","entitlement_id","device_limit","status","expires_at","created_at"],
    editable: { status:"text", device_limit:"number", expires_at:"nullableText" }, order: "created_at DESC",
  },
  devices: {
    table: "license_devices", pk: "id",
    select: ["id","license_id","device_hash","label","activated_at","last_seen_at"],
    editable: { label:"nullableText", last_seen_at:"nullableText" }, order: "activated_at DESC", deletable: true,
  },
  reviews: {
    table: "reviews", pk: "id",
    select: ["id","user_id","product_id","rating","body","verified_purchase","status","created_at"],
    editable: { status:"text", body:"nullableText" }, order: "created_at DESC", deletable: true,
  },
  projects: {
    table: "projects", pk: "id",
    select: ["id","user_id","organization_id","title","project_type","status","progress","created_at","updated_at"],
    editable: { title:"text", status:"text", progress:"number" }, order: "updated_at DESC",
  },
  support: {
    table: "support_tickets", pk: "id",
    select: ["id","user_id","product_id","category","priority","status","subject","created_at","updated_at"],
    editable: { priority:"text", status:"text", subject:"text" }, order: "updated_at DESC",
  },
  content: {
    table: "content_entries", pk: "id",
    select: ["id","key","locale","value_json","version","published","updated_by","updated_at"],
    editable: { value_json:"text", published:"boolean" }, order: "updated_at DESC",
  },
  flags: {
    table: "feature_flags", pk: "key",
    select: ["key","enabled","config_json","updated_by","updated_at"],
    editable: { enabled:"boolean", config_json:"nullableText" }, order: "updated_at DESC",
  },
  audit: {
    table: "audit_logs", pk: "id",
    select: ["id","actor_user_id","action","entity_type","entity_id","metadata_json","created_at"],
    editable: {}, order: "created_at DESC",
  },
  ai: {
    table: "ai_usage", pk: "id",
    select: ["id","user_id","feature","provider","model","input_units","output_units","created_at"],
    editable: {}, order: "created_at DESC",
  },
};

export function entityConfig(name: string) {
  return ENTITIES[name] ?? null;
}

export async function listEntity(name: string, limit = 200) {
  const config = entityConfig(name);
  if (!config) throw new Error("invalid_entity");
  const safeLimit = Math.max(1, Math.min(Number(limit) || 200, 500));
  const result = await db().prepare(
    `SELECT ${config.select.join(",")} FROM ${config.table} ORDER BY ${config.order} LIMIT ?`,
  ).bind(safeLimit).all<Record<string, unknown>>();
  return { rows: result.results ?? [], editable: Object.keys(config.editable), pk: config.pk, deletable: Boolean(config.deletable) };
}

export async function updateEntity(name: string, id: string, changes: Record<string, unknown>) {
  const config = entityConfig(name);
  if (!config) throw new Error("invalid_entity");
  const assignments: string[] = [];
  const values: unknown[] = [];

  for (const [key, raw] of Object.entries(changes)) {
    const type = config.editable[key];
    if (!type) continue;
    assignments.push(`${key}=?`);
    if (type === "boolean") values.push(Boolean(raw) ? 1 : 0);
    else if (type === "number") {
      const n = Number(raw);
      if (!Number.isFinite(n)) throw new Error(`invalid_${key}`);
      values.push(n);
    } else if (type === "nullableText") values.push(nullable(raw, 4000));
    else values.push(clean(raw, 4000));
  }

  if (!assignments.length) throw new Error("no_editable_changes");
  if (config.select.includes("updated_at")) assignments.push("updated_at=CURRENT_TIMESTAMP");
  values.push(id);

  await db().prepare(
    `UPDATE ${config.table} SET ${assignments.join(",")} WHERE ${config.pk}=?`,
  ).bind(...values).run();

  return true;
}


export async function deleteEntity(name: string, id: string) {
  const config = entityConfig(name);
  if (!config) throw new Error("invalid_entity");
  if (!config.deletable) throw new Error("entity_delete_forbidden");
  const result = await db().prepare(`DELETE FROM ${config.table} WHERE ${config.pk}=?`).bind(id).run();
  return Number(result.meta.changes ?? 0) > 0;
}

export async function getPlatformSettings() {
  const result = await db().prepare("SELECT key,value_json,updated_at FROM platform_settings ORDER BY key").all<{key:string,value_json:string,updated_at:string}>();
  return (result.results ?? []).map((row:{key:string;value_json:string;updated_at:string}) => ({
    key: row.key,
    value: (() => { try { return JSON.parse(row.value_json); } catch { return row.value_json; } })(),
    updatedAt: row.updated_at,
  }));
}

export async function setPlatformSetting(keyRaw: unknown, value: unknown) {
  const key = clean(keyRaw, 80);
  if (!/^[a-z0-9._-]+$/i.test(key)) throw new Error("invalid_setting_key");
  const json = JSON.stringify(value);
  if (json.length > 20000) throw new Error("setting_too_large");
  await db().prepare(
    `INSERT INTO platform_settings(key,value_json,updated_at)
     VALUES (?,?,CURRENT_TIMESTAMP)
     ON CONFLICT(key) DO UPDATE SET value_json=excluded.value_json,updated_at=CURRENT_TIMESTAMP`,
  ).bind(key,json).run();
  return true;
}
