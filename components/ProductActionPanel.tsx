import Link from "next/link";
import { Download, ExternalLink, Gamepad2, Play } from "lucide-react";

import { ProductPurchaseButton } from "@/components/ProductPurchaseButton";
import type { PublicProduct } from "@/lib/server/products";

function priceLabel(product:PublicProduct){
  const model=product.pricingModel.toUpperCase();
  if(model==="FREE"||model==="FREEMIUM") return "Bepul";
  if(model==="CUSTOM") return "Kelishiladi";
  if(model==="TBD") return "Tez kunda";
  if(product.currentPriceMinor<=0) return "Mavjud emas";
  return new Intl.NumberFormat("uz-UZ",{style:"currency",currency:product.currency}).format(product.currentPriceMinor/100);
}

export function ProductActionPanel({product}:{product:PublicProduct}){
  const runtime=product.runtime;
  const web=runtime&&["WEB","HYBRID"].includes(runtime.deliveryMode)&&runtime.runtimeType!=="NONE";
  const download=!runtime||["DOWNLOAD","HYBRID"].includes(runtime.deliveryMode);
  const isGame=product.kind==="GAME";

  return <div className="v4ProductActions">
    {web?<Link className="button buttonPrimary buttonLarge" href={`/launch/${encodeURIComponent(product.slug)}`}>
      {isGame?<Gamepad2 size={17}/>:<Play size={17}/>}
      {isGame?"O‘ynash":"Ishga tushirish"}
    </Link>:null}

    {download&&product.pricingModel.toUpperCase()==="ONE_TIME"&&product.currentPriceMinor>0
      ? <ProductPurchaseButton productSlug={product.slug} priceLabel={priceLabel(product)}/>
      : download?<Link className="button buttonGhost buttonLarge" href="/account#downloads"><Download size={16}/> {priceLabel(product)}</Link>:null}

    {runtime?.runtimeType==="EXTERNAL"&&runtime.embedMode==="NEW_TAB"&&runtime.launchUrl
      ? <a className="v4QuietLink" href={runtime.launchUrl} target="_blank" rel="noreferrer">Tashqi oynada ochish <ExternalLink size={14}/></a>
      : null}
  </div>;
}
