"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  BookOpen,
  Box,
  BrainCircuit,
  FlaskConical,
  Gamepad2,
  Info,
  LifeBuoy,
  Menu,
  ShoppingBag,
  UserRound,
  Wrench,
  X,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { CommandPalette } from "@/components/CommandPalette";
import { useI18n } from "@/components/I18nProvider";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Logo } from "@/components/Logo";
import { useSession } from "@/components/SessionProvider";
import { siteConfig } from "@/lib/site";
import type { TranslationKey } from "@/lib/i18n";

function NavIcon({ href, size = 15 }: { href: string; size?: number }) {
  if (href === "/marketplace") return <ShoppingBag size={size} />;
  if (href === "/products") return <Box size={size} />;
  if (href === "/games") return <Gamepad2 size={size} />;
  if (href === "/ai") return <BrainCircuit size={size} />;
  if (href === "/support") return <LifeBuoy size={size} />;
  return <UserRound size={size} />;
}

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

const navKeys: Record<string, TranslationKey> = {
  "/marketplace": "common.store",
  "/products": "common.software",
  "/games": "common.games",
  "/ai": "common.ai",
  "/support": "common.support",
  "/account": "common.account",
};

const utilityLinks = [
  { href: "/docs", labelKey: "common.docs", icon: BookOpen },
  { href: "/about", labelKey: "common.about", icon: Info },
  { href: "/labs", labelKey: "common.labs", icon: FlaskConical },
  { href: "/contact", labelKey: "common.custom", icon: Wrench },
] as const satisfies readonly {
  href: string;
  labelKey: TranslationKey;
  icon: typeof BookOpen;
}[];

export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { t } = useI18n();
  const { authenticated, loading, user } = useSession();

  const accountLabel =
    !loading && authenticated && user?.name
      ? user.name.trim().split(/\s+/)[0]
      : t("common.account");

  const desktopNav = siteConfig.nav.filter(
    (item) => item.href !== "/account",
  );

  const mobileDock = siteConfig.nav.filter((item) =>
    ["/marketplace", "/products", "/games", "/ai", "/account"].includes(
      item.href,
    ),
  );

  function labelFor(href: string, fallback: string) {
    if (href === "/account") return accountLabel;
    const key = navKeys[href];
    return key ? t(key) : fallback;
  }

  return (
    <>
      <header className="siteHeader v3Header">
        <div className="shell v3HeaderInner">
          <div className="v3BrandCluster">
            <Logo />
            <span className="v3BrandDivision">{t("header.productOs")}</span>
          </div>

          <nav className="v3DesktopNav" aria-label={t("header.mainNav")}>
            {desktopNav.map((item) => {
              const active = isActive(pathname, item.href);
              const label = labelFor(item.href, item.label);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={active ? "active" : undefined}
                  aria-current={active ? "page" : undefined}
                >
                  <NavIcon href={item.href} />
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="v3HeaderActions">
            <CommandPalette />
            <LanguageSwitcher />

            <Link
              className={`v3AccountButton ${
                isActive(pathname, "/account") ? "active" : ""
              }`}
              href="/account"
              title={authenticated ? user?.name ?? undefined : undefined}
            >
              <UserRound size={16} />
              <span>{accountLabel}</span>
            </Link>

            <button
              className="v3MenuButton"
              type="button"
              onClick={() => setOpen((value) => !value)}
              aria-label={t("header.toggleMenu")}
              aria-expanded={open}
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {open && (
          <div className="v3MobileSheet">
            <div className="shell v3MobileSheetInner">
              <div className="v3MobilePrimary">
                {siteConfig.nav.map((item) => {
                  const label = labelFor(item.href, item.label);

                  return (
                    <Link
                      href={item.href}
                      key={item.href}
                      onClick={() => setOpen(false)}
                    >
                      <span className="v3MobileLinkIcon">
                        <NavIcon href={item.href} size={19} />
                      </span>
                      <span>
                        <strong>{label}</strong>
                        <small>
                          {t("header.openSection", { section: label })}
                        </small>
                      </span>
                      <ArrowUpRight size={17} />
                    </Link>
                  );
                })}
              </div>

              <div className="v3MobileUtility">
                {utilityLinks.map(({ href, labelKey, icon: Icon }) => (
                  <Link
                    href={href}
                    key={href}
                    onClick={() => setOpen(false)}
                  >
                    <Icon size={16} />
                    {t(labelKey)}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </header>

      <nav className="v3MobileDock" aria-label={t("header.mobileNav")}>
        {mobileDock.map((item) => {
          const active = isActive(pathname, item.href);
          const label = labelFor(item.href, item.label);

          return (
            <Link
              href={item.href}
              key={item.href}
              className={active ? "active" : undefined}
              aria-current={active ? "page" : undefined}
            >
              <span>
                <NavIcon href={item.href} size={19} />
              </span>
              <small>{label}</small>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
