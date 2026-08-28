import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Box,
  CheckCircle2,
} from "lucide-react";

import {
  getPublishedProductBySlug,
  type PublicProduct,
} from "@/lib/server/products";

export const dynamic = "force-dynamic";

type ProductPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

function formatStatus(status: string) {
  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
}

function formatKind(kind: string) {
  return kind
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
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

function getMediaUrl(key: string) {
  const safePath = key
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");

  return `/api/media/${safePath}`;
}

function getPrimaryMedia(product: PublicProduct) {
  const preferredTypes = [
    "HERO",
    "COVER",
    "BANNER",
    "ICON",
    "SCREENSHOT",
  ];

  return (
    product.media.find((media) =>
      preferredTypes.includes(
        media.type.toUpperCase(),
      ),
    ) ??
    product.media[0] ??
    null
  );
}

function getDescription(product: PublicProduct) {
  return (
    product.description ??
    product.shortDescription ??
    product.tagline ??
    null
  );
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;

  const product =
    await getPublishedProductBySlug(slug);

  if (!product || product.kind === "GAME") {
    return {
      title: "Product not found",
    };
  }

  return {
    title: product.name,
    description:
      product.shortDescription ??
      product.tagline ??
      product.description ??
      `View ${product.name} on the SysOne Store.`,
  };
}

export default async function ProductPage({
  params,
}: ProductPageProps) {
  const { slug } = await params;

  const product =
    await getPublishedProductBySlug(slug);

  if (!product || product.kind === "GAME") {
    notFound();
  }

  const primaryMedia =
    getPrimaryMedia(product);

  const description =
    getDescription(product);

  const platforms = Array.from(
    new Set(
      product.platforms.map(
        (platform) => platform.platform,
      ),
    ),
  );

  const requirements =
    product.platforms.filter(
      (platform) =>
        platform.architecture ||
        platform.minOs ||
        platform.minSystem ||
        platform.recommendedSystem,
    );

  const galleryMedia =
    product.media.filter(
      (media) =>
        media.id !== primaryMedia?.id &&
        ["SCREENSHOT", "GALLERY"].includes(
          media.type.toUpperCase(),
        ),
    );

  return (
    <div className="pageWrap">
      <section className="productDetailHero">
        <div className="shell productDetailGrid">
          <div>
            <Link
              className="button buttonGhost"
              href="/products"
            >
              <ArrowLeft size={16} />
              Products
            </Link>

            <div className="metaLine">
              <span>
                {product.category ??
                  formatKind(product.kind)}
              </span>

              <span>
                {formatStatus(product.status)}
              </span>
            </div>

            <h1>{product.name}</h1>

            {description && (
              <p>{description}</p>
            )}

            {platforms.length > 0 && (
              <div className="platformRow big">
                {platforms.map((platform) => (
                  <span key={platform}>
                    {platform}
                  </span>
                ))}
              </div>
            )}

            <div className="heroActions">
              <span className="button buttonPrimary buttonLarge">
                {formatPrice(product)}
              </span>

              <Link
                className="button buttonGhost buttonLarge"
                href="/marketplace"
              >
                View Store
              </Link>
            </div>
          </div>

          <div className="surface productDetailArt">
            {primaryMedia ? (
              <img
                src={getMediaUrl(
                  primaryMedia.key,
                )}
                alt={
                  primaryMedia.alt ??
                  `${product.name} artwork`
                }
              />
            ) : (
              <>
                <div className="detailMonogram">
                  <Box size={64} />
                </div>

                <span>
                  {formatStatus(
                    product.status,
                  )}
                </span>
              </>
            )}
          </div>
        </div>
      </section>

      {product.features.length > 0 && (
        <section className="section">
          <div className="shell detailColumns">
            <div>
              <span className="eyebrow">
                FEATURES
              </span>

              <h2>Product features</h2>

              <p className="mutedLead">
                Features currently registered
                for this product in the SysOne
                Store catalog.
              </p>
            </div>

            <div className="detailFeatureList">
              {product.features.map(
                (feature) => (
                  <div key={feature.id}>
                    <CheckCircle2 size={18} />

                    <span>
                      <strong>
                        {feature.title}
                      </strong>

                      {feature.description && (
                        <small>
                          {
                            feature.description
                          }
                        </small>
                      )}
                    </span>
                  </div>
                ),
              )}
            </div>
          </div>
        </section>
      )}

      {galleryMedia.length > 0 && (
        <section className="section sectionTint">
          <div className="shell">
            <div className="sectionMiniHead">
              <div>
                <h2>Screenshots</h2>

                <p>
                  Media published for this
                  product.
                </p>
              </div>
            </div>

            <div className="cardGrid3">
              {galleryMedia.map((media) => (
                <article
                  className="surface"
                  key={media.id}
                >
                  <img
                    src={getMediaUrl(media.key)}
                    alt={
                      media.alt ??
                      `${product.name} screenshot`
                    }
                    loading="lazy"
                  />
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {requirements.length > 0 && (
        <section className="section">
          <div className="shell">
            <div className="sectionMiniHead">
              <div>
                <h2>
                  System requirements
                </h2>

                <p>
                  Platform requirements
                  registered for this product.
                </p>
              </div>
            </div>

            <div className="cardGrid3">
              {requirements.map(
                (platform, index) => (
                  <article
                    className="surface"
                    key={`${platform.platform}-${index}`}
                  >
                    <div className="cardBody">
                      <h3>
                        {platform.platform}
                      </h3>

                      {platform.architecture && (
                        <p>
                          Architecture:{" "}
                          {
                            platform.architecture
                          }
                        </p>
                      )}

                      {platform.minOs && (
                        <p>
                          Minimum OS:{" "}
                          {platform.minOs}
                        </p>
                      )}

                      {platform.minSystem && (
                        <p>
                          Minimum:{" "}
                          {platform.minSystem}
                        </p>
                      )}

                      {platform.recommendedSystem && (
                        <p>
                          Recommended:{" "}
                          {
                            platform.recommendedSystem
                          }
                        </p>
                      )}
                    </div>
                  </article>
                ),
              )}
            </div>
          </div>
        </section>
      )}

      <section className="section sectionTint">
        <div className="shell">
          <div className="sectionMiniHead">
            <div>
              <h2>Store information</h2>
            </div>
          </div>

          <div className="cardGrid3">
            <article className="surface">
              <div className="cardBody">
                <span className="metaLine">
                  Developer
                </span>

                <h3>
                  {product.developerName ??
                    "SysOne"}
                </h3>
              </div>
            </article>

            <article className="surface">
              <div className="cardBody">
                <span className="metaLine">
                  Availability
                </span>

                <h3>
                  {formatStatus(
                    product.status,
                  )}
                </h3>
              </div>
            </article>

            <article className="surface">
              <div className="cardBody">
                <span className="metaLine">
                  Price
                </span>

                <h3>
                  {formatPrice(product)}
                </h3>
              </div>
            </article>

            {product.releaseDate && (
              <article className="surface">
                <div className="cardBody">
                  <span className="metaLine">
                    Release date
                  </span>

                  <h3>
                    {product.releaseDate}
                  </h3>
                </div>
              </article>
            )}

            {product.ageRating && (
              <article className="surface">
                <div className="cardBody">
                  <span className="metaLine">
                    Age rating
                  </span>

                  <h3>
                    {product.ageRating}
                  </h3>
                </div>
              </article>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}