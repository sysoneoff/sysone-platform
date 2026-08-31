"use client";

import Link from "next/link";
import { ArrowUpRight, Box } from "lucide-react";

import { useI18n } from "@/components/I18nProvider";
import type { PublicProduct } from "@/lib/server/products";

function formatStatus(status: string) {
  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatPrice(
  product: PublicProduct,
  lang: string,
  labels: {
    free: string;
    custom: string;
    comingSoon: string;
    unavailable: string;
  },
) {
  const model = product.pricingModel.toUpperCase();

  if (model === "FREE" || model === "FREEMIUM") return labels.free;
  if (model === "CUSTOM") return labels.custom;
  if (model === "TBD") return labels.comingSoon;
  if (product.currentPriceMinor <= 0) return labels.unavailable;

  const localeMap: Record<string, string> = {
    uz: "uz-UZ",
    en: "en-US",
    ru: "ru-RU",
    tr: "tr-TR",
    ar: "ar",
  };

  return new Intl.NumberFormat(localeMap[lang] ?? "uz-UZ", {
    style: "currency",
    currency: product.currency,
  }).format(product.currentPriceMinor / 100);
}

function getProductHref(product: PublicProduct) {
  return product.kind === "GAME"
    ? `/games/${product.slug}`
    : `/products/${product.slug}`;
}

function getMediaUrl(key: string) {
  return `/api/media/${key
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/")}`;
}

function getPrimaryMedia(product: PublicProduct) {
  const preferredTypes = ["COVER", "HERO", "BANNER", "ICON"];

  return (
    product.media.find((media) =>
      preferredTypes.includes(media.type.toUpperCase()),
    ) ??
    product.media[0] ??
    null
  );
}

export function ProductCard({ product }: { product: PublicProduct }) {
  const { lang, t } = useI18n();
  const primaryMedia = getPrimaryMedia(product);

  const platforms = Array.from(
    new Set(product.platforms.map((item) => item.platform)),
  );

  const description =
    product.shortDescription ??
    product.tagline ??
    product.description;

  const price = formatPrice(product, lang, {
    free: t("common.free"),
    custom: t("common.customPrice"),
    comingSoon: t("common.comingSoon"),
    unavailable: t("common.unavailable"),
  });

  return (
    <Link
      href={getProductHref(product)}
      className="v3ProductCard"
      aria-label={t("card.openProduct", { name: product.name })}
    >
      <div className="v3ProductArt">
        {primaryMedia ? (
          <img
            src={getMediaUrl(primaryMedia.key)}
            alt={primaryMedia.alt ?? product.name}
            loading="lazy"
          />
        ) : (
          <div className="v3ProductFallback">
            <span>{product.name.charAt(0).toUpperCase()}</span>
            <Box size={24} strokeWidth={1.35} />
          </div>
        )}

        <span className="v3CardStatus">
          <i />
          {formatStatus(product.status)}
        </span>

        <span className="v3CardArrow" aria-hidden="true">
          <ArrowUpRight size={18} />
        </span>
      </div>

      <div className="v3ProductContent">
        <div className="v3CardTopline">
          <span>
            {product.category ?? product.kind.replaceAll("_", " ")}
          </span>
          {product.developerName && <span>{product.developerName}</span>}
        </div>

        <h3>{product.name}</h3>

        {description && <p>{description}</p>}

        <div className="v3ProductFooter">
          <strong>{price}</strong>
          <span>
            {platforms.length > 0
              ? platforms.slice(0, 3).join(" · ")
              : t("common.digitalProduct")}
          </span>
        </div>
      </div>
    </Link>
  );
}
