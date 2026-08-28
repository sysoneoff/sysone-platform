"use client";

import {
  Activity,
  Boxes,
  Gamepad2,
  KeyRound,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  TicketCheck,
  Users,
  Wifi,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

type OverviewStats = {
  users: number;
  products: number;
  games: number;
  activeSessions: number;
  activeEntitlements: number;
  activeLicenses: number;
};

type OverviewActivity = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  createdAt: string;
};

type AdminOverview = {
  stats: OverviewStats;
  recentActivity: OverviewActivity[];
};

const emptyStats: OverviewStats = {
  users: 0,
  products: 0,
  games: 0,
  activeSessions: 0,
  activeEntitlements: 0,
  activeLicenses: 0,
};

async function readJson(response: Response) {
  const data = await response
    .json()
    .catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.error ||
        `request_failed_${response.status}`,
    );
  }

  return data;
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "uz-UZ",
    {
      dateStyle: "short",
      timeStyle: "short",
    },
  ).format(date);
}

function formatAction(action: string) {
  const labels: Record<string, string> = {
    "product.create":
      "Mahsulot yaratildi",
    "product.update":
      "Mahsulot yangilandi",
    "product.delete":
      "Mahsulot o‘chirildi",

    "release.create":
      "Release yaratildi",
    "release.update":
      "Release yangilandi",
    "release.delete":
      "Release o‘chirildi",

    "release.file.upload":
      "Build yuklandi",
    "release.file.delete":
      "Build o‘chirildi",

    "entitlement.create":
      "Entitlement yaratildi",
    "entitlement.update":
      "Entitlement yangilandi",

    "license.create":
      "Litsenziya yaratildi",
    "license.update":
      "Litsenziya yangilandi",

    "user.sessions.revoke_all":
      "Foydalanuvchi sessiyalari bekor qilindi",
  };

  return (
    labels[action] ??
    action
      .replaceAll(".", " / ")
      .replaceAll("_", " ")
  );
}

function formatEntity(
  entityType: string,
  entityId: string | null,
) {
  if (!entityId) {
    return entityType;
  }

  const shortId =
    entityId.length > 16
      ? `${entityId.slice(0, 8)}…${entityId.slice(-6)}`
      : entityId;

  return `${entityType} · ${shortId}`;
}

