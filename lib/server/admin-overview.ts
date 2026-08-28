import {
  getSysOneEnv,
  requireBinding,
} from "@/lib/server/cloudflare";

export type AdminOverviewStats = {
  users: number;
  products: number;
  games: number;
  activeSessions: number;
  activeEntitlements: number;
  activeLicenses: number;
};

export type AdminOverviewActivity = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  createdAt: string;
};

export type AdminOverview = {
  stats: AdminOverviewStats;
  recentActivity: AdminOverviewActivity[];
};

type CountRow = {
  count: number | string;
};

type AuditRow = {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  created_at: string;
};

function getDb() {
  return requireBinding(
    getSysOneEnv().SYSONE_DB,
    "SYSONE_DB",
  );
}

function normalizeCount(
  row: CountRow | null,
) {
  if (!row) {
    return 0;
  }

  const value = Number(row.count);

  return Number.isFinite(value)
    ? value
    : 0;
}

async function count(sql: string) {
  const row = await getDb()
    .prepare(sql)
    .first<CountRow>();

  return normalizeCount(row);
}

export async function getAdminOverview(): Promise<AdminOverview> {
  const db = getDb();

  const [
    users,
    products,
    games,
    activeSessions,
    activeEntitlements,
    activeLicenses,
    activityResult,
  ] = await Promise.all([
    count(`
      SELECT COUNT(*) AS count
      FROM users
    `),

    count(`
      SELECT COUNT(*) AS count
      FROM products
    `),

    count(`
      SELECT COUNT(*) AS count
      FROM products
      WHERE kind = 'GAME'
    `),

    count(`
      SELECT COUNT(*) AS count
      FROM sessions
      WHERE datetime(expires_at) >
            CURRENT_TIMESTAMP
    `),

    count(`
      SELECT COUNT(*) AS count
      FROM entitlements
      WHERE status = 'ACTIVE'
        AND datetime(starts_at) <=
            CURRENT_TIMESTAMP
        AND (
          ends_at IS NULL
          OR datetime(ends_at) >
             CURRENT_TIMESTAMP
        )
    `),

    count(`
      SELECT COUNT(*) AS count
      FROM licenses AS license
      INNER JOIN entitlements AS entitlement
        ON entitlement.id =
           license.entitlement_id
      WHERE license.status = 'ACTIVE'
        AND (
          license.expires_at IS NULL
          OR datetime(license.expires_at) >
             CURRENT_TIMESTAMP
        )
        AND entitlement.status = 'ACTIVE'
        AND datetime(entitlement.starts_at) <=
            CURRENT_TIMESTAMP
        AND (
          entitlement.ends_at IS NULL
          OR datetime(entitlement.ends_at) >
             CURRENT_TIMESTAMP
        )
    `),

    db
      .prepare(`
        SELECT
          id,
          action,
          entity_type,
          entity_id,
          created_at
        FROM audit_logs
        ORDER BY
          datetime(created_at) DESC,
          id DESC
        LIMIT 12
      `)
      .all<AuditRow>(),
  ]);

  const recentActivity =
    activityResult.results ?? [];

  return {
    stats: {
      users,
      products,
      games,
      activeSessions,
      activeEntitlements,
      activeLicenses,
    },

    recentActivity:
      recentActivity.map(
        (row: AuditRow) => ({
          id: row.id,
          action: row.action,
          entityType:
            row.entity_type,
          entityId:
            row.entity_id,
          createdAt:
            row.created_at,
        }),
      ),
  };
}