import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SysOne",
    short_name: "SysOne",
    description: "Software, AI, Games & Digital Products",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#05070c",
    theme_color: "#05070c",
    icons: [
      { src: "/brand/sysone-app-icon.png", sizes: "1254x1254", type: "image/png", purpose: "any" },
      { src: "/brand/sysone-app-icon.png", sizes: "1254x1254", type: "image/png", purpose: "maskable" }
    ]
  };
}
