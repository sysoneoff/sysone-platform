import type { Metadata } from "next";
import type { LucideIcon } from "lucide-react";
import { Box, BrainCircuit, Gamepad2, PackageOpen, ShoppingBag } from "lucide-react";

import { ProductCard } from "@/components/ProductCard";
import { T } from "@/components/T";
import type { TranslationKey } from "@/lib/i18n";
import { listPublishedProducts, type PublicProduct } from "@/lib/server/products";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Store", description: "Browse published SysOne software, games, AI tools and digital products." };

type StoreSection = { kind: string; titleKey: TranslationKey; descriptionKey: TranslationKey; icon: LucideIcon };
const STORE_SECTIONS: StoreSection[] = [
  { kind: "SOFTWARE", titleKey: "store.software", descriptionKey: "store.softwareDesc", icon: Box },
  { kind: "GAME", titleKey: "store.games", descriptionKey: "store.gamesDesc", icon: Gamepad2 },
  { kind: "AI_TOOL", titleKey: "store.aiTools", descriptionKey: "store.aiToolsDesc", icon: BrainCircuit },
  { kind: "DIGITAL_PRODUCT", titleKey: "store.digitalProducts", descriptionKey: "store.digitalProductsDesc", icon: PackageOpen },
];
function groupProducts(products: PublicProduct[]) { const groups = new Map<string, PublicProduct[]>(); for (const product of products) { const list = groups.get(product.kind) ?? []; list.push(product); groups.set(product.kind, list); } return groups; }
function sectionId(kind: string) { return kind.toLowerCase().replaceAll("_", "-"); }

export default async function MarketplacePage() {
  const products = await listPublishedProducts();
  const groups = groupProducts(products);
  const activeSections = STORE_SECTIONS.filter((section) => (groups.get(section.kind) ?? []).length > 0);
  return <div className="pageWrap v3StorePage">
    <section className="v3PageHero"><div className="shell v3PageHeroLayout"><div>
      <span className="v3HeroIcon"><ShoppingBag size={24} /></span><span className="v3Kicker"><T id="store.kicker" /></span>
      <h1><T id="store.hero" /></h1><p><T id="store.description" /></p>
    </div><div className="v3HeroCount"><strong>{products.length}</strong><span><T id="store.published" values={{ count: products.length }} /></span></div></div></section>
    {activeSections.length > 0 && <nav className="v3CatalogNav shell" aria-label="Store categories">{activeSections.map(({kind,titleKey,icon:Icon}) => <a href={`#${sectionId(kind)}`} key={kind}><Icon size={17}/><T id={titleKey}/><span>{(groups.get(kind)??[]).length}</span></a>)}</nav>}
    <section className="v3CatalogPageBody"><div className="shell">{products.length===0 ? <div className="v3EmptyState"><ShoppingBag size={30}/><span className="v3Kicker"><T id="store.emptyKicker"/></span><h2><T id="store.emptyTitle"/></h2><p><T id="store.emptyText"/></p></div> : activeSections.map((section)=>{const sectionProducts=groups.get(section.kind)??[]; const Icon=section.icon; return <section key={section.kind} className="v3MarketSection" id={sectionId(section.kind)}><header className="v3MarketSectionHead"><div><span className="v3SectionIcon"><Icon size={20}/></span><span><h2><T id={section.titleKey}/></h2><p><T id={section.descriptionKey}/></p></span></div><strong>{sectionProducts.length}</strong></header><div className="v3ProductGrid">{sectionProducts.map((product)=><ProductCard key={product.id} product={product}/>)}</div></section>})}</div></section>
  </div>;
}
