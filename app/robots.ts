import type { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots{return {rules:[{userAgent:"*",allow:"/",disallow:["/control-center"]}],sitemap:`${process.env.NEXT_PUBLIC_SITE_URL||"https://sysone.top"}/sitemap.xml`};}
