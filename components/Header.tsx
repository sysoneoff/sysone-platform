"use client";

import Link from "next/link";
import { Menu, Search, UserRound, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { CommandPalette } from "@/components/CommandPalette";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Logo } from "@/components/Logo";
import { useI18n } from "@/components/I18nProvider";
import { siteConfig } from "@/lib/site";
import type { TranslationKey } from "@/lib/i18n";

const navKeys:Record<string,TranslationKey>={
  "/marketplace":"common.store",
  "/products":"common.software",
  "/games":"common.games",
  "/ai":"common.ai",
  "/support":"common.support",
  "/account":"common.account",
};

function active(pathname:string,href:string){
  return pathname===href||pathname.startsWith(`${href}/`);
}

export function Header(){
  const pathname=usePathname();
  const {t}=useI18n();
  const [open,setOpen]=useState(false);
  const nav=siteConfig.nav.filter(i=>i.href!=="/account");

  if(pathname.startsWith("/control-center")) return null;

  return <>
    <header className="v4Header">
      <div className="shell v4HeaderInner">
        <Link href="/" className="v4HeaderBrand" aria-label="SysOne home"><Logo/></Link>

        <nav className="v4DesktopNav" aria-label={t("header.mainNav")}>
          {nav.map(item=><Link
            key={item.href}
            href={item.href}
            className={active(pathname,item.href)?"active":undefined}
          >{navKeys[item.href]?t(navKeys[item.href]):item.label}</Link>)}
        </nav>

        <div className="v4HeaderTools">
          <CommandPalette/>
          <LanguageSwitcher/>
          <Link className={`v4Account ${active(pathname,"/account")?"active":""}`} href="/account">
            <UserRound size={16}/><span>{t("common.account")}</span>
          </Link>
          <button className="v4Menu" type="button" onClick={()=>setOpen(v=>!v)} aria-expanded={open}>
            {open?<X size={19}/>:<Menu size={19}/>}
          </button>
        </div>
      </div>

      {open?<div className="v4MobileMenu">
        <div className="shell">
          {siteConfig.nav.map(item=><Link key={item.href} href={item.href} onClick={()=>setOpen(false)}>
            <span>{navKeys[item.href]?t(navKeys[item.href]):item.label}</span>
            <small>{active(pathname,item.href)?"Current":"Open"}</small>
          </Link>)}
          <div className="v4MobileUtilities">
            <Link href="/docs" onClick={()=>setOpen(false)}>Docs</Link>
            <Link href="/about" onClick={()=>setOpen(false)}>About</Link>
            <Link href="/contact" onClick={()=>setOpen(false)}>Custom</Link>
          </div>
        </div>
      </div>:null}
    </header>
  </>;
}
