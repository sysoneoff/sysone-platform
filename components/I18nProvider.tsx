"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  interpolate,
  languages,
  uiCopy,
  type LanguageCode,
  type TranslationKey,
} from "@/lib/i18n";

type I18nContextValue = {
  lang: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (
    key: TranslationKey,
    values?: Record<string, string | number>,
  ) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function isLanguageCode(value: string | null): value is LanguageCode {
  return languages.some((item) => item.code === value);
}

function applyDocumentLanguage(lang: LanguageCode) {
  const item = languages.find((language) => language.code === lang);
  document.documentElement.lang = lang;
  document.documentElement.dir = item?.dir ?? "ltr";
  document.documentElement.dataset.lang = lang;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<LanguageCode>("uz");

  useEffect(() => {
    const saved = localStorage.getItem("sysone-language");
    const next: LanguageCode = isLanguageCode(saved) ? saved : "uz";
    setLang(next);
    applyDocumentLanguage(next);
  }, []);

  const setLanguage = useCallback((next: LanguageCode) => {
    setLang(next);
    localStorage.setItem("sysone-language", next);
    applyDocumentLanguage(next);
    window.dispatchEvent(
      new CustomEvent("sysone-language", { detail: next }),
    );
  }, []);

  const t = useCallback(
    (
      key: TranslationKey,
      values?: Record<string, string | number>,
    ) => {
      const text = uiCopy[lang]?.[key] ?? uiCopy.en[key];
      return interpolate(text, values);
    },
    [lang],
  );

  const value = useMemo(
    () => ({ lang, setLanguage, t }),
    [lang, setLanguage, t],
  );

  return (
    <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error("useI18n must be used inside I18nProvider");
  }

  return context;
}
