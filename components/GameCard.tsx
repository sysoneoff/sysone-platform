"use client";

import Link from "next/link";
import { ArrowUpRight, Gamepad2 } from "lucide-react";

import { useI18n } from "@/components/I18nProvider";
import type { PublicProduct } from "@/lib/server/products";

function formatStatus(status: string) {
  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getMediaUrl(key: string) {
  return `/api/media/${key
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/")}`;
}

function getPrimaryMedia(game: PublicProduct) {
  const preferredTypes = ["HERO", "COVER", "BANNER", "ICON"];

  return (
    game.media.find((media) =>
      preferredTypes.includes(media.type.toUpperCase()),
    ) ??
    game.media[0] ??
    null
  );
}

export function GameCard({ game }: { game: PublicProduct }) {
  const { t } = useI18n();
  const primaryMedia = getPrimaryMedia(game);
  const platforms = Array.from(
    new Set(game.platforms.map((item) => item.platform)),
  );

  const description =
    game.shortDescription ?? game.tagline ?? game.description;

  return (
    <Link
      href={`/games/${game.slug}`}
      className="v3GameCard"
      aria-label={t("card.openGame", { name: game.name })}
    >
      <div className="v3GameArt">
        {primaryMedia ? (
          <img
            src={getMediaUrl(primaryMedia.key)}
            alt={primaryMedia.alt ?? `${game.name} artwork`}
            loading="lazy"
          />
        ) : (
          <div className="v3GameFallback">
            <Gamepad2 size={42} strokeWidth={1.2} />
            <span>SYS/ONE GAMES</span>
          </div>
        )}

        <div className="v3GameShade" />

        <span className="v3CardStatus">
          <i />
          {formatStatus(game.status)}
        </span>

        <span className="v3CardArrow" aria-hidden="true">
          <ArrowUpRight size={18} />
        </span>

        <div className="v3GameTitle">
          <span>{game.category ?? t("card.game")}</span>
          <h3>{game.name}</h3>
        </div>
      </div>

      <div className="v3GameContent">
        {description && <p>{description}</p>}
        <div>
          <span>{game.developerName ?? t("card.sysoneGames")}</span>
          <span>
            {platforms.length > 0
              ? platforms.slice(0, 3).join(" · ")
              : t("card.game")}
          </span>
        </div>
      </div>
    </Link>
  );
}
