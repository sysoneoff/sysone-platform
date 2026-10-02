"use client";

import Link from "next/link";
import { UserRound } from "lucide-react";
import { usePathname } from "next/navigation";

import { CommandPalette } from "@/components/CommandPalette";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Logo } from "@/components/Logo";
import { useI18n } from "@/components/I18nProvider";

export function Header(){
  const pathname=usePathname();
  const {t}=useI18n();

  if(pathname.startsWith("/control-center")) return null;

  return <header className="v4Header v41Header">
    <div className="shell v4HeaderInner v41HeaderInner">
      <Link href="/" className="v4HeaderBrand" aria-label="SysOne home">
        <Logo/>
      </Link>

      <div className="v41HeaderStatus">
        <span className="v41LiveDot"/>
        <span>Software / Web Apps / Games</span>
      </div>

      <div className="v4HeaderTools v41HeaderTools">
        <CommandPalette/>
        <LanguageSwitcher/>
        <Link
          className={`v4Account ${pathname.startsWith("/account")?"active":""}`}
          href="/account"
        >
          <UserRound size={16}/>
          <span>{t("common.account")}</span>
        </Link>
      </div>
    </div>
  </header>;
}
