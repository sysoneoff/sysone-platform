import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Gamepad2,
} from "lucide-react";

import {
  getPublishedProductBySlug,
  type PublicProduct,
} from "@/lib/server/products";

export const dynamic = "force-dynamic";

type GamePageProps = {
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

function getPrimaryMedia(game: PublicProduct) {
  const preferredTypes = [
    "HERO",
    "COVER",
    "BANNER",
    "SCREENSHOT",
    "ICON",
  ];

  return (
    game.media.find((media) =>
      preferredTypes.includes(
        media.type.toUpperCase(),
      ),
    ) ??
    game.media[0] ??
    null
  );
}

function getDescription(game: PublicProduct) {
  return (
    game.description ??
    game.shortDescription ??
    game.tagline ??
    null
  );
}

export async function generateMetadata({
  params,
}: GamePageProps): Promise<Metadata> {
  const { slug } = await params;

  const game =
    await getPublishedProductBySlug(slug);

  if (!game || game.kind !== "GAME") {
    return {
      title: "Game not found",
    };
  }

  return {
    title: game.name,
    description:
      game.shortDescription ??
      game.tagline ??
      game.description ??
      `View ${game.name} on SysOne Games.`,
  };
}

export default async function GamePage({
  params,
}: GamePageProps) {
  const { slug } = await params;

  const game =
    await getPublishedProductBySlug(slug);

  if (!game || game.kind !== "GAME") {
    notFound();
  }

  const primaryMedia =
    getPrimaryMedia(game);

  const description =
    getDescription(game);

  const platforms = Array.from(
    new Set(
      game.platforms.map(
        (platform) => platform.platform,
      ),
    ),
  );

  const requirements =
    game.platforms.filter(
      (platform) =>
        platform.architecture ||
        platform.minOs ||
        platform.minSystem ||
        platform.recommendedSystem,
    );

  return (
    <div className="pageWrap gameDetail">
      <section className="gameDetailHero">
        <div className="shell gameDetailGrid">
          <div>
            <Link
              className="button buttonGhost"
              href="/games"
            >
              <ArrowLeft size={16} />
              Games
            </Link>

            <div className="metaLine">
              <span>
                {game.category ?? "Game"}
              </span>

              <span>
                {formatStatus(game.status)}
              </span>
            </div>

            <h1>{game.name}</h1>

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
                {formatPrice(game)}
              </span>

              <Link
                className="button buttonGhost buttonLarge"
                href="/marketplace"
              >
                View Store
              </Link>
            </div>
          </div>

          <div className="surface cinematicFrame">
            {primaryMedia ? (
              <img
                src={getMediaUrl(
                  primaryMedia.key,
                )}
                alt={
                  primaryMedia.alt ??
                  `${game.name} artwork`
                }
              />
            ) : (
              <>
                <Gamepad2 size={80} />

                <span>
                  {formatStatus(game.status)}
                </span>
              </>
            )}
          </div>
        </div>
      </section>

      {game.features.length > 0 && (
        <section className="section">
          <div className="shell detailColumns">
            <div>
              <span className="eyebrow">
                FEATURES
              </span>

              <h2>Game features</h2>

              <p className="mutedLead">
                Features currently registered
                for this release in the SysOne
                Store catalog.
              </p>
            </div>

            <div className="detailFeatureList">
              {game.features.map((feature) => (
                <div key={feature.id}>
                  <CheckCircle2 size={18} />

                  <span>
                    <strong>
                      {feature.title}
                    </strong>

                    {feature.description && (
                      <small>
                        {feature.description}
                      </small>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {requirements.length > 0 && (
        <section className="section sectionTint">
          <div className="shell">
            <div className="sectionMiniHead">
              <div>
                <h2>
                  System requirements
                </h2>

                <p>
                  Platform requirements
                  registered for this game.
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
                          {platform.architecture}
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

      <section className="section">
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
                  {game.developerName ??
                    "SysOne Games"}
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
                    game.status,
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
                  {formatPrice(game)}
                </h3>
              </div>
            </article>
          </div>
        </div>
      </section>
    </div>
  );
}