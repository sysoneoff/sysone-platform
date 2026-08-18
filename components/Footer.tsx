import Link from "next/link";
import { Logo } from "@/components/Logo";

export function Footer() {
  return (
    <footer className="siteFooter">
      <div className="shell footerGrid">
        <div className="footerBrand">
          <Logo />
          <p>Software, AI, games and intelligent digital products — designed as one connected ecosystem.</p>
          <span>© 2026 SysOne. All rights reserved.</span>
        </div>
        <div><strong>Build</strong><Link href="/solutions">Solutions</Link><Link href="/contact">Start a project</Link><Link href="/pricing">Pricing</Link><Link href="/case-studies">Case studies</Link></div>
        <div><strong>Explore</strong><Link href="/products">Products</Link><Link href="/games">Games</Link><Link href="/marketplace">Marketplace</Link><Link href="/labs">Labs</Link></div>
        <div><strong>Resources</strong><Link href="/ai">SysOne AI</Link><Link href="/docs">Documentation</Link><Link href="/support">Support</Link><Link href="/status">Status</Link></div>
        <div><strong>Company</strong><Link href="/about">About</Link><Link href="/contact">Contact</Link><Link href="/legal/privacy">Privacy</Link><Link href="/legal/terms">Terms</Link></div>
      </div>
    </footer>
  );
}
