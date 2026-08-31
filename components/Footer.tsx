"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  Box,
  BrainCircuit,
  Gamepad2,
  LifeBuoy,
  ShoppingBag,
} from "lucide-react";

import { useI18n } from "@/components/I18nProvider";
import { Logo } from "@/components/Logo";
import type { TranslationKey } from "@/lib/i18n";

const footerGroups = [
  {
    titleKey: "common.store",
    links: [
      ["/marketplace", "common.marketplace"],
      ["/products", "common.software"],
      ["/games", "common.games"],
      ["/ai", "common.ai"],
    ],
  },
  {
    titleKey: "common.platform",
    links: [
      ["/account", "common.account"],
      ["/docs", "common.docs"],
      ["/support", "common.support"],
      ["/contact", "common.custom"],
    ],
  },
  {
    titleKey: "common.sysone",
    links: [
      ["/about", "common.about"],
      ["/labs", "common.labs"],
      ["/legal/privacy", "common.privacy"],
      ["/legal/terms", "common.terms"],
    ],
  },
] as const satisfies readonly {
  titleKey: TranslationKey;
  links: readonly (readonly [string, TranslationKey])[];
}[];

export function Footer() {
  const { t } = useI18n();

  return (
    <footer className="siteFooter v3Footer">
      <div className="shell">
        <div className="v3FooterLead">
          <div>
            <Logo />
            <span>{t("footer.os")}</span>
          </div>

          <h2>
            {t("footer.lead1")}
            <br />
            {t("footer.lead2")}
          </h2>
        </div>

        <div className="v3FooterGrid">
          <div className="v3FooterIdentity">
            <div className="v3FooterPillRow">
              <span><Box size={15} /> {t("common.software")}</span>
              <span><BrainCircuit size={15} /> {t("common.ai")}</span>
              <span><Gamepad2 size={15} /> {t("common.games")}</span>
            </div>

            <p>{t("footer.description")}</p>

            <Link href="/marketplace" className="v3FooterStoreLink">
              <ShoppingBag size={17} />
              {t("footer.openStore")}
              <ArrowUpRight size={16} />
            </Link>
          </div>

          {footerGroups.map((group) => (
            <div className="v3FooterLinks" key={group.titleKey}>
              <strong>{t(group.titleKey)}</strong>
              {group.links.map(([href, labelKey]) => (
                <Link href={href} key={href}>
                  {t(labelKey)}
                </Link>
              ))}
            </div>
          ))}
        </div>

        <div className="v3FooterBottom">
          <span>{t("footer.rights")}</span>
          <Link href="/support">
            <LifeBuoy size={14} />
            {t("common.support")}
          </Link>
        </div>
      </div>
    </footer>
  );
}
