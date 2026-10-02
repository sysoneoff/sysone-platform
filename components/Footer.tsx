"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { Logo } from "@/components/Logo";

export function Footer(){
  const pathname=usePathname();
  if(pathname.startsWith("/control-center")||pathname.startsWith("/launch/")) return null;

  return <footer className="v4Footer">
    <div className="shell">
      <div className="v4FooterTop">
        <div className="v4FooterBrand"><Logo/><p>Dasturlar, web ilovalar, o‘yinlar va raqamli mahsulotlar uchun SysOne platformasi.</p></div>
        <div className="v4FooterLinks">
          <div><strong>Mahsulotlar</strong><Link href="/marketplace">Marketplace</Link><Link href="/products">Software</Link><Link href="/games">Games</Link><Link href="/ai">AI</Link></div>
          <div><strong>Platforma</strong><Link href="/account">Account</Link><Link href="/docs">Docs</Link><Link href="/support">Support</Link><Link href="/contact">Custom</Link></div>
          <div><strong>SysOne</strong><Link href="/about">About</Link><Link href="/labs">Labs</Link><Link href="/legal/privacy">Privacy</Link><Link href="/legal/terms">Terms</Link></div>
        </div>
      </div>
      <div className="v4FooterBottom"><span>© 2026 SysOne. Barcha huquqlar himoyalangan.</span><Link href="/marketplace">Katalogni ochish <ArrowUpRight size={13}/></Link></div>
    </div>
  </footer>;
}
