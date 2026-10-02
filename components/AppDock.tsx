"use client";

import Link from "next/link";
import {
  AppWindow,
  CircleUserRound,
  Gamepad2,
  Globe2,
  House,
  LifeBuoy,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type DockItem = {
  key: string;
  label: string;
  href: string;
  icon: string;
  enabled: boolean;
};

const DEFAULT_ITEMS: DockItem[] = [
  { key: "home", label: "Home", href: "/", icon: "home", enabled: true },
  { key: "store", label: "DoвЂkon", href: "/marketplace", icon: "store", enabled: true },
  { key: "apps", label: "Dasturlar", href: "/products", icon: "apps", enabled: true },
  { key: "games", label: "OвЂyinlar", href: "/games", icon: "games", enabled: true },
  { key: "ai", label: "AI", href: "/ai", icon: "ai", enabled: true },
  { key: "account", label: "Hisob", href: "/account", icon: "account", enabled: true },
];

const ICONS: Record<string, typeof House> = {
  home: House,
  store: ShoppingBag,
  apps: AppWindow,
  games: Gamepad2,
  ai: Sparkles,
  account: CircleUserRound,
  support: LifeBuoy,
  web: Globe2,
};

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function AppDock() {
  const pathname = usePathname();
  const [items, setItems] = useState<DockItem[]>(DEFAULT_ITEMS);

  useEffect(() => {
    let alive = true;
    fetch("/api/ui-config", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data) => {
        if (alive && Array.isArray(data.dock)) setItems(data.dock);
      })
      .catch(() => {
        if (alive) setItems(DEFAULT_ITEMS);
      });
    return () => {
      alive = false;
    };
  }, []);

  const visible = useMemo(() => items.filter((item) => item.enabled).slice(0, 8), [items]);

  if (
    pathname.startsWith("/control-center") ||
    pathname.startsWith("/launch/")
  ) {
    return null;
  }

  return <>
    <nav className="v41DockWrap" aria-label="SysOne dock">
      <div className="v41Dock">
        {visible.map((item) => {
          const Icon = ICONS[item.icon] ?? AppWindow;
          const active = isActive(pathname, item.href);
          return <Link
            key={item.key}
            href={item.href}
            className={`v41DockItem ${active ? "active" : ""}`}
            aria-current={active ? "page" : undefined}
            title={item.label}
          >
            <span className="v41DockIcon"><Icon size={20} strokeWidth={1.8}/></span>
            <span className="v41DockLabel">{item.label}</span>
            <i className="v41DockDot"/>
          </Link>;
        })}
      </div>
    </nav>
    <div className="v41DockReserve" aria-hidden="true"/>
  </>;
}
