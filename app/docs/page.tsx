import type { Metadata } from "next";

import { DocsExplorer } from "@/components/DocsExplorer";

export const metadata: Metadata = {
  title: "Documentation",
  description:
    "Verified guides for SysOne accounts, products, downloads, licenses and support.",
};

export default function DocsPage() {
  return <DocsExplorer />;
}
