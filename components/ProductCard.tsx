import Link from "next/link";
import { ArrowUpRight, Box } from "lucide-react";
import type { PublicProduct } from "@/lib/server/products";

function formatStatus(status: string) {
  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatPrice(product: PublicProduct) {
  const model = product.pricingModel.toUpperCase();

  if (model === "FREE" || model === "FREEMIUM") {
    return "Free";
  }

  if (model === "CUSTOM") {
    return "Custom";
  }

  if (model === "TBD") {
    return "Coming soon";
  }

  if (product.currentPriceMinor <= 0) {
    return "Unavailable";
  }

  return new Intl.NumberFormat("uz-UZ", {
    style: "currency",
    currency: product.currency,
  }).format(product.currentPriceMinor / 100);
}

function getProductHref(product: PublicProduct) {
  if (product.kind === "GAME") {
    return `/games/${product.slug}`;
  }

  return `/products/${product.slug}`;
}

function getMediaUrl(key: string) {
  const safePath = key
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");

  return `/api/media/${safePath}`;
}

function getPrimaryMedia(product: PublicProduct) {
  const preferredTypes = ["COVER", "HERO", "ICON"];

  return (
    product.media.find((media) =>
      preferredTypes.includes(media.type.toUpperCase()),
    ) ??
    product.media[0] ??
    null
  );
}

export function ProductCard({
  product,
}: {
  product: PublicProduct;
}) {
  const primaryMedia = getPrimaryMedia(product);

  const platforms = Array.from(
    new Set(product.platforms.map((item) => item.platform)),
  );

  const description =
    product.shortDescription ??
    product.tagline ??
    product.description;

  return (
    <article className="surface productCard">
      <div className="productVisual">
        {primaryMedia ? (
          <img
            src={getMediaUrl(primaryMedia.key)}
            alt={primaryMedia.alt ?? product.name}
            loading="lazy"
          />
        ) : (
          <div
            className="productMonogram"
            aria-label={`${product.name} artwork unavailable`}
          >
            <Box size={28} />
          </div>
        )}

        <span className="statusPill">
          {formatStatus(product.status)}
        </span>
      </div>

      <div className="cardBody">
        <div className="metaLine">
          <span>
            {product.category ??
              product.kind.replaceAll("_", " ")}
          </span>

          {product.developerName && (
            <span>{product.developerName}</span>
          )}
        </div>

        <h3>{product.name}</h3>

        {description && <p>{description}</p>}

        {platforms.length > 0 && (
          <div className="platformRow">
            {platforms.map((platform) => (
              <span key={platform}>{platform}</span>
            ))}
          </div>
        )}

        <div className="cardFooter">
          <strong>{formatPrice(product)}</strong>

          <Link href={getProductHref(product)}>
            View
            <ArrowUpRight size={15} />
          </Link>
        </div>
      </div>
    </article>
  );
}