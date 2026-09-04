"use client";

import { useEffect, useMemo, useState } from "react";
import {
  LoaderCircle,
  LogOut,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
} from "lucide-react";

type AdminUserIdentity = {
  id: string;
  provider: string;
  providerAccountId: string;
  username: string | null;
  createdAt: string;
};

type AdminUserSession = {
  id: string;
  deviceLabel: string | null;
  expiresAt: string;
  createdAt: string;
  state: "ACTIVE" | "EXPIRED";
};

type AdminUser = {
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

async function readJson(response: Response) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `request_failed_${response.status}`);
  }

  return data;
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString();
}

function providerLabel(user: AdminUser) {
  if (!user.identities.length) {
    return "NONE";
  }

  return user.identities.map((identity) => identity.provider).join(", ");
}

export function UsersManager() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [provider, setProvider] = useState("ALL");

  async function load() {
    setLoading(true);
    setError("");

    try {
      const data = await readJson(
        await fetch("/api/admin/users", {
          cache: "no-store",
        }),
      );

      setUsers(data.users ?? []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "users_load_failed",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return users.filter((user) => {
      const providers = user.identities.map(
        (identity) => identity.provider,
      );

      const matchesProvider =
        provider === "ALL" ||
        providers.includes(provider);

      const haystack = [
        user.name,
        user.email ?? "",
        user.role,
        user.locale,
        ...user.identities.map(
          (identity) =>
            `${identity.provider} ${identity.username ?? ""}`,
        ),
      ]
        .join(" ")
        .toLowerCase();

      return (
        matchesProvider &&
        (!needle || haystack.includes(needle))
      );
    });
  }, [provider, query, users]);

  async function revokeAllSessions(user: AdminUser) {
    if (user.activeSessions === 0) {
      return;
    }

    const confirmed = window.confirm(
      `${user.name} uchun barcha aktiv sessiyalar bekor qilinsinmi?`,
    );

    if (!confirmed) {
      return;
    }

    setRevoking(user.id);
    setError("");

    try {
      await readJson(
        await fetch(
          `/api/admin/users/${encodeURIComponent(user.id)}/sessions`,
          {
            method: "DELETE",
          },
        ),
      );

      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "session_revoke_failed",
      );
    } finally {
      setRevoking(null);
    }
  }

  const activeSessionCount = users.reduce(
    (total, user) => total + user.activeSessions,
    0,
  );

  return (
    <section className="adminWorkspace">
      <div className="adminWorkspaceHead">
        <div>
          <span className="eyebrow">
            D1 IDENTITY & SESSION CONTROL
          </span>

          <h2>Users & Sessions</h2>

          <p>
            Google va Telegram foydalanuvchilari,
            identity providerlari va aktiv sessiyalar.
          </p>
        </div>

        <div className="releaseCount">
          {users.length} users
        </div>
      </div>

      <div className="releaseSecurity">
        <ShieldCheck size={17} />

        <div>
          <strong>Session security</strong>

          <span>
            Raw session tokenlari, token hashlar va IP
            hashlar Control Center frontendiga chiqarilmaydi.
          </span>
        </div>

        <em>{activeSessionCount} ACTIVE</em>
      </div>

      <div className="adminToolbar">
        <label className="adminSearch">
          <Search size={15} />

          <input
            value={query}
            onChange={(event) =>
              setQuery(event.target.value)
            }
            placeholder="User, email, provider yoki username..."
          />
        </label>

        <select
          value={provider}
          onChange={(event) =>
            setProvider(event.target.value)
          }
        >
          <option value="ALL">Barcha loginlar</option>
          <option value="GOOGLE">Google</option>
          <option value="TELEGRAM">Telegram</option>
        </select>

        <button
          className="adminIconBtn"
          onClick={() => void load()}
          title="Yangilash"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {error ? (
        <div className="adminInlineError">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="adminLoading">
          <LoaderCircle className="spin" />
          Users D1 bazadan yuklanmoqda...
        </div>
      ) : (
        <div className="adminTableWrap">
          <table className="adminTable">
            <thead>
              <tr>
                <th>User</th>
                <th>Provider</th>
                <th>Role</th>
                <th>Sessions</th>
                <th>Created</th>
                <th />
              </tr>
            </thead>

            <tbody>
              {filtered.map((user) => (
                <tr key={user.id}>
                  <td>
                    <strong>
                      {user.name || "Unnamed user"}
                    </strong>

                    <small>
                      {user.email ?? "Email mavjud emas"}
                      <br />
                      Locale: {user.locale}
                    </small>
                  </td>

                  <td>
                    <span className="adminBadge">
                      {providerLabel(user)}
                    </span>

                    {user.identities.some(
                      (identity) =>
                        Boolean(identity.username),
                    ) ? (
                      <small>
                        {user.identities
                          .filter(
                            (identity) =>
                              identity.username,
                          )
                          .map(
                            (identity) =>
                              `@${identity.username}`,
                          )
                          .join(", ")}
                      </small>
                    ) : null}
                  </td>

                  <td>
                    <span className="adminBadge">
                      {user.role}
                    </span>
                  </td>

                  <td>
                    <span
                      className={`adminStatus ${
                        user.activeSessions > 0
                          ? "good"
                          : ""
                      }`}
                    >
                      {user.activeSessions} ACTIVE
                    </span>

                    <small>
                      {user.sessions.length} total
                    </small>
                  </td>

                  <td>
                    <strong>
                      {formatDate(user.createdAt)}
                    </strong>

                    <small>
                      Updated:{" "}
                      {formatDate(user.updatedAt)}
                    </small>
                  </td>

                  <td>
                    <div className="adminRowActions">
                      <button
                        title="User"
                        disabled
                      >
                        <UserRound size={15} />
                      </button>

                      <button
                        className={
                          user.activeSessions > 0
                            ? "danger"
                            : ""
                        }
                        disabled={
                          user.activeSessions === 0 ||
                          revoking === user.id
                        }
                        onClick={() =>
                          void revokeAllSessions(user)
                        }
                        title="Barcha sessiyalarni bekor qilish"
                      >
                        {revoking === user.id ? (
                          <LoaderCircle
                            className="spin"
                            size={15}
                          />
                        ) : (
                          <LogOut size={15} />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!filtered.length ? (
            <div className="adminEmpty">
              Mos foydalanuvchi topilmadi.
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}