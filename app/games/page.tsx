import type { Metadata } from "next";
import { Gamepad2, Orbit } from "lucide-react";
import { GameCard } from "@/components/GameCard";
import { T } from "@/components/T";
import { listPublishedProducts } from "@/lib/server/products";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Games",description:"Discover games currently published by SysOne Games."};
export default async function GamesPage(){const games=await listPublishedProducts("GAME");return <div className="pageWrap"><section className="v3PageHero v3GamesHero"><div className="shell v3PageHeroLayout"><div><span className="v3HeroIcon"><Gamepad2 size={25}/></span><span className="v3Kicker"><T id="games.kicker"/></span><h1><T id="games.hero"/></h1><p><T id="games.description"/></p></div><div className="v3HeroCount"><strong>{games.length}</strong><span><T id="games.count" values={{count:games.length}}/></span></div></div></section><section className="v3CatalogPageBody"><div className="shell"><div className="v3CatalogTitleRow"><div><span className="v3SectionIcon"><Orbit size={20}/></span><h2><T id="games.catalog"/></h2></div><span>SysOne Games</span></div>{games.length>0?<div className="v3GameGrid">{games.map((game)=><GameCard key={game.id} game={game}/>)}</div>:<div className="v3EmptyState"><Gamepad2 size={32}/><span className="v3Kicker"><T id="games.kicker"/></span><h2><T id="games.emptyTitle"/></h2><p><T id="games.emptyText"/></p></div>}</div></section></div>}
