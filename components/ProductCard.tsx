"use client";

import Link from "next/link";
import { ArrowUpRight, Box, Globe2, MonitorDown } from "lucide-react";

import { useI18n } from "@/components/I18nProvider";
import type { PublicProduct } from "@/lib/server/products";

function status(value:string){return value.replaceAll("_"," ").toLowerCase().replace(/\b\w/g,l=>l.toUpperCase())}
function href(product:PublicProduct){return product.kind==="GAME"?`/games/${product.slug}`:`/products/${product.slug}`}
function mediaUrl(key:string){return `/api/media/${key.split("/").map(encodeURIComponent).join("/")}`}
function media(product:PublicProduct){
  return product.media.find(m=>["COVER","HERO","BANNER","ICON"].includes(m.type.toUpperCase()))??product.media[0]??null;
}
function price(product:PublicProduct,lang:string){
  const model=product.pricingModel.toUpperCase();
  if(model==="FREE"||model==="FREEMIUM")return "Bepul";
  if(model==="CUSTOM")return "Kelishiladi";
  if(model==="TBD")return "Tez kunda";
  if(product.currentPriceMinor<=0)return "—";
  const locale:Record<string,string>={uz:"uz-UZ",en:"en-US",ru:"ru-RU",tr:"tr-TR",ar:"ar"};
  return new Intl.NumberFormat(locale[lang]??"uz-UZ",{style:"currency",currency:product.currency}).format(product.currentPriceMinor/100);
}

export function ProductCard({product}:{product:PublicProduct}){
  const {lang,t}=useI18n();
  const art=media(product);
  const description=product.shortDescription??product.tagline??product.description;
  const web=product.runtime&&["WEB","HYBRID"].includes(product.runtime.deliveryMode);
  const download=!product.runtime||["DOWNLOAD","HYBRID"].includes(product.runtime.deliveryMode);

  return <Link href={href(product)} className="v3ProductCard" aria-label={t("card.openProduct",{name:product.name})}>
    <div className="v3ProductArt">
      {art?<img src={mediaUrl(art.key)} alt={art.alt??product.name} loading="lazy"/>:<div className="v3ProductFallback"><span>{product.name.charAt(0).toUpperCase()}</span><Box size={22} strokeWidth={1.3}/></div>}
      <span className="v3CardStatus"><i/>{status(product.status)}</span>
      <span className="v3CardArrow"><ArrowUpRight size={17}/></span>
    </div>
    <div className="v3ProductContent">
      <div className="v3CardTopline"><span>{product.category??product.kind.replaceAll("_"," ")}</span>{product.developerName?<span>{product.developerName}</span>:null}</div>
      <h3>{product.name}</h3>
      {description?<p>{description}</p>:null}
      <div className="v4CardDelivery">
        {web?<span><Globe2 size={12}/>{product.kind==="GAME"?"Play online":"Web app"}</span>:null}
        {download?<span><MonitorDown size={12}/>Download</span>:null}
      </div>
      <div className="v3ProductFooter"><strong>{price(product,lang)}</strong><span>{product.runtime?.deliveryMode??"DOWNLOAD"}</span></div>
    </div>
  </Link>;
}
