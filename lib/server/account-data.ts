import { getSysOneEnv, requireBinding } from "@/lib/server/cloudflare";

export type AccountProduct = {
  entitlementId: string;
  productId: string;
  slug: string;
  name: string;
  kind: string;
  category: string | null;
  productStatus: string;
  pricingModel: string;
  entitlementStatus: string;
  accessState: string;
  startsAt: string;
  endsAt: string | null;
  downloadCount: number;
};

export type AccountLicenseDevice = {
  id: string;
  licenseId: string;
  label: string | null;
  activatedAt: string;
  lastSeenAt: string | null;
};

export type AccountLicense = {
  id: string;
  entitlementId: string;
  productId: string;
  productSlug: string;
  productName: string;
  deviceLimit: number;
  activeDevices: number;
  status: string;
  expiresAt: string | null;
  createdAt: string;
  devices: AccountLicenseDevice[];
};

export type AccountProjectMilestone = {
  id: string;
  projectId: string;
  title: string;
  status: string;
  sortOrder: number;
};

export type AccountProject = {
  id: string;
  title: string;
  projectType: string | null;
  description: string | null;
  status: string;
  progress: number;
  createdAt: string;
  updatedAt: string;
  milestones: AccountProjectMilestone[];
};

export type AccountOrder = {
  id: string;
  status: string;
  totalMinor: number;
  currency: string;
  itemCount: number;
  paymentProvider: string | null;
  createdAt: string;
  paidAt: string | null;
};

export type AccountSession = {
  id: string;
  deviceLabel: string | null;
  expiresAt: string;
  createdAt: string;
  state: "ACTIVE" | "EXPIRED";
};

export type AccountIdentity = {
  id: string;
  provider: string;
  username: string | null;
  createdAt: string;
};

export type AccountSavedProduct = {
  productId: string;
  slug: string;
  name: string;
  kind: string;
  status: string;
  createdAt: string;
};

export type AccountNotification = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  readAt: string | null;
  createdAt: string;
};

export type AccountSupportTicket = {
  id: string;
  productId: string | null;
  productName: string | null;
  category: string | null;
  priority: string;
  status: string;
  subject: string;
  createdAt: string;
  updatedAt: string;
};

export type AccountData = {
  summary: {
    products: number;
    games: number;
    projects: number;
    orders: number;
    licenses: number;
    devices: number;
    saved: number;
    unreadNotifications: number;
    openSupportTickets: number;
    activeSessions: number;
  };
  products: AccountProduct[];
  licenses: AccountLicense[];
  projects: AccountProject[];
  orders: AccountOrder[];
  sessions: AccountSession[];
  identities: AccountIdentity[];
  saved: AccountSavedProduct[];
  notifications: AccountNotification[];
  supportTickets: AccountSupportTicket[];
};

type ProductRow = {
  entitlement_id: string;
  product_id: string;
  slug: string;
  name: string;
  kind: string;
  category: string | null;
  product_status: string;
  pricing_model: string;
  entitlement_status: string;
  access_state: string;
  starts_at: string;
  ends_at: string | null;
  download_count: number;
};

type LicenseRow = {
  id: string;
  entitlement_id: string;
  product_id: string;
  product_slug: string;
  product_name: string;
  device_limit: number;
  active_devices: number;
  status: string;
  expires_at: string | null;
  created_at: string;
};

type DeviceRow = {
  id: string;
  license_id: string;
  label: string | null;
  activated_at: string;
  last_seen_at: string | null;
};

type ProjectRow = {
  id: string;
  title: string;
  project_type: string | null;
  description: string | null;
  status: string;
  progress: number;
  created_at: string;
  updated_at: string;
};

type MilestoneRow = {
  id: string;
  project_id: string;
  title: string;
  status: string;
  sort_order: number;
};

type OrderRow = {
  id: string;
  status: string;
  total_minor: number;
  currency: string;
  item_count: number;
  payment_provider: string | null;
  created_at: string;
  paid_at: string | null;
};

