import { getSysOneEnv, requireBinding } from "@/lib/server/cloudflare";

export type HomeUiConfig = {
  overline: string;
  titleLine1: string;
  titleLine2: string;
  description: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
  showAnnouncementBar: boolean;
  announcementSpeed: number;
  showWebApps: boolean;
  showWebGames: boolean;
  showRuntimeBand: boolean;
};

export type DockUiItem = {
  key: string;
  label: string;
  href: string;
  icon: string;
  enabled: boolean;
};

export const DEFAULT_HOME: HomeUiConfig = {
  overline: "SYSONE / DIGITAL PRODUCTS",
  titleLine1: "Yuklab oling.",
  titleLine2: "Yoki shu yerning o'zida ishlating.",
  description:
    "Dasturlar, web ilovalar, o'yinlar va AI vositalari. SysOne mahsulotlari bitta katalog, bitta akkaunt va bitta boshqaruv tizimida.",
  primaryLabel: "Katalogni ochish",
  primaryHref: "/marketplace",
  secondaryLabel: "O'yinlar",
  secondaryHref: "/games",
  showAnnouncementBar: true,
  announcementSpeed: 34,
  showWebApps: true,
  showWebGames: true,
  showRuntimeBand: true,
};

export const DEFAULT_DOCK: DockUiItem[] = [
  { key: "home", label: "Home", href: "/", icon: "home", enabled: true },
  { key: "store", label: "Do'kon", href: "/marketplace", icon: "store", enabled: true },
  { key: "apps", label: "Dasturlar", href: "/products", icon: "apps", enabled: true },
  { key: "games", label: "O'yinlar", href: "/games", icon: "games", enabled: true },
  { key: "ai", label: "AI", href: "/ai", icon: "ai", enabled: true },
  { key: "account", label: "Hisob", href: "/account", icon: "account", enabled: true },
];

function db() {
  return requireBinding(getSysOneEnv().SYSONE_DB, "SYSONE_DB");
}

function object(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function bool(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function text(value: unknown, fallback: string, max = 600) {
  return typeof value === "string" && value.trim()
    ? value.trim().slice(0, max)
    : fallback;
}

function localHref(value: unknown, fallback: string) {
  if (typeof value !== "string") return fallback;
  const v = value.trim();
  return v.startsWith("/") && !v.startsWith("//") ? v.slice(0, 300) : fallback;
}

function normalizeHome(raw: unknown): HomeUiConfig {
  const r = object(raw);
  const speed = Number(r.announcementSpeed);
  return {
    overline: text(r.overline, DEFAULT_HOME.overline, 100),
    titleLine1: text(r.titleLine1, DEFAULT_HOME.titleLine1, 140),
    titleLine2: text(r.titleLine2, DEFAULT_HOME.titleLine2, 180),
    description: text(r.description, DEFAULT_HOME.description, 700),
    primaryLabel: text(r.primaryLabel, DEFAULT_HOME.primaryLabel, 60),
    primaryHref: localHref(r.primaryHref, DEFAULT_HOME.primaryHref),
    secondaryLabel: text(r.secondaryLabel, DEFAULT_HOME.secondaryLabel, 60),
    secondaryHref: localHref(r.secondaryHref, DEFAULT_HOME.secondaryHref),
    showAnnouncementBar: bool(r.showAnnouncementBar, DEFAULT_HOME.showAnnouncementBar),
    announcementSpeed:
      Number.isFinite(speed) && speed >= 10 && speed <= 120
        ? speed
        : DEFAULT_HOME.announcementSpeed,
    showWebApps: bool(r.showWebApps, DEFAULT_HOME.showWebApps),
    showWebGames: bool(r.showWebGames, DEFAULT_HOME.showWebGames),
    showRuntimeBand: bool(r.showRuntimeBand, DEFAULT_HOME.showRuntimeBand),
  };
}

function normalizeDock(raw: unknown): DockUiItem[] {
  const r = object(raw);
  if (!Array.isArray(r.items)) return DEFAULT_DOCK;

  const allowedIcons = new Set([
    "home", "store", "apps", "games", "ai", "account", "support", "web",
  ]);

  const items = r.items
    .slice(0, 8)
    .map((item, index) => {
      const x = object(item);
      const href = localHref(x.href, "");
      if (!href) return null;

      const icon =
        typeof x.icon === "string" && allowedIcons.has(x.icon)
          ? x.icon
          : "apps";

      return {
        key:
          typeof x.key === "string" && /^[a-z0-9_-]{1,40}$/i.test(x.key)
            ? x.key
            : `item-${index + 1}`,
        label: text(x.label, `Item ${index + 1}`, 30),
        href,
        icon,
        enabled: bool(x.enabled, true),
      } satisfies DockUiItem;
    })
    .filter((item): item is DockUiItem => Boolean(item));

  return items.length ? items : DEFAULT_DOCK;
}

export async function getPublicUiConfig() {
  try {
    const result = await db()
      .prepare("SELECT key,value_json FROM platform_settings WHERE key IN ('home','dock')")
      .all<{ key: string; value_json: string }>();

    const map = new Map<string, unknown>();

    for (const row of result.results ?? []) {
      try {
        map.set(row.key, JSON.parse(row.value_json));
      } catch {}
    }

    return {
      home: normalizeHome(map.get("home")),
      dock: normalizeDock(map.get("dock")),
    };
  } catch (error) {
    console.warn("Public UI settings fallback", error);
    return { home: DEFAULT_HOME, dock: DEFAULT_DOCK };
  }
}
