import { getSysOneEnv, requireBinding } from "@/lib/server/cloudflare";

export type AdminUserIdentity = {
  id: string;
  provider: string;
  providerAccountId: string;
  username: string | null;
  createdAt: string;
};

export type AdminUserSession = {
  id: string;
  deviceLabel: string | null;
  expiresAt: string;
  createdAt: string;
  state: "ACTIVE" | "EXPIRED";
};

export type AdminUser = {
  id: string;
  email: string | null;
  name: string;
  imageUrl: string | null;
  role: string;
  locale: string;
  createdAt: string;
  updatedAt: string;
  identities: AdminUserIdentity[];
  sessions: AdminUserSession[];
  activeSessions: number;
};

type UserRow = {
  id: string;
  email: string | null;
  name: string;
  image_url: string | null;
  role: string;
  locale: string;
  created_at: string;
  updated_at: string;
};

type IdentityRow = {
  id: string;
  user_id: string;
  provider: string;
  provider_account_id: string;
  username: string | null;
  created_at: string;
};

type SessionRow = {
  id: string;
  user_id: string;
  device_label: string | null;
  expires_at: string;
  created_at: string;
};

function getDb() {
  return requireBinding(getSysOneEnv().SYSONE_DB, "SYSONE_DB");
}

function sessionState(expiresAt: string): "ACTIVE" | "EXPIRED" {
  const timestamp = Date.parse(expiresAt);

  if (Number.isNaN(timestamp)) {
    return "EXPIRED";
  }

  return timestamp > Date.now() ? "ACTIVE" : "EXPIRED";
}

export async function listAdminUsers(): Promise<AdminUser[]> {
  const db = getDb();

  const [usersResult, identitiesResult, sessionsResult] = await Promise.all([
    db
      .prepare(
        `SELECT
           id,
           email,
           name,
           image_url,
           role,
           locale,
           created_at,
           updated_at
         FROM users
         ORDER BY created_at DESC, id DESC`,
      )
      .all<UserRow>(),

    db
      .prepare(
        `SELECT
           id,
           user_id,
           provider,
           provider_account_id,
           username,
           created_at
         FROM auth_accounts
         ORDER BY created_at DESC, id DESC`,
      )
      .all<IdentityRow>(),

    db
      .prepare(
        `SELECT
           id,
           user_id,
           device_label,
           expires_at,
           created_at
         FROM sessions
         ORDER BY created_at DESC, id DESC`,
      )
      .all<SessionRow>(),
  ]);

  const identitiesByUser = new Map<string, AdminUserIdentity[]>();
  const sessionsByUser = new Map<string, AdminUserSession[]>();

  for (const row of identitiesResult.results ?? []) {
    const items = identitiesByUser.get(row.user_id) ?? [];

    items.push({
      id: row.id,
      provider: row.provider,
      providerAccountId: row.provider_account_id,
      username: row.username,
      createdAt: row.created_at,
    });

    identitiesByUser.set(row.user_id, items);
  }

  for (const row of sessionsResult.results ?? []) {
    const items = sessionsByUser.get(row.user_id) ?? [];

    items.push({
      id: row.id,
      deviceLabel: row.device_label,
      expiresAt: row.expires_at,
      createdAt: row.created_at,
      state: sessionState(row.expires_at),
    });

    sessionsByUser.set(row.user_id, items);
  }

  return (usersResult.results ?? []).map((row: UserRow) => {
    const identities = identitiesByUser.get(row.id) ?? [];
    const sessions = sessionsByUser.get(row.id) ?? [];

    return {
      id: row.id,
      email: row.email,
      name: row.name,
      imageUrl: row.image_url,
      role: row.role,
      locale: row.locale,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      identities,
      sessions,
      activeSessions: sessions.filter(
        (session) => session.state === "ACTIVE",
      ).length,
    };
  });
}

export async function adminUserExists(userId: string) {
  const id = userId.trim().slice(0, 160);

  if (!id) return false;

  const row = await getDb()
    .prepare("SELECT id FROM users WHERE id = ? LIMIT 1")
    .bind(id)
    .first<{ id: string }>();

  return Boolean(row);
}