type SessionRow = {
  id: string;
  device_label: string | null;
  expires_at: string;
  created_at: string;
  state: "ACTIVE" | "EXPIRED";
};

type IdentityRow = {
  id: string;
  provider: string;
  username: string | null;
  created_at: string;
};

type SavedRow = {
  product_id: string;
  slug: string;
  name: string;
  kind: string;
  status: string;
  created_at: string;
};

type NotificationRow = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  read_at: string | null;
  created_at: string;
};

type SupportTicketRow = {
  id: string;
  product_id: string | null;
  product_name: string | null;
  category: string | null;
  priority: string;
  status: string;
  subject: string;
  created_at: string;
  updated_at: string;
};

function getDb() {
  return requireBinding(getSysOneEnv().SYSONE_DB, "SYSONE_DB");
}

function normalizeUserId(userId: string) {
  const normalized = userId.trim().slice(0, 160);

  if (!normalized) {
    throw new Error("user_id_required");
  }

  return normalized;
}

export async function getAccountData(userId: string): Promise<AccountData> {
  const id = normalizeUserId(userId);
  const db = getDb();

  const [
    productResult,
    licenseResult,
    deviceResult,
    projectResult,
    milestoneResult,
    orderResult,
    sessionResult,
    identityResult,
    savedResult,
    notificationResult,
    supportResult,
  ] = await Promise.all([
    db
      .prepare(
        `
          SELECT
            e.id AS entitlement_id,
            p.id AS product_id,
            p.slug,
            p.name,
            p.kind,
            p.category,
            p.status AS product_status,
            p.pricing_model,
            e.status AS entitlement_status,
            CASE
              WHEN e.status != 'ACTIVE' THEN e.status
              WHEN datetime(e.starts_at) > datetime('now') THEN 'PENDING'
              WHEN e.ends_at IS NOT NULL
                AND datetime(e.ends_at) <= datetime('now') THEN 'EXPIRED'
              ELSE 'ACTIVE'
            END AS access_state,
            e.starts_at,
            e.ends_at,
            (
              SELECT COUNT(*)
              FROM product_files pf
              JOIN product_versions pv
                ON pv.id = pf.product_version_id
              WHERE
                pv.product_id = p.id
                AND pv.published_at IS NOT NULL
            ) AS download_count
          FROM entitlements e
          JOIN products p ON p.id = e.product_id
          WHERE e.user_id = ?
          ORDER BY e.starts_at DESC, p.name ASC
        `,
      )
      .bind(id)
      .all<ProductRow>(),

    db
      .prepare(
        `
          SELECT
            l.id,
            l.entitlement_id,
            e.product_id,
            p.slug AS product_slug,
            p.name AS product_name,
            l.device_limit,
            COUNT(ld.id) AS active_devices,
            l.status,
            l.expires_at,
            l.created_at
          FROM licenses l
          JOIN entitlements e ON e.id = l.entitlement_id
          JOIN products p ON p.id = e.product_id
          LEFT JOIN license_devices ld ON ld.license_id = l.id
          WHERE e.user_id = ?
          GROUP BY
            l.id,
            l.entitlement_id,
            e.product_id,
            p.slug,
            p.name,
            l.device_limit,
            l.status,
            l.expires_at,
            l.created_at
          ORDER BY l.created_at DESC
        `,
      )
      .bind(id)
      .all<LicenseRow>(),

    db
      .prepare(
        `
          SELECT
            ld.id,
            ld.license_id,
            ld.label,
            ld.activated_at,
            ld.last_seen_at
          FROM license_devices ld
          JOIN licenses l ON l.id = ld.license_id
          JOIN entitlements e ON e.id = l.entitlement_id
          WHERE e.user_id = ?
          ORDER BY
            COALESCE(ld.last_seen_at, ld.activated_at) DESC
        `,
      )
      .bind(id)
      .all<DeviceRow>(),

    db
      .prepare(
        `
          SELECT
            id,
            title,
            project_type,
            description,
            status,
            progress,
            created_at,
            updated_at
          FROM projects
          WHERE user_id = ?
          ORDER BY updated_at DESC, created_at DESC
        `,
      )
      .bind(id)
      .all<ProjectRow>(),

    db
      .prepare(
        `
          SELECT
            pm.id,
            pm.project_id,
            pm.title,
            pm.status,
            pm.sort_order
          FROM project_milestones pm
          JOIN projects p ON p.id = pm.project_id
          WHERE p.user_id = ?
          ORDER BY pm.project_id, pm.sort_order ASC, pm.id ASC
        `,
      )
      .bind(id)
      .all<MilestoneRow>(),

    db
      .prepare(
        `
          SELECT
            o.id,
            o.status,
            o.total_minor,
            o.currency,
            COUNT(oi.id) AS item_count,
            o.payment_provider,
            o.created_at,
            o.paid_at
          FROM orders o
          LEFT JOIN order_items oi ON oi.order_id = o.id
          WHERE o.user_id = ?
          GROUP BY
            o.id,
            o.status,
            o.total_minor,
            o.currency,
            o.payment_provider,
            o.created_at,
            o.paid_at
          ORDER BY o.created_at DESC
          LIMIT 50
        `,
      )
      .bind(id)
      .all<OrderRow>(),

    db
      .prepare(
        `
          SELECT
            id,
            device_label,
            expires_at,
            created_at,
            CASE
              WHEN datetime(expires_at) > datetime('now')
                THEN 'ACTIVE'
              ELSE 'EXPIRED'
            END AS state
          FROM sessions
          WHERE user_id = ?
          ORDER BY created_at DESC
        `,
      )
      .bind(id)
      .all<SessionRow>(),

    db
      .prepare(
        `
          SELECT
            id,
            provider,
            username,
            created_at
          FROM auth_accounts
          WHERE user_id = ?
          ORDER BY created_at ASC
        `,
      )
      .bind(id)
      .all<IdentityRow>(),

    db
      .prepare(
        `
          SELECT
            w.product_id,
            p.slug,
            p.name,
            p.kind,
            p.status,
            w.created_at
          FROM wishlists w
          JOIN products p ON p.id = w.product_id
          WHERE w.user_id = ?
          ORDER BY w.created_at DESC
        `,
      )
      .bind(id)
      .all<SavedRow>(),

    db
      .prepare(
        `
          SELECT
            id,
            type,
            title,
            body,
            read_at,
            created_at
          FROM notifications
          WHERE user_id = ?
          ORDER BY created_at DESC
          LIMIT 50
        `,
      )
      .bind(id)
      .all<NotificationRow>(),

    db
      .prepare(
        `
          SELECT
            t.id,
            t.product_id,
            p.name AS product_name,
            t.category,
            t.priority,
            t.status,
            t.subject,
            t.created_at,
            t.updated_at
          FROM support_tickets t
          LEFT JOIN products p ON p.id = t.product_id
          WHERE t.user_id = ?
          ORDER BY t.updated_at DESC, t.created_at DESC
          LIMIT 50
        `,
      )
      .bind(id)
      .all<SupportTicketRow>(),
  ]);

  const products: AccountProduct[] = (productResult.results ?? []).map(
    (row: ProductRow) => ({
      entitlementId: row.entitlement_id,
      productId: row.product_id,
      slug: row.slug,
      name: row.name,
      kind: row.kind,
      category: row.category,
      productStatus: row.product_status,
      pricingModel: row.pricing_model,
      entitlementStatus: row.entitlement_status,
      accessState: row.access_state,
      startsAt: row.starts_at,
      endsAt: row.ends_at,
      downloadCount: Number(row.download_count ?? 0),
    }),
  );

  const devices: AccountLicenseDevice[] = (
    deviceResult.results ?? []
  ).map((row: DeviceRow) => ({
    id: row.id,
    licenseId: row.license_id,
    label: row.label,
    activatedAt: row.activated_at,
    lastSeenAt: row.last_seen_at,
  }));

  const devicesByLicense = new Map<string, AccountLicenseDevice[]>();

  for (const device of devices) {
    const current = devicesByLicense.get(device.licenseId) ?? [];
    current.push(device);
    devicesByLicense.set(device.licenseId, current);
  }

  const licenses: AccountLicense[] = (
    licenseResult.results ?? []
  ).map((row: LicenseRow) => ({
    id: row.id,
    entitlementId: row.entitlement_id,
    productId: row.product_id,
    productSlug: row.product_slug,
    productName: row.product_name,
    deviceLimit: Number(row.device_limit ?? 0),
    activeDevices: Number(row.active_devices ?? 0),
    status: row.status,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    devices: devicesByLicense.get(row.id) ?? [],
  }));

  const milestonesByProject = new Map<
    string,
    AccountProjectMilestone[]
  >();

  for (const row of milestoneResult.results ?? []) {
    const milestone: AccountProjectMilestone = {
      id: row.id,
      projectId: row.project_id,
      title: row.title,
      status: row.status,
      sortOrder: Number(row.sort_order ?? 0),
    };

    const current =
      milestonesByProject.get(row.project_id) ?? [];

    current.push(milestone);
    milestonesByProject.set(row.project_id, current);
  }

  const projects: AccountProject[] = (
    projectResult.results ?? []
  ).map((row: ProjectRow) => ({
    id: row.id,
    title: row.title,
    projectType: row.project_type,
    description: row.description,
    status: row.status,
    progress: Number(row.progress ?? 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    milestones: milestonesByProject.get(row.id) ?? [],
  }));

  const orders: AccountOrder[] = (
    orderResult.results ?? []
  ).map((row: OrderRow) => ({
    id: row.id,
    status: row.status,
    totalMinor: Number(row.total_minor ?? 0),
    currency: row.currency,
    itemCount: Number(row.item_count ?? 0),
    paymentProvider: row.payment_provider,
    createdAt: row.created_at,
    paidAt: row.paid_at,
  }));

  const sessions: AccountSession[] = (
    sessionResult.results ?? []
  ).map((row: SessionRow) => ({
    id: row.id,
    deviceLabel: row.device_label,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    state: row.state,
  }));

  const identities: AccountIdentity[] = (
    identityResult.results ?? []
  ).map((row: IdentityRow) => ({
    id: row.id,
    provider: row.provider,
    username: row.username,
    createdAt: row.created_at,
  }));

  const saved: AccountSavedProduct[] = (
    savedResult.results ?? []
  ).map((row: SavedRow) => ({
    productId: row.product_id,
    slug: row.slug,
    name: row.name,
    kind: row.kind,
    status: row.status,
    createdAt: row.created_at,
  }));

  const notifications: AccountNotification[] = (
    notificationResult.results ?? []
  ).map((row: NotificationRow) => ({
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    readAt: row.read_at,
    createdAt: row.created_at,
  }));

  const supportTickets: AccountSupportTicket[] = (
    supportResult.results ?? []
  ).map((row: SupportTicketRow) => ({
    id: row.id,
    productId: row.product_id,
    productName: row.product_name,
    category: row.category,
    priority: row.priority,
    status: row.status,
    subject: row.subject,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));

  const accessibleProducts = products.filter(
    (product) => product.accessState === "ACTIVE",
  );

  return {
    summary: {
      products: accessibleProducts.length,
      games: accessibleProducts.filter(
        (product) => product.kind.toUpperCase() === "GAME",
      ).length,
      projects: projects.length,
      orders: orders.length,
      licenses: licenses.length,
      devices: devices.length,
      saved: saved.length,
      unreadNotifications: notifications.filter(
        (notification) => !notification.readAt,
      ).length,
      openSupportTickets: supportTickets.filter(
        (ticket) =>
          !["CLOSED", "RESOLVED"].includes(
            ticket.status.toUpperCase(),
          ),
      ).length,
      activeSessions: sessions.filter(
        (session) => session.state === "ACTIVE",
      ).length,
    },
    products,
    licenses,
    projects,
    orders,
    sessions,
    identities,
    saved,
    notifications,
    supportTickets,
  };
}
