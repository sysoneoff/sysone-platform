import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, Code2, Gamepad2, Globe2, MonitorDown, Sparkles } from "lucide-react";

import { ProductCard } from "@/components/ProductCard";
import { getPublicUiConfig } from "@/lib/server/platform-config";
import { listPublishedProducts, type PublicProduct } from "@/lib/server/products";

export const dynamic="force-dynamic";
export const metadata:Metadata={
  title:{absolute:"SysOne - Dasturlar, web ilovalar va o'yinlar"},
  description:"SysOne dasturlari, web ilovalari, o'yinlari va raqamli mahsulotlari - bitta platformada.",
};

function newest(items:PublicProduct[]){return [...items].sort((a,b)=>+new Date(b.updatedAt)-+new Date(a.updatedAt));}
function description(p:PublicProduct){return p.shortDescription??p.tagline??p.description??"";}

export default async function HomePage(){
  const [products,ui]=await Promise.all([listPublishedProducts(),getPublicUiConfig()]);
  const home=ui.home;
  const featured=products.filter(p=>p.featured||p.featuredRank>0).sort((a,b)=>b.featuredRank-a.featuredRank);
  const hero=featured[0]??newest(products)[0]??null;
  const webApps=products.filter(p=>p.kind!=="GAME"&&p.runtime&&["WEB","HYBRID"].includes(p.runtime.deliveryMode));
  const webGames=products.filter(p=>p.kind==="GAME"&&p.runtime&&["WEB","HYBRID"].includes(p.runtime.deliveryMode));
  const latest=newest(products).slice(0,6);

  return <div className="v4Home">
    <section className="v4Hero">
      <div className="shell v4HeroLayout">
        <div className="v4HeroCopy">
          <span className="v4Overline">{home.overline}</span>
          <h1>{home.titleLine1}<br/><span>{home.titleLine2}</span></h1>
          <p>{home.description}</p>
          <div className="v4HeroActions">
            <Link href={home.primaryHref} className="button buttonPrimary buttonLarge">{home.primaryLabel} <ArrowRight size={16}/></Link>
            <Link href={home.secondaryHref} className="button buttonGhost buttonLarge">{home.secondaryLabel}</Link>
          </div>
          <div className="v4HeroMeta">
            <span><Globe2 size={14}/> Web'da ishlaydi</span>
            <span><MonitorDown size={14}/> Yuklab olinadigan buildlar</span>
            <span><Sparkles size={14}/> SysOne ID bilan birlashgan</span>
          </div>
        </div>

        <aside className="v4FeaturePanel">
          <div className="v4PanelHead">
            <span>HOZIR SYSONE'DA</span>
            <small>{products.length} mahsulot</small>
          </div>
          {hero?<Link href={hero.kind==="GAME"?`/games/${hero.slug}`:`/products/${hero.slug}`} className="v4FeaturedProduct">
            <div className="v4FeaturedVisual">
              {hero.media[0]?<img src={`/api/media/${hero.media[0].key.split("/").map(encodeURIComponent).join("/")}`} alt={hero.media[0].alt??hero.name}/>:<span>{hero.name.slice(0,1)}</span>}
            </div>
            <div className="v4FeaturedBody">
              <small>{hero.kind==="GAME"?"O'YIN":"MAHSULOT"} / {hero.category??"SysOne"}</small>
              <h2>{hero.name}</h2>
              {description(hero)?<p>{description(hero)}</p>:null}
              <span className="v4InlineAction">{hero.runtime?.deliveryMode==="WEB"?(hero.kind==="GAME"?"O'ynash":"Ishga tushirish"):"Batafsil"} <ArrowRight size={14}/></span>
            </div>
          </Link>:<div className="v4EmptyFeature">
            <strong>Katalog nashrga tayyor.</strong>
            <p>Owner Tool'dan birinchi mahsulot yoki o'yinni nashr qiling.</p>
          </div>}
        </aside>
      </div>
    </section>

    <section className="v4ModeStrip">
      <div className="shell">
        <Link href="/products">
          <span className="v43ModeIcon"><Code2 size={18}/></span>
          <span className="v43ModeText"><strong>Software</strong><small>Windows / Android / Web</small></span>
          <ArrowRight className="v43ModeArrow" size={14}/>
        </Link>
        <Link href="/games">
          <span className="v43ModeIcon"><Gamepad2 size={18}/></span>
          <span className="v43ModeText"><strong>Games</strong><small>Web / PC / Mobile</small></span>
          <ArrowRight className="v43ModeArrow" size={14}/>
        </Link>
        <Link href="/ai">
          <span className="v43ModeIcon"><Sparkles size={18}/></span>
          <span className="v43ModeText"><strong>AI</strong><small>Tools / assistants</small></span>
          <ArrowRight className="v43ModeArrow" size={14}/>
        </Link>
        <Link href="/contact">
          <span className="v43ModeIcon"><BriefcaseBusiness size={18}/></span>
          <span className="v43ModeText"><strong>Custom</strong><small>Buyurtma asosida tizimlar</small></span>
          <ArrowRight className="v43ModeArrow" size={14}/>
        </Link>
      </div>
    </section>

    {home.showRuntimeBand?<section className="v41RuntimeBand">
      <div className="shell v41RuntimeBandInner">
        <div>
          <span className="v4Overline">SYSONE WEB RUNTIME</span>
          <h2>O'rnating yoki darhol ishga tushiring.</h2>
          <p>Web dastur va o'yinlar `runtime.sysone.top` orqali SysOne ichida ishlaydi. Download mahsulotlar esa odatdagi release oqimida qoladi.</p>
        </div>
        <div className="v41RuntimeStats">
          <Link href="/products"><Globe2 size={17}/><span><strong>{webApps.length}</strong><small>Web dastur</small></span></Link>
          <Link href="/games"><Gamepad2 size={17}/><span><strong>{webGames.length}</strong><small>Web o'yin</small></span></Link>
        </div>
      </div>
    </section>:null}

    {home.showWebApps&&webApps.length?<section className="v4Shelf">
      <div className="shell">
        <header className="v4SectionHeader">
          <div><span className="v4Overline">WEB APPS</span><h2>Yuklamasdan ishlating.</h2><p>Brauzerda bir zumda ochiladigan SysOne ilovalari.</p></div>
          <Link href="/products">Barchasi <ArrowRight size={15}/></Link>
        </header>
        <div className="v4ProductGrid">{webApps.slice(0,6).map(p=><ProductCard key={p.id} product={p}/>)}</div>
      </div>
    </section>:null}

    {home.showWebGames&&webGames.length?<section className="v4Shelf v4ShelfAlt">
      <div className="shell">
        <header className="v4SectionHeader">
          <div><span className="v4Overline">WEB GAMES</span><h2>Bosing va o'ynang.</h2><p>O'rnatishsiz, SysOne platformasidan chiqmasdan.</p></div>
          <Link href="/games">O'yinlar <ArrowRight size={15}/></Link>
        </header>
        <div className="v4ProductGrid">{webGames.slice(0,6).map(p=><ProductCard key={p.id} product={p}/>)}</div>
      </div>
    </section>:null}

    {latest.length?<section className="v4Shelf">
      <div className="shell">
        <header className="v4SectionHeader">
          <div><span className="v4Overline">YANGI VA YANGILANGAN</span><h2>So'nggi relizlar.</h2></div>
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
