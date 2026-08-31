"use client";

import { useI18n } from "@/components/I18nProvider";
import type { TranslationKey } from "@/lib/i18n";

export function T({
  id,
  values,
}: {
  id: TranslationKey;
  values?: Record<string, string | number>;
}) {
  const { t } = useI18n();
  return <>{t(id, values)}</>;
}
