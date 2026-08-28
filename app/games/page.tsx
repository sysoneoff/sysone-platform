import type { Metadata } from "next";

import { GameCard } from "@/components/GameCard";
import { listPublishedProducts } from "@/lib/server/products";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Games",
  description:
    "Discover games currently published by SysOne Games.",
};

export default async function GamesPage() {
  const games = await listPublishedProducts("GAME");

  return (
    <div className="pageWrap gamesPage">
      <section className="pageHero shell">
        <span className="eyebrow">
          SYSONE GAMES
        </span>

        <h1>Games from SysOne.</h1>

        <p>
          Explore games currently published through the
          SysOne Store, including real platform,
          availability and release information.
        </p>
      </section>

      <section className="section compactTop">
        <div className="shell">
          <div className="sectionMiniHead">
            <div>
              <h2>Game catalog</h2>
            </div>

            <span>
              {games.length}{" "}
              {games.length === 1 ? "game" : "games"}
            </span>
          </div>

          {games.length > 0 ? (
            <div className="cardGrid3">
              {games.map((game) => (
                <GameCard
                  key={game.id}
                  game={game}
                />
              ))}
            </div>
          ) : (
            <div className="surface emptyState">
              <h2>No games are currently published.</h2>

              <p>
                SysOne Games does not currently have
                a publicly available release in the store.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}