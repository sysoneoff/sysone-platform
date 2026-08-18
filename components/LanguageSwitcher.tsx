"use client";

import { useEffect, useState } from "react";
import { Languages } from "lucide-react";
import { languages } from "@/lib/i18n";

export function LanguageSwitcher() {
  const [lang, setLang] = useState("uz");

  useEffect(() => {
    const saved = localStorage.getItem("sysone-language") || "uz";
    setLang(saved);
    const item = languages.find((l) => l.code === saved);
    document.documentElement.lang = saved;
    document.documentElement.dir = item?.dir || "ltr";
  }, []);

  function change(next: string) {
    setLang(next);
    localStorage.setItem("sysone-language", next);
    const item = languages.find((l) => l.code === next);
    document.documentElement.lang = next;
    document.documentElement.dir = item?.dir || "ltr";
    window.dispatchEvent(new CustomEvent("sysone-language", { detail: next }));
  }

  return (
    <label className="languageControl" title="Language">
      <Languages size={15} aria-hidden="true" />
      <span className="srOnly">Language</span>
      <select value={lang} onChange={(e) => change(e.target.value)} aria-label="Language">
        {languages.map((item) => (
          <option key={item.code} value={item.code}>{item.short}</option>
        ))}
      </select>
    </label>
  );
}
