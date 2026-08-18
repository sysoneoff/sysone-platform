import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AIAssistant } from "@/components/AIAssistant";
import { PWARegister } from "@/components/PWARegister";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://sysone.uz"),
  title: { default: "SysOne — Software, AI, Games & Digital Products", template: "%s — SysOne" },
  description: "SysOne builds premium software, AI solutions, games and intelligent digital products.",
  applicationName: "SysOne",
  keywords: ["SysOne", "software", "AI", "games", "web development", "mobile apps", "Uzbekistan"],
  openGraph: { type: "website", siteName: "SysOne", title: "SysOne", description: "Software, AI, Games & Digital Products", images: ["/brand/sysone-primary.png"] },
  twitter: { card: "summary_large_image", title: "SysOne", description: "Software, AI, Games & Digital Products", images: ["/brand/sysone-primary.png"] },
  icons: { icon: "/brand/sysone-symbol.png", apple: "/brand/sysone-app-icon.png" }
};

export const viewport: Viewport = { themeColor: "#060912", colorScheme: "dark light", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="uz" data-theme="dark">
      <body>
        <div className="ambient ambientOne"/><div className="ambient ambientTwo"/><div className="noiseLayer"/>
        <Header />
        <main>{children}</main>
        <Footer />
        <AIAssistant />
        <PWARegister />
      </body>
    </html>
  );
}
