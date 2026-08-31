import type { Metadata } from "next";
import { Box, Layers3 } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { T } from "@/components/T";
import { listPublishedProducts } from "@/lib/server/products";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Software", description: "Browse published SysOne software products." };
export default async function ProductsPage(){ const products=await listPublishedProducts("SOFTWARE"); return <div className="pageWrap">
<section className="v3PageHero"><div className="shell v3PageHeroLayout"><div><span className="v3HeroIcon"><Box size={24}/></span><span className="v3Kicker"><T id="software.kicker"/></span><h1><T id="software.hero"/></h1><p><T id="software.description"/></p></div><div className="v3HeroCount"><strong>{products.length}</strong><span><T id="software.count" values={{count:products.length}}/></span></div></div></section>
<section className="v3CatalogPageBody"><div className="shell"><div className="v3CatalogTitleRow"><div><span className="v3SectionIcon"><Layers3 size={20}/></span><h2><T id="software.catalog"/></h2></div><span><T id="software.publishedOnly"/></span></div>{products.length>0?<div className="v3ProductGrid">{products.map((product)=><ProductCard key={product.id} product={product}/>)}</div>:<div className="v3EmptyState"><Box size={30}/><span className="v3Kicker"><T id="software.kicker"/></span><h2><T id="software.emptyTitle"/></h2><p><T id="software.emptyText"/></p></div>}</div></section></div>; }
