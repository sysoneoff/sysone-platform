"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Logo } from "@/components/Logo";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CommandPalette } from "@/components/CommandPalette";
import { siteConfig } from "@/lib/site";

export function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="siteHeader">
      <div className="shell headerInner">
        <Logo />
        <nav className="desktopNav" aria-label="Main navigation">
          {siteConfig.nav.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}
        </nav>
        <div className="headerActions">
          <CommandPalette />
          <LanguageSwitcher />
          <ThemeToggle />
          <Link className="button buttonGhost signInButton" href="/login">Sign in</Link>
          <Link className="button buttonPrimary headerCta" href="/contact">Start project</Link>
          <button className="mobileMenuButton" onClick={() => setOpen(!open)} aria-label="Toggle menu">{open ? <X/> : <Menu/>}</button>
        </div>
      </div>
      {open && (
        <div className="mobileMenu">
          <div className="shell mobileMenuGrid">
            {siteConfig.nav.map((item) => <Link key={item.href} onClick={() => setOpen(false)} href={item.href}>{item.label}</Link>)}
            <Link onClick={() => setOpen(false)} href="/login">Sign in</Link>
            <Link onClick={() => setOpen(false)} className="button buttonPrimary" href="/contact">Start project</Link>
          </div>
        </div>
      )}
    </header>
  );
}
