import type { Metadata, Viewport } from "next";

import "./globals.css";
import "./obsidian.css";
import "./v4.css";

import { AnnouncementBar } from "@/components/AnnouncementBar";
import { AppDock } from "@/components/AppDock";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { I18nProvider } from "@/components/I18nProvider";
import { PageTransition } from "@/components/PageTransition";
import { PWARegister } from "@/components/PWARegister";

const SITE_URL=process.env.NEXT_PUBLIC_SITE_URL||"https://sysone.top";

export const metadata:Metadata={
  metadataBase:new URL(SITE_URL),
  title:{default:"SysOne - Software, Web Apps & Games",template:"%s - SysOne"},
  description:"Dasturlar, web ilovalar, o'yinlar, AI vositalari va raqamli mahsulotlar - bitta SysOne platformasida.",
  applicationName:"SysOne",
  keywords:["SysOne","software","web apps","games","AI","digital products","Uzbekistan"],
  openGraph:{
    type:"website",
    siteName:"SysOne",
    title:"SysOne",
    description:"Software, Web Apps, Games & Digital Products",
    images:["/brand/sysone-primary.png"]
  },
  twitter:{
    card:"summary_large_image",
    title:"SysOne",
    description:"Software, Web Apps, Games & Digital Products",
    images:["/brand/sysone-primary.png"]
  },
  icons:{
    icon:"/brand/sysone-symbol.png",
    apple:"/brand/sysone-app-icon.png"
  },
};

export const viewport:Viewport={
  themeColor:"#0a0b0d",
  colorScheme:"dark",
  width:"device-width",
  initialScale:1
};

export default function RootLayout({children}:{children:React.ReactNode}){
  return <html lang="uz" data-theme="dark">
    <body>
      <I18nProvider>
        <AnnouncementBar/>
        <Header/>
        <main>
          <PageTransition>{children}</PageTransition>
        </main>
        <Footer/>
        <AppDock/>
      </I18nProvider>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{__html:JSON.stringify({
          "@context":"https://schema.org",
          "@graph":[
            {
              "@type":"Organization",
              "@id":"https://sysone.top/#organization",
              "name":"SysOne",
              "url":"https://sysone.top",
              "logo":"https://sysone.top/brand/sysone-primary.png"
            },
            {
              "@type":"WebSite",
              "@id":"https://sysone.top/#website",
              "url":"https://sysone.top",
              "name":"SysOne",
              "publisher":{"@id":"https://sysone.top/#organization"}
            }
          ]
        })}}
      />

      <PWARegister/>
    </body>
  </html>;
}
