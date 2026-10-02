import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

initOpenNextCloudflareForDev();

const nextConfig:NextConfig={
  turbopack:{root:process.cwd()},
  images:{unoptimized:true},
  experimental:{optimizePackageImports:["lucide-react"]},
  async headers(){
    return [{
      source:"/:path*",
      headers:[
        {key:"Strict-Transport-Security",value:"max-age=31536000"},
        {key:"X-Content-Type-Options",value:"nosniff"},
        {key:"Referrer-Policy",value:"strict-origin-when-cross-origin"},
        {
          key:"Content-Security-Policy",
          value:[
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline'",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: blob:",
            "font-src 'self' data:",
            "connect-src 'self' https://runtime.sysone.top https://*.sysone.top",
            "frame-src 'self' https://runtime.sysone.top https://*.sysone.top",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "frame-ancestors 'self'",
          ].join("; "),
        },
        {key:"Permissions-Policy",value:'camera=(self "https://runtime.sysone.top"), microphone=(self "https://runtime.sysone.top"), geolocation=(self "https://runtime.sysone.top"), fullscreen=(self "https://runtime.sysone.top")'},
        {key:"X-Frame-Options",value:"SAMEORIGIN"},
      ],
    }];
  },
};
export default nextConfig;