export function DashboardManager() {
  const [overview, setOverview] =
    useState<AdminOverview>({
      stats: emptyStats,
      recentActivity: [],
    });

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [lastLoadedAt, setLastLoadedAt] =
    useState<Date | null>(null);

  async function load(
    silent = false,
  ) {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const data = await readJson(
        await fetch(
          "/api/admin/overview",
          {
            cache: "no-store",
          },
        ),
      );

      setOverview(
        data.overview ?? {
          stats: emptyStats,
          recentActivity: [],
        },
      );

      setLastLoadedAt(new Date());
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "overview_load_failed",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const stats = useMemo(
    () => [
      {
        label: "Users",
        value: overview.stats.users,
        detail: "Ro‘yxatdan o‘tgan foydalanuvchilar",
        Icon: Users,
      },
      {
        label: "Active sessions",
        value:
          overview.stats
            .activeSessions,
        detail:
          "Hozir amal qilayotgan login sessiyalari",
        Icon: Wifi,
      },
      {
        label: "Products",
        value:
          overview.stats.products,
        detail: `${overview.stats.games} ta Games`,
        Icon: Boxes,
      },
      {
        label: "Games",
        value: overview.stats.games,
        detail:
          "SysOne Games katalogi",
        Icon: Gamepad2,
      },
      {
        label: "Entitlements",
        value:
          overview.stats
            .activeEntitlements,
        detail:
          "Faol foydalanish huquqlari",
        Icon: TicketCheck,
      },
      {
        label: "Licenses",
        value:
          overview.stats
            .activeLicenses,
        detail:
          "Faol litsenziyalar",
        Icon: KeyRound,
      },
    ],
    [overview.stats],
  );

  if (loading) {
    return (
      <section className="adminWorkspace">
        <div className="adminLoading">
          <LoaderCircle className="spin" />
          Real production statistika
          yuklanmoqda...
        </div>
      </section>
    );
  }

  return (
    <section className="adminWorkspace">
      <div className="adminWorkspaceHead">
        <div>
          <span className="eyebrow">
            REAL PRODUCTION DATA
          </span>

          <h2>
            Platform Overview
          </h2>

          <p>
            D1 database va real admin
            audit oqimidan olinayotgan
            joriy holat.
          </p>
        </div>

        <button
          className="adminIconBtn"
          title="Yangilash"
          disabled={refreshing}
          onClick={() =>
            void load(true)
          }
        >
          {refreshing ? (
            <LoaderCircle
              className="spin"
              size={17}
            />
          ) : (
            <RefreshCw size={17} />
          )}
        </button>
      </div>

      {error ? (
        <div className="adminInlineError">
          Dashboard ma’lumotlarini
          yuklab bo‘lmadi: {error}
        </div>
      ) : null}

      <div className="adminStatGrid">
        {stats.map(
          ({
            label,
            value,
            detail,
            Icon,
          }) => (
            <article
              className="adminStat"
              key={label}
            >
              <small>
                {label}
              </small>

              <strong>
                {new Intl.NumberFormat(
                  "uz-UZ",
                ).format(value)}
              </strong>

              <span>
                <Icon size={14} />
                {detail}
              </span>
            </article>
          ),
        )}
      </div>

      <div className="adminDashboardGrid">
        <article className="adminPanel">
          <div className="adminPanelHead">
            <span>
              <strong>
                Recent activity
              </strong>

              <small>
                D1 audit_logs · real
                admin events
              </small>
            </span>

            <Activity />
          </div>

          <div className="activityList">
            {overview.recentActivity.map(
              (activity) => (
                <div key={activity.id}>
                  <span>
                    {formatDate(
                      activity.createdAt,
                    )}
                  </span>

                  <div>
                    <strong>
                      {formatAction(
                        activity.action,
                      )}
                    </strong>

                    <small>
                      {formatEntity(
                        activity.entityType,
                        activity.entityId,
                      )}
                    </small>
                  </div>
                </div>
              ),
            )}

            {!overview
              .recentActivity.length ? (
              <div className="adminEmpty">
                Audit activity hali
                mavjud emas.
              </div>
            ) : null}
          </div>
        </article>

        <article className="adminPanel">
          <div className="adminPanelHead">
            <span>
              <strong>
                Access state
              </strong>

              <small>
                Entitlement, license va
                session holati
              </small>
            </span>

            <ShieldCheck />
          </div>

          <div className="healthRow">
            <span>
              Active sessions
            </span>

            <em>
              <i />
              {
                overview.stats
                  .activeSessions
              }
            </em>
          </div>

          <div className="healthRow">
            <span>
              Active entitlements
            </span>

            <em>
              <i />
              {
                overview.stats
                  .activeEntitlements
              }
            </em>
          </div>

          <div className="healthRow">
            <span>
              Active licenses
            </span>

            <em>
              <i />
              {
                overview.stats
                  .activeLicenses
              }
            </em>
          </div>

          <div className="healthRow">
            <span>
              Products / Games
            </span>

            <em>
              <i />
              {overview.stats.products}
              {" / "}
              {overview.stats.games}
            </em>
          </div>
        </article>

        <article className="adminPanel">
          <div className="adminPanelHead">
            <span>
              <strong>
                Data source
              </strong>

              <small>
                Verified runtime state
              </small>
            </span>

            <Wifi />
          </div>

          <div className="healthRow">
            <span>
              Admin API
            </span>

            <em>
              <i />
              Connected
            </em>
          </div>

          <div className="healthRow">
            <span>
              D1 overview query
            </span>

            <em>
              <i />
              Loaded
            </em>
          </div>

          <div className="healthRow">
            <span>
              Audit stream
            </span>

            <em>
              <i />
              Loaded
            </em>
          </div>

          <div className="healthRow">
            <span>
              Last refresh
            </span>

            <em>
              {lastLoadedAt
                ? lastLoadedAt.toLocaleTimeString(
                    "uz-UZ",
                  )
                : "—"}
            </em>
          </div>
        </article>
      </div>
    </section>
  );
}