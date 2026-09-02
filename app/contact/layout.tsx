import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: { absolute: "Contact SysOne — Custom Software and Digital Projects" },
  description: "Send SysOne a structured project brief for custom software, AI, games or business automation development.",
};

export default function ContactLayout({ children }: { children: ReactNode }) {
  return children;
}
