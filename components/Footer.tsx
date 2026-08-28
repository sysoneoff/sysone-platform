import Link from "next/link";

import { Logo } from "@/components/Logo";

export function Footer() {
  return (
    <footer className="siteFooter">
      <div className="shell footerGrid">
        <div className="footerBrand">
          <Logo />

          <p>
            Software, AI, games and digital products
            across one SysOne ecosystem.
          </p>

          <span>
            © 2026 SysOne. All rights reserved.
          </span>
        </div>

        <div>
          <strong>Store</strong>

          <Link href="/marketplace">
            Store
          </Link>

          <Link href="/products">
            Software
          </Link>

          <Link href="/games">
            Games
          </Link>

          <Link href="/ai">
            AI
          </Link>
        </div>

        <div>
          <strong>Account</strong>

          <Link href="/account">
            My Account
          </Link>

          <Link href="/support">
            Support
          </Link>
        </div>

        <div>
          <strong>SysOne</strong>

          <Link href="/about">
            About
          </Link>

          <Link href="/labs">
            Labs
          </Link>
        </div>

        <div>
          <strong>Legal</strong>

          <Link href="/legal/privacy">
            Privacy
          </Link>

          <Link href="/legal/terms">
            Terms
          </Link>
        </div>
      </div>
    </footer>
  );
}