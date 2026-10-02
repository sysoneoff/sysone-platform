import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Globe2, MonitorDown, Play, Sparkles } from "lucide-react";

import { ProductCard } from "@/components/ProductCard";
import { listPublishedProducts, type PublicProduct } from "@/lib/server/products";

export const dynamic="force-dynamic";
export const metadata:Metadata={
  title:{absolute:"SysOne — Dasturlar, web ilovalar va o‘yinlar"},
  description:"SysOne dasturlari, web ilovalari, o‘yinlari va raqamli mahsulotlari — bitta platformada.",
};

function newest(items:PublicProduct[]){return [...items].sort((a,b)=>+new Date(b.updatedAt)-+new Date(a.updatedAt));}
function description(p:PublicProduct){return p.shortDescription??p.tagline??p.description??"";}

export default async function HomePage(){
  const products=await listPublishedProducts();
  const featured=products.filter(p=>p.featured||p.featuredRank>0).sort((a,b)=>b.featuredRank-a.featuredRank);
  const hero=featured[0]??newest(products)[0]??null;
  const webApps=products.filter(p=>p.kind!=="GAME"&&p.runtime&&["WEB","HYBRID"].includes(p.runtime.deliveryMode));
  const webGames=products.filter(p=>p.kind==="GAME"&&p.runtime&&["WEB","HYBRID"].includes(p.runtime.deliveryMode));
  const latest=newest(products).slice(0,6);

  return <div className="v4Home">
    <section className="v4Hero">
      <div className="shell v4HeroLayout">
        <div className="v4HeroCopy">
          <span className="v4Overline">SYSONE / DIGITAL PRODUCTS</span>
          <h1>Yuklab oling.<br/><span>Yoki shu yerning o‘zida ishlating.</span></h1>
          <p>
            Dasturlar, web ilovalar, o‘yinlar va AI vositalari. SysOne mahsulotlari
            bitta katalog, bitta akkaunt va bitta boshqaruv tizimida.
          </p>
          <div className="v4HeroActions">
            <Link href="/marketplace" className="button buttonPrimary buttonLarge">Katalogni ochish <ArrowRight size={16}/></Link>
            <Link href="/games" className="button buttonGhost buttonLarge">O‘yinlar</Link>
          </div>
          <div className="v4HeroMeta">
            <span><Globe2 size={14}/> Web’da ishlaydi</span>
            <span><MonitorDown size={14}/> Yuklab olinadigan buildlar</span>
            <span><Sparkles size={14}/> SysOne ID bilan birlashgan</span>
          </div>
        </div>

        <aside className="v4FeaturePanel">
          <div className="v4PanelHead">
            <span>HOZIR SYSONE’DA</span>
            <small>{products.length} mahsulot</small>
          </div>
          {hero?<Link href={hero.kind==="GAME"?`/games/${hero.slug}`:`/products/${hero.slug}`} className="v4FeaturedProduct">
            <div className="v4FeaturedVisual">
              {hero.media[0]?<img src={`/api/media/${hero.media[0].key.split("/").map(encodeURIComponent).join("/")}`} alt={hero.media[0].alt??hero.name}/>:<span>{hero.name.slice(0,1)}</span>}
            </div>
            <div className="v4FeaturedBody">
              <small>{hero.kind==="GAME"?"O‘YIN":"MAHSULOT"} · {hero.category??"SysOne"}</small>
              <h2>{hero.name}</h2>
              {description(hero)?<p>{description(hero)}</p>:null}
              <span className="v4InlineAction">{hero.runtime?.deliveryMode==="WEB"?(hero.kind==="GAME"?"O‘ynash":"Ishga tushirish"):"Batafsil"} <ArrowRight size={14}/></span>
            </div>
          </Link>:<div className="v4EmptyFeature">
            <strong>Katalog nashrga tayyor.</strong>
            <p>Owner Tool’dan birinchi mahsulot yoki o‘yinni nashr qiling.</p>
          </div>}
        </aside>
      </div>
    </section>

    <section className="v4ModeStrip">
      <div className="shell">
        <Link href="/products"><strong>Software</strong><span>Windows · Android · Web</span></Link>
        <Link href="/games"><strong>Games</strong><span>Web · PC · Mobile</span></Link>
        <Link href="/ai"><strong>AI</strong><span>Tools · assistants</span></Link>
        <Link href="/contact"><strong>Custom</strong><span>Buyurtma asosida tizimlar</span></Link>
      </div>
    </section>

    {webApps.length?<section className="v4Shelf">
      <div className="shell">
        <header className="v4SectionHeader">
          <div><span className="v4Overline">WEB APPS</span><h2>Yuklamasdan ishlating.</h2><p>Brauzerda bir zumda ochiladigan SysOne ilovalari.</p></div>
          <Link href="/products">Barchasi <ArrowRight size={15}/></Link>
        </header>
        <div className="v4ProductGrid">{webApps.slice(0,6).map(p=><ProductCard key={p.id} product={p}/>)}</div>
      </div>
    </section>:null}

    {webGames.length?<section className="v4Shelf v4ShelfAlt">
      <div className="shell">
        <header className="v4SectionHeader">
          <div><span className="v4Overline">WEB GAMES</span><h2>Bosing va o‘ynang.</h2><p>O‘rnatishsiz, SysOne platformasidan chiqmasdan.</p></div>
          <Link href="/games">O‘yinlar <ArrowRight size={15}/></Link>
        </header>
        <div className="v4ProductGrid">{webGames.slice(0,6).map(p=><ProductCard key={p.id} product={p}/>)}</div>
      </div>
    </section>:null}

    {latest.length?<section className="v4Shelf">
      <div className="shell">
        <header className="v4SectionHeader">
          <div><span className="v4Overline">YANGI VA YANGILANGAN</span><h2>So‘nggi relizlar.</h2></div>
          <Link href="/marketplace">Katalog <ArrowRight size={15}/></Link>
        </header>
        <div className="v4ProductGrid">{latest.map(p=><ProductCard key={p.id} product={p}/>)}</div>
      </div>
    </section>:null}

    <section className="v4Closing">
      <div className="shell v4ClosingInner">
        <div><span className="v4Overline">SYSONE FOR BUSINESS</span><h2>Tayyor mahsulot yetarli emasmi?</h2><p>Biznesingiz uchun web, desktop, mobile yoki AI tizimini alohida ishlab chiqamiz.</p></div>
        <Link href="/contact" className="button buttonPrimary">Loyiha yuborish <ArrowRight size={16}/></Link>
      </div>
    </section>
  </div>;
}
