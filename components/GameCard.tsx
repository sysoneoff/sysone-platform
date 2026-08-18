import Link from "next/link";
import { ArrowUpRight, Gamepad2 } from "lucide-react";
import type { Game } from "@/data/catalog";

export function GameCard({ game }: { game: Game }) {
  return (
    <article className={`surface gameCard accent-${game.accent}`}>
      <div className="gameArt"><Gamepad2 size={44}/><span className="statusPill">{game.status}</span><div className="gameGlow"/></div>
      <div className="cardBody"><div className="metaLine"><span>{game.genre}</span><span>{game.platforms.join(" • ")}</span></div><h3>{game.name}</h3><p>{game.tagline}</p><div className="cardFooter"><span>SysOne Games</span><Link href={`/games/${game.slug}`}>Explore <ArrowUpRight size={15}/></Link></div></div>
    </article>
  );
}
