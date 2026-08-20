import { getSysOneEnv, requireBinding } from "@/lib/server/cloudflare";
import type { SysOneUser } from "@/lib/server/user-auth";

export type AuthProvider = "GOOGLE" | "TELEGRAM";

export type IdentityProfile = {
  provider: AuthProvider;
  providerAccountId: string;
  email?: string | null;
  name: string;
  imageUrl?: string | null;
  username?: string | null;
  locale?: string | null;
};

export type UserIdentity = {
  id: string;
  user_id: string;
  provider: AuthProvider;
  provider_account_id: string;
  username: string | null;
  created_at: string;
};

function getDatabase() {
  return requireBinding(getSysOneEnv().SYSONE_DB, "SYSONE_DB");
}

function normalizeEmail(email?: string | null) {
  const value = email?.trim().toLowerCase();
  return value || null;
}

function normalizeLocale(locale?: string | null) {
  const value = locale?.trim().toLowerCase();

  if (!value) return "uz";

  return value.slice(0, 10);
}

function normalizeProviderAccountId(value: string) {
  const normalized = value.trim();

  if (!normalized) {
    throw new Error("provider_account_id_required");
  }

  return normalized;
}

export async function getUserByIdentity(
  provider: AuthProvider,
  providerAccountId: string,
): Promise<SysOneUser | null> {
  const db = getDatabase();

  const normalizedAccountId =
    normalizeProviderAccountId(providerAccountId);

  const user = await db
    .prepare(
      `
        SELECT
          u.id,
          u.email,
          u.name,
          u.image_url,
          u.role,
          u.locale,
          u.created_at,
          u.updated_at
        FROM auth_accounts a
        INNER JOIN users u ON u.id = a.user_id
        WHERE
          a.provider = ?
          AND a.provider_account_id = ?
        LIMIT 1
      `,
    )
    .bind(provider, normalizedAccountId)
    .first<SysOneUser>();

  return user ?? null;
}

export async function getUserByEmail(
  email: string,
): Promise<SysOneUser | null> {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) return null;

  const db = getDatabase();

  const user = await db
    .prepare(
      `
        SELECT
          id,
          email,
          name,
          image_url,
          role,
          locale,
          created_at,
          updated_at
        FROM users
        WHERE email = ?
        LIMIT 1
      `,
    )
    .bind(normalizedEmail)
    .first<SysOneUser>();

  return user ?? null;
}

export async function getIdentity(
  provider: AuthProvider,
  providerAccountId: string,
): Promise<UserIdentity | null> {
  const db = getDatabase();

  const normalizedAccountId =
    normalizeProviderAccountId(providerAccountId);

  const identity = await db
    .prepare(
      `
        SELECT
          id,
          user_id,
          provider,
          provider_account_id,
          username,
          created_at
        FROM auth_accounts
        WHERE
          provider = ?
          AND provider_account_id = ?
        LIMIT 1
      `,
    )
    .bind(provider, normalizedAccountId)
    .first<UserIdentity>();

  return identity ?? null;
}

export async function createUserWithIdentity(
  profile: IdentityProfile,
): Promise<SysOneUser> {
  const db = getDatabase();

  const providerAccountId =
    normalizeProviderAccountId(profile.providerAccountId);

  const existingIdentity = await getUserByIdentity(
    profile.provider,
    providerAccountId,
  );

  if (existingIdentity) {
    throw new Error("identity_already_exists");
  }

  const email = normalizeEmail(profile.email);

  if (email) {
    const existingEmailUser = await getUserByEmail(email);

    if (existingEmailUser) {
      // Muhim:
      // bir xil email topilganda provider'ni avtomatik bog'lamaymiz.
      // Account linking alohida, tasdiqlangan flow orqali bajariladi.
      throw new Error("email_already_registered");
    }
  }

  const name = profile.name.trim();

  if (!name) {
    throw new Error("name_required");
  }

  const userId = crypto.randomUUID();
  const identityId = crypto.randomUUID();

  await db.batch([
    db
      .prepare(
        `
          INSERT INTO users (
            id,
            email,
            name,
            image_url,
            role,
            locale
          )
          VALUES (?, ?, ?, ?, 'USER', ?)
        `,
      )
      .bind(
        userId,
        email,
        name,
        profile.imageUrl?.trim() || null,
        normalizeLocale(profile.locale),
      ),

    db
      .prepare(
        `
          INSERT INTO auth_accounts (
            id,
            user_id,
            provider,
            provider_account_id,
            username
          )
          VALUES (?, ?, ?, ?, ?)
        `,
      )
      .bind(
        identityId,
        userId,
        profile.provider,
        providerAccountId,
        profile.username?.trim() || null,
      ),
  ]);

  const user = await getUserByIdentity(
    profile.provider,
    providerAccountId,
  );

  if (!user) {
    throw new Error("identity_creation_failed");
  }

  return user;
}