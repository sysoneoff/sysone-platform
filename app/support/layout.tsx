import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: { absolute: "SysOne Support — Account, License and Technical Help" },
  description: "Get SysOne support for technical issues, accounts, downloads, licenses and product feedback.",
};

export default function SupportLayout({ children }: { children: ReactNode }) {
  return children;
}
