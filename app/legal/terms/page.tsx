import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Terms of Service",
  robots: { index: false, follow: true },
};

export default function TermsPage(){return <div className="legalPage shell"><span className="eyebrow">LEGAL</span><h1>Terms of Service</h1><p className="legalLead">Foundation placeholder — production Terms, marketplace rules, refund policy, software licenses and game EULAs require final legal review.</p><h2>SysOne services</h2><p>SysOne may provide custom digital services, software, games, subscriptions, licenses and digital downloads. Product-specific terms can supplement the general platform terms.</p><h2>Marketplace</h2><p>The architecture supports free, one-time, subscription and lifetime offerings, verified purchases, reviews, entitlements and secure distribution.</p><h2>Acceptable use</h2><p>Accounts, downloads, API access and community features must not be abused, redistributed unlawfully or used to compromise the platform or other users.</p></div>}
