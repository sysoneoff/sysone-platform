import Link from "next/link";
import {
  Bell,
  Box,
  Download,
  FileText,
  Gamepad2,
  Heart,
  KeyRound,
  LifeBuoy,
  MonitorSmartphone,
  PackageCheck,
  Settings,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { getAccountData } from "@/lib/server/account-data";
import { getCurrentUser } from "@/lib/server/user-auth";

export const dynamic = "force-dynamic";

const nav = [
  ["Overview", UserRound, "#overview"],
  ["Products", Box, "#products"],
  ["Games", Gamepad2, "#games"],
  ["Orders", PackageCheck, "#orders"],
  ["Downloads", Download, "#downloads"],
  ["Licenses", KeyRound, "#licenses"],
  ["Projects", FileText, "#projects"],
  ["Saved", Heart, "#saved"],
  ["Support", LifeBuoy, "#support"],
  ["Notifications", Bell, "#notifications"],
  ["Security", ShieldCheck, "#security"],
  ["Settings", Settings, "#settings"],
] as const;

function initials(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) return "SO";

  return parts
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function normalizeDate(value: string) {
  return value.includes("T")
    ? value
    : `${value.replace(" ", "T")}Z`;
}

function formatDate(value: string | null, locale = "uz") {
  if (!value) return "No expiry";

  const date = new Date(normalizeDate(value));

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const locales: Record<string, string> = {
    uz: "uz-UZ",
    en: "en-US",
    ru: "ru-RU",
    tr: "tr-TR",
    ar: "ar",
  };

  return new Intl.DateTimeFormat(locales[locale] ?? "uz-UZ", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatMoney(value: number, currency: string) {
  return `${new Intl.NumberFormat("uz-UZ").format(value)} ${currency}`;
}

function projectProgress(value: number) {
  return Math.max(0, Math.min(100, Number(value) || 0));
}

function milestoneClass(status: string) {
  const state = status.toUpperCase();

  if (
    state === "DONE" ||
    state === "COMPLETED" ||
    state === "COMPLETE"
  ) {
    return "done";
  }

  if (
    state === "ACTIVE" ||
    state === "CURRENT" ||
    state === "IN_PROGRESS" ||
    state === "DEVELOPMENT"
  ) {
    return "active";
  }

  return undefined;
}

function productHref(kind: string, slug: string) {
  return kind.toUpperCase() === "GAME"
    ? `/games/${slug}`
    : `/products/${slug}`;
}

export default async function AccountPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="authWrap">
        <div className="authCard surface">
          <ShieldCheck size={34} />
          <span className="eyebrow">SYSONE ID</span>
          <h1>Sign in to your SysOne account.</h1>
          <p>
            Products, games, licenses, downloads, projects and security
            sessions are available after authentication.
          </p>

          <Link className="button buttonPrimary" href="/login">
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  const account = await getAccountData(user.id);

  const products = account.products.filter(
    (product) => product.kind.toUpperCase() !== "GAME",
  );

  const games = account.products.filter(
    (product) => product.kind.toUpperCase() === "GAME",
  );

  const downloadableProducts = account.products.filter(
    (product) =>
      product.accessState === "ACTIVE" &&
      product.downloadCount > 0,
  );

  const activeProjects = account.projects.filter(
    (project) =>
      !["DONE", "COMPLETED", "CANCELLED", "ARCHIVED"].includes(
        project.status.toUpperCase(),
      ),
  );

  const unreadNotifications = account.notifications.filter(
    (notification) => !notification.readAt,
  );

  return (
    <div className="dashboardWrap">
      <div className="shell dashboardShell">
        <aside className="dashboardNav surface">
          <div className="dashboardUser">
            <div className="avatar">{initials(user.name)}</div>

            <span>
              <strong>{user.name}</strong>
              <small>{user.email ?? "SysOne ID"}</small>
            </span>
          </div>

          {nav.map(([label, Icon, href], index) => (
            <Link
              className={`dashboardNavLink ${
                index === 0 ? "active" : ""
              }`}
              href={href}
              key={label}
            >
              <Icon size={17} />
              {label}
            </Link>
          ))}
        </aside>

        <section className="dashboardMain">
          <div className="dashboardTop" id="overview">
            <div>
              <span className="eyebrow">SYSONE ID</span>
              <h1>Welcome, {user.name}.</h1>
            </div>

            <Link
              className="button buttonGhost"
              href="/marketplace"
            >
              Explore marketplace
            </Link>
          </div>

          <div className="dashboardStats">
            <article className="surface">
              <Box />
              <span>
                <small>Products</small>
                <strong>{account.summary.products}</strong>
              </span>
            </article>

            <article className="surface">
              <Gamepad2 />
              <span>
                <small>Games</small>
                <strong>{account.summary.games}</strong>
              </span>
            </article>

            <article className="surface">
              <FileText />
              <span>
                <small>Projects</small>
                <strong>{account.summary.projects}</strong>
              </span>
            </article>

            <article className="surface">
              <MonitorSmartphone />
              <span>
                <small>Active sessions</small>
                <strong>{account.summary.activeSessions}</strong>
              </span>
            </article>
          </div>

          <div className="dashboardColumns">
            <article
              className="surface dashboardPanel"
              id="projects"
            >
              <div className="panelHead">
                <div>
                  <span className="eyebrow">MY PROJECTS</span>
                  <h2>Active work</h2>
                </div>

                <span>{activeProjects.length}</span>
              </div>

              {activeProjects.length === 0 ? (
                <div className="accountEmpty">
                  <FileText size={20} />
                  <span>
                    <strong>No active projects</strong>
                    <small>
                      New SysOne projects will appear here.
                    </small>
                  </span>
                </div>
              ) : (
                activeProjects.map((project) => (
                  <div
                    className="projectProgress"
                    key={project.id}
                  >
                    <div>
                      <span>
                        <strong>{project.title}</strong>
                        <small>
                          {project.projectType ??
                            "SysOne project"}
                        </small>
                      </span>

                      <em>{project.status}</em>
                    </div>

                    <div className="progressTrack">
                      <i
                        style={{
                          width: `${projectProgress(
                            project.progress,
                          )}%`,
                        }}
                      />
                    </div>

                    {project.milestones.length > 0 && (
                      <div className="milestones">
                        {project.milestones.map((milestone) => (
                          <span
                            className={milestoneClass(
                              milestone.status,
                            )}
                            key={milestone.id}
                          >
                            {milestone.title}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </article>

            <article
              className="surface dashboardPanel"
              id="products"
            >
              <div className="panelHead">
                <div>
                  <span className="eyebrow">PRODUCTS</span>
                  <h2>My products</h2>
                </div>
              </div>

              {products.length === 0 ? (
                <div className="accountEmpty">
                  <Box size={20} />
                  <span>
                    <strong>No products yet</strong>
                    <small>
                      Acquired products will appear here.
                    </small>
                  </span>
                </div>
              ) : (
                products.map((product) => (
                  <div
                    className="miniProduct"
                    key={product.entitlementId}
                  >
                    <span className="miniIcon">
                      {product.name.charAt(0)}
                    </span>

                    <span>
                      <strong>{product.name}</strong>
                      <small>
                        {product.accessState} ·{" "}
                        {product.productStatus}
                      </small>
                    </span>

                    <Link
                      href={productHref(
                        product.kind,
                        product.slug,
                      )}
                    >
                      Open
                    </Link>
                  </div>
                ))
              )}
            </article>
          </div>

          <article
            className="surface dashboardPanel accountSection"
            id="games"
          >
            <div className="panelHead">
              <div>
                <span className="eyebrow">SYSONE GAMES</span>
                <h2>My games</h2>
              </div>

              <span>{games.length}</span>
            </div>

            {games.length === 0 ? (
              <div className="accountEmpty">
                <Gamepad2 size={20} />
                <span>
                  <strong>No games yet</strong>
                  <small>
                    Your SysOne Games library will appear here.
                  </small>
                </span>
              </div>
            ) : (
              <div className="accountGrid">
                {games.map((game) => (
                  <div
                    className="accountItem"
                    key={game.entitlementId}
                  >
                    <Gamepad2 size={20} />

                    <span>
                      <strong>{game.name}</strong>
                      <small>
                        {game.accessState} · {game.productStatus}
                      </small>
                    </span>

                    <Link
                      href={productHref(game.kind, game.slug)}
                    >
                      Open
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </article>

          <article
            className="surface dashboardPanel accountSection"
            id="orders"
          >
            <div className="panelHead">
              <div>
                <span className="eyebrow">ORDERS</span>
                <h2>Order history</h2>
              </div>

              <span>{account.summary.orders}</span>
            </div>

            {account.orders.length === 0 ? (
              <div className="accountEmpty">
                <PackageCheck size={20} />
                <span>
                  <strong>No orders</strong>
                  <small>
                    Marketplace orders will appear here.
                  </small>
                </span>
              </div>
            ) : (
              <div className="accountList">
                {account.orders.map((order) => (
                  <div className="accountRow" key={order.id}>
                    <span>
                      <strong>{order.id}</strong>
                      <small>
                        {order.itemCount} item
                        {order.itemCount === 1 ? "" : "s"} ·{" "}
                        {formatDate(
                          order.createdAt,
                          user.locale,
                        )}
                      </small>
                    </span>

                    <span>
                      <strong>
                        {formatMoney(
                          order.totalMinor,
                          order.currency,
                        )}
                      </strong>
                      <small>{order.status}</small>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </article>

          <article
            className="surface dashboardPanel accountSection"
            id="downloads"
          >
            <div className="panelHead">
              <div>
                <span className="eyebrow">DOWNLOADS</span>
                <h2>Available downloads</h2>
              </div>

              <span>{downloadableProducts.length}</span>
            </div>

            {downloadableProducts.length === 0 ? (
              <div className="accountEmpty">
                <Download size={20} />
                <span>
                  <strong>No downloads available</strong>
                  <small>
                    Published files available to your account will
                    appear here.
                  </small>
                </span>
              </div>
            ) : (
              <div className="accountGrid">
                {downloadableProducts.map((product) => (
                  <div
                    className="accountItem"
                    key={product.entitlementId}
                  >
                    <Download size={20} />

                    <span>
                      <strong>{product.name}</strong>
                      <small>
                        {product.downloadCount} published file
                        {product.downloadCount === 1 ? "" : "s"}
                      </small>
                    </span>

                    <Link
                      href={productHref(
                        product.kind,
                        product.slug,
                      )}
                    >
                      View
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </article>

          <article
            className="surface dashboardPanel accountSection"
            id="licenses"
          >
            <div className="panelHead">
              <div>
                <span className="eyebrow">LICENSES</span>
                <h2>License & device access</h2>
              </div>

              <span>{account.summary.licenses}</span>
            </div>

            {account.licenses.length === 0 ? (
              <div className="accountEmpty">
                <KeyRound size={20} />
                <span>
                  <strong>No licenses</strong>
                  <small>
                    Product licenses assigned to your SysOne ID
                    will appear here.
                  </small>
                </span>
              </div>
            ) : (
              <div className="accountList">
                {account.licenses.map((license) => (
                  <div
                    className="licenseCard"
                    key={license.id}
                  >
                    <div className="accountRow">
                      <span>
                        <strong>{license.productName}</strong>
                        <small>
                          License ID: {license.id}
                        </small>
                      </span>

                      <span>
                        <strong>{license.status}</strong>
                        <small>
                          {license.activeDevices}/
                          {license.deviceLimit} devices
                        </small>
                      </span>
                    </div>

                    <div className="licenseMeta">
                      <span>
                        Expires:{" "}
                        {formatDate(
                          license.expiresAt,
                          user.locale,
                        )}
                      </span>
                    </div>

                    {license.devices.length > 0 && (
                      <div className="deviceList">
                        {license.devices.map((device) => (
                          <div
                            className="deviceRow"
                            key={device.id}
                          >
                            <MonitorSmartphone size={16} />

                            <span>
                              <strong>
                                {device.label ??
                                  "SysOne device"}
                              </strong>
                              <small>
                                Last seen:{" "}
                                {formatDate(
                                  device.lastSeenAt ??
                                    device.activatedAt,
                                  user.locale,
                                )}
                              </small>
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </article>

          <article
            className="surface dashboardPanel accountSection"
            id="saved"
          >
            <div className="panelHead">
              <div>
                <span className="eyebrow">SAVED</span>
                <h2>Saved products</h2>
              </div>

              <span>{account.summary.saved}</span>
            </div>

            {account.saved.length === 0 ? (
              <div className="accountEmpty">
                <Heart size={20} />
                <span>
                  <strong>Nothing saved</strong>
                  <small>
                    Products saved for later will appear here.
                  </small>
                </span>
              </div>
            ) : (
              <div className="accountGrid">
                {account.saved.map((product) => (
                  <div
                    className="accountItem"
                    key={product.productId}
                  >
                    <Heart size={18} />

                    <span>
                      <strong>{product.name}</strong>
                      <small>{product.status}</small>
                    </span>

                    <Link
                      href={productHref(
                        product.kind,
                        product.slug,
                      )}
                    >
                      Open
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </article>

          <article
            className="surface dashboardPanel accountSection"
            id="support"
          >
            <div className="panelHead">
              <div>
                <span className="eyebrow">SUPPORT</span>
                <h2>Support tickets</h2>
              </div>

              <span>
                {account.summary.openSupportTickets} open
              </span>
            </div>

            {account.supportTickets.length === 0 ? (
              <div className="accountEmpty">
                <LifeBuoy size={20} />
                <span>
                  <strong>No support tickets</strong>
                  <small>
                    Your conversations with SysOne support will
                    appear here.
                  </small>
                </span>
              </div>
            ) : (
              <div className="accountList">
                {account.supportTickets.map((ticket) => (
                  <div
                    className="accountRow"
                    key={ticket.id}
                  >
                    <span>
                      <strong>{ticket.subject}</strong>
                      <small>
                        {ticket.productName ??
                          ticket.category ??
                          "General support"}
                      </small>
                    </span>

                    <span>
                      <strong>{ticket.status}</strong>
                      <small>{ticket.priority}</small>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </article>

          <article
            className="surface dashboardPanel accountSection"
            id="notifications"
          >
            <div className="panelHead">
              <div>
                <span className="eyebrow">NOTIFICATIONS</span>
                <h2>Account activity</h2>
              </div>

              <span>{unreadNotifications.length} unread</span>
            </div>

            {account.notifications.length === 0 ? (
              <div className="accountEmpty">
                <Bell size={20} />
                <span>
                  <strong>No notifications</strong>
                  <small>
                    Important SysOne account updates will appear
                    here.
                  </small>
                </span>
              </div>
            ) : (
              <div className="accountList">
                {account.notifications.map((notification) => (
                  <div
                    className={`accountRow ${
                      notification.readAt
                        ? ""
                        : "accountRowUnread"
                    }`}
                    key={notification.id}
                  >
                    <span>
                      <strong>{notification.title}</strong>
                      <small>
                        {notification.body ??
                          notification.type}
                      </small>
                    </span>

                    <span>
                      <small>
                        {formatDate(
                          notification.createdAt,
                          user.locale,
                        )}
                      </small>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </article>

          <article
            className="surface dashboardPanel accountSection"
            id="security"
          >
            <div className="panelHead">
              <div>
                <span className="eyebrow">SECURITY</span>
                <h2>Sessions & connected accounts</h2>
              </div>

              <ShieldCheck size={20} />
            </div>

            <div className="securitySummary">
              <span>
                <strong>{account.summary.activeSessions}</strong>
                <small>Active sessions</small>
              </span>

              <span>
                <strong>{account.identities.length}</strong>
                <small>Connected providers</small>
              </span>

              <span>
                <strong>{account.summary.devices}</strong>
                <small>Licensed devices</small>
              </span>
            </div>

            <div className="accountSecurityColumns">
              <div>
                <strong>Sessions</strong>

                {account.sessions.length === 0 ? (
                  <small>No sessions found.</small>
                ) : (
                  account.sessions.map((session) => (
                    <div
                      className="securityItem"
                      key={session.id}
                    >
                      <MonitorSmartphone size={16} />

                      <span>
                        <strong>
                          {session.deviceLabel ??
                            "SysOne session"}
                        </strong>
                        <small>
                          {session.state} · expires{" "}
                          {formatDate(
                            session.expiresAt,
                            user.locale,
                          )}
                        </small>
                      </span>
                    </div>
                  ))
                )}
              </div>

              <div>
                <strong>Connected accounts</strong>

                {account.identities.length === 0 ? (
                  <small>
                    No external identity provider connected.
                  </small>
                ) : (
                  account.identities.map((identity) => (
                    <div
                      className="securityItem"
                      key={identity.id}
                    >
                      <ShieldCheck size={16} />

                      <span>
                        <strong>{identity.provider}</strong>
                        <small>
                          {identity.username
                            ? `@${identity.username}`
                            : `Connected ${formatDate(
                                identity.createdAt,
                                user.locale,
                              )}`}
                        </small>
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </article>

          <article
            className="surface dashboardPanel accountSection"
            id="settings"
          >
            <div className="panelHead">
              <div>
                <span className="eyebrow">SETTINGS</span>
                <h2>SysOne ID profile</h2>
              </div>

              <Settings size={20} />
            </div>

            <div className="accountProfileGrid">
              <span>
                <small>Name</small>
                <strong>{user.name}</strong>
              </span>

              <span>
                <small>Email</small>
                <strong>{user.email ?? "Not provided"}</strong>
              </span>

              <span>
                <small>Language</small>
                <strong>{user.locale.toUpperCase()}</strong>
              </span>

              <span>
                <small>Role</small>
                <strong>{user.role}</strong>
              </span>

              <span>
                <small>Member since</small>
                <strong>
                  {formatDate(user.created_at, user.locale)}
                </strong>
              </span>
            </div>
          </article>

          <div className="securityBanner surface">
            <ShieldCheck />

            <div>
              <strong>SysOne ID security</strong>
              <p>
                {account.summary.activeSessions} active session
                {account.summary.activeSessions === 1 ? "" : "s"},{" "}
                {account.identities.length} connected account
                {account.identities.length === 1 ? "" : "s"} and{" "}
                {account.summary.devices} licensed device
                {account.summary.devices === 1 ? "" : "s"} are
                currently associated with this account.
              </p>
            </div>

            <Link
              className="button buttonGhost"
              href="#security"
            >
              Security
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}