import type { Metadata, Viewport } from "next";

import "./globals.css";
import "./obsidian.css";

import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { I18nProvider } from "@/components/I18nProvider";
import { PWARegister } from "@/components/PWARegister";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://sysone.top";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "SysOne — Software, AI, Games & Digital Products",
    template: "%s — SysOne",
  },
  description:
    "Discover software, AI tools, games and digital products published across the SysOne ecosystem.",
  applicationName: "SysOne",
  keywords: [
    "SysOne",
    "software",
    "AI",
    "games",
    "digital products",
    "Uzbekistan",
  ],
  openGraph: {
    type: "website",
    siteName: "SysOne",
    title: "SysOne",
    description: "Software, AI, Games & Digital Products",
    images: ["/brand/sysone-primary.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "SysOne",
    description: "Software, AI, Games & Digital Products",
    images: ["/brand/sysone-primary.png"],
  },
  icons: {
    icon: "/brand/sysone-symbol.png",
    apple: "/brand/sysone-app-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#08090b",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uz" data-theme="dark">
      <body>
        <I18nProvider>
          <Header />
          <main>{children}</main>
          <Footer />
        </I18nProvider>
        <PWARegister />
      </body>
    </html>
  );
}
