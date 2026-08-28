import Link from "next/link";
import {
  ArrowUpRight,
  Gamepad2,
} from "lucide-react";

import type { PublicProduct } from "@/lib/server/products";

function formatStatus(status: string) {
  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
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
    game.shortDescription ??
    game.tagline ??
    game.description ??
    null
  );
}

export function GameCard({
  game,
}: {
  game: PublicProduct;
}) {
  const primaryMedia = getPrimaryMedia(game);

  const platforms = Array.from(
    new Set(
      game.platforms.map(
        (item) => item.platform,
      ),
    ),
  );

  const description = getDescription(game);

  return (
    <article className="surface gameCard">
      <div className="gameArt">
        {primaryMedia ? (
          <img
            src={getMediaUrl(primaryMedia.key)}
            alt={
              primaryMedia.alt ??
              `${game.name} artwork`
            }
            loading="lazy"
          />
        ) : (
          <div
            className="gameArtFallback"
            aria-label={`${game.name} artwork unavailable`}
          >
            <Gamepad2 size={44} />
          </div>
        )}

        <span className="statusPill">
          {formatStatus(game.status)}
        </span>
      </div>

      <div className="cardBody">
        <div className="metaLine">
          <span>
            {game.category ?? "Game"}
          </span>

          {platforms.length > 0 && (
            <span>
              {platforms.join(" • ")}
            </span>
          )}
        </div>

        <h3>{game.name}</h3>

        {description && (
          <p>{description}</p>
        )}

        <div className="cardFooter">
          <span>
            {game.developerName ??
              "SysOne Games"}
          </span>

          <Link href={`/games/${game.slug}`}>
            View
            <ArrowUpRight size={15} />
          </Link>
        </div>
      </div>
    </article>
  );
}