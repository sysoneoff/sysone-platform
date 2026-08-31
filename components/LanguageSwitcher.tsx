"use client";

import { Languages } from "lucide-react";

import { useI18n } from "@/components/I18nProvider";
import { languages, type LanguageCode } from "@/lib/i18n";

export function LanguageSwitcher() {
  const { lang, setLanguage, t } = useI18n();

  return (
    <label className="languageControl" title={t("common.language")}>
      <Languages size={15} aria-hidden="true" />
      <span className="srOnly">{t("common.language")}</span>
      <select
        value={lang}
        onChange={(event) =>
          setLanguage(event.target.value as LanguageCode)
        }
        aria-label={t("common.language")}
      >
        {languages.map((item) => (
          <option key={item.code} value={item.code}>
            {item.short}
          </option>
        ))}
      </select>
    </label>
  );
}
