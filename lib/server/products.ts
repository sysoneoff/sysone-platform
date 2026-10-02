import { getSysOneEnv, requireBinding } from "@/lib/server/cloudflare";

export type StorePlatform = {
  platform: string;
  architecture: string | null;
  minOs: string | null;
  minSystem: string | null;
  recommendedSystem: string | null;
};

export type StoreMedia = {
  id: string;
  type: string;
  key: string;
  alt: string | null;
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
  sortOrder: number;
};

export type StoreFeature = {
  id: string;
  title: string;
  description: string | null;
  sortOrder: number;
};

export type StorePromotion = {
  salePriceMinor: number;
  currency: string;
  startsAt: string | null;
  endsAt: string | null;
};

export type ProductRuntime = {
  deliveryMode: "DOWNLOAD" | "WEB" | "HYBRID";
  runtimeType: "NONE" | "INTERNAL" | "EXTERNAL";
  launchUrl: string | null;
  embedMode: "FRAME" | "NEW_TAB";
  activeBuildId: string | null;
  requiresAuth: boolean;
  requiresEntitlement: boolean;
  supportsFullscreen: boolean;
  healthcheckUrl: string | null;
};

export type PublicProduct = {
  id: string;
  slug: string;
  name: string;
  kind: string;
  category: string | null;
  description: string | null;
  status: string;
  pricingModel: string;
  priceMinor: number;
  currency: string;
  currentPriceMinor: number;
  featured: boolean;
  featuredRank: number;
  tagline: string | null;
  shortDescription: string | null;
  developerName: string | null;
  releaseDate: string | null;
  ageRating: string | null;
  platforms: StorePlatform[];
  media: StoreMedia[];
  features: StoreFeature[];
  tags: string[];
  promotion: StorePromotion | null;
  runtime: ProductRuntime | null;
  createdAt: string;
  updatedAt: string;
};

type ProductRow = {
  id:string;slug:string;name:string;kind:string;category:string|null;description:string|null;status:string;
  pricing_model:string;price_minor:number;currency:string;featured:number;
  tagline:string|null;short_description:string|null;developer_name:string|null;release_date:string|null;age_rating:string|null;featured_rank:number|null;
  created_at:string;updated_at:string;
};
type PlatformRow={product_id:string;platform:string;architecture:string|null;min_os:string|null;min_system:string|null;recommended_system:string|null};
type MediaRow={id:string;product_id:string;media_type:string;r2_key:string;alt_text:string|null;width:number|null;height:number|null;duration_seconds:number|null;sort_order:number};
type FeatureRow={id:string;product_id:string;title:string;description:string|null;sort_order:number};
type TagRow={product_id:string;tag:string};
type PromotionRow={product_id:string;sale_price_minor:number;currency:string;starts_at:string|null;ends_at:string|null};
type RuntimeRow={
  product_id:string;delivery_mode:string;runtime_type:string;launch_url:string|null;embed_mode:string;active_build_id:string|null;
  requires_auth:number;requires_entitlement:number;supports_fullscreen:number;healthcheck_url:string|null;
};

function getDb(){ return requireBinding(getSysOneEnv().SYSONE_DB,"SYSONE_DB"); }
function normalizeKind(kind?:string){ return kind?.trim().toUpperCase(); }
function placeholders(n:number){ return new Array(n).fill("?").join(","); }

async function hydrateProducts(rows:ProductRow[]):Promise<PublicProduct[]>{
  if(!rows.length) return [];
  const db=getDb(), ids=rows.map(r=>r.id), marks=placeholders(ids.length);

  const [platformResult,mediaResult,featureResult,tagResult,promotionResult]=await Promise.all([
    db.prepare(`SELECT product_id,platform,architecture,min_os,min_system,recommended_system FROM product_platforms WHERE product_id IN (${marks}) ORDER BY product_id,platform,architecture`).bind(...ids).all<PlatformRow>(),
    db.prepare(`SELECT id,product_id,media_type,r2_key,alt_text,width,height,duration_seconds,sort_order FROM product_media WHERE product_id IN (${marks}) ORDER BY product_id,sort_order,created_at`).bind(...ids).all<MediaRow>(),
    db.prepare(`SELECT id,product_id,title,description,sort_order FROM product_features WHERE product_id IN (${marks}) ORDER BY product_id,sort_order,created_at`).bind(...ids).all<FeatureRow>(),
    db.prepare(`SELECT product_id,tag FROM product_tags WHERE product_id IN (${marks}) ORDER BY product_id,tag`).bind(...ids).all<TagRow>(),
    db.prepare(`SELECT product_id,sale_price_minor,currency,starts_at,ends_at FROM product_promotions WHERE product_id IN (${marks}) AND enabled=1 AND (starts_at IS NULL OR datetime(starts_at)<=datetime('now')) AND (ends_at IS NULL OR datetime(ends_at)>datetime('now')) ORDER BY product_id,created_at DESC`).bind(...ids).all<PromotionRow>(),
  ]);

  let runtimeRows:RuntimeRow[]=[];
  try{
    const result=await db.prepare(`SELECT product_id,delivery_mode,runtime_type,launch_url,embed_mode,active_build_id,requires_auth,requires_entitlement,supports_fullscreen,healthcheck_url FROM product_runtime_profiles WHERE product_id IN (${marks})`).bind(...ids).all<RuntimeRow>();
    runtimeRows=result.results??[];
  }catch(error){
    console.warn("V4 runtime profile table is not available yet",error);
  }

  const platforms=new Map<string,StorePlatform[]>(), media=new Map<string,StoreMedia[]>(), features=new Map<string,StoreFeature[]>(), tags=new Map<string,string[]>();
  const promotions=new Map<string,StorePromotion>(), runtimes=new Map<string,ProductRuntime>();

  for(const r of platformResult.results??[]){
    const list=platforms.get(r.product_id)??[];
    list.push({platform:r.platform,architecture:r.architecture,minOs:r.min_os,minSystem:r.min_system,recommendedSystem:r.recommended_system});
    platforms.set(r.product_id,list);
  }
  for(const r of mediaResult.results??[]){
    const list=media.get(r.product_id)??[];
    list.push({id:r.id,type:r.media_type,key:r.r2_key,alt:r.alt_text,width:r.width,height:r.height,durationSeconds:r.duration_seconds,sortOrder:r.sort_order});
    media.set(r.product_id,list);
  }
  for(const r of featureResult.results??[]){
    const list=features.get(r.product_id)??[];
    list.push({id:r.id,title:r.title,description:r.description,sortOrder:r.sort_order});
    features.set(r.product_id,list);
  }
  for(const r of tagResult.results??[]){
    const list=tags.get(r.product_id)??[]; list.push(r.tag); tags.set(r.product_id,list);
  }
  for(const r of promotionResult.results??[]){
    if(!promotions.has(r.product_id)) promotions.set(r.product_id,{salePriceMinor:r.sale_price_minor,currency:r.currency,startsAt:r.starts_at,endsAt:r.ends_at});
  }
  for(const r of runtimeRows){
    runtimes.set(r.product_id,{
      deliveryMode:r.delivery_mode as ProductRuntime["deliveryMode"],
      runtimeType:r.runtime_type as ProductRuntime["runtimeType"],
      launchUrl:r.launch_url,
      embedMode:r.embed_mode as ProductRuntime["embedMode"],
      activeBuildId:r.active_build_id,
      requiresAuth:r.requires_auth===1,
      requiresEntitlement:r.requires_entitlement===1,
      supportsFullscreen:r.supports_fullscreen!==0,
      healthcheckUrl:r.healthcheck_url,
    });
  }

  return rows.map(row=>{
    const candidate=promotions.get(row.id)??null;
    const promotion=candidate&&candidate.currency===row.currency&&candidate.salePriceMinor<=row.price_minor?candidate:null;
    return {
      id:row.id,slug:row.slug,name:row.name,kind:row.kind,category:row.category,description:row.description,status:row.status,
      pricingModel:row.pricing_model,priceMinor:row.price_minor,currency:row.currency,currentPriceMinor:promotion?.salePriceMinor??row.price_minor,
      featured:row.featured===1,featuredRank:row.featured_rank??0,tagline:row.tagline,shortDescription:row.short_description,
      developerName:row.developer_name,releaseDate:row.release_date,ageRating:row.age_rating,
      platforms:platforms.get(row.id)??[],media:media.get(row.id)??[],features:features.get(row.id)??[],tags:tags.get(row.id)??[],
      promotion,runtime:runtimes.get(row.id)??null,createdAt:row.created_at,updatedAt:row.updated_at,
    };
  });
}

const BASE_PRODUCT_SELECT=`
 SELECT p.id,p.slug,p.name,p.kind,p.category,p.description,p.status,p.pricing_model,p.price_minor,p.currency,p.featured,
        sp.tagline,sp.short_description,sp.developer_name,sp.release_date,sp.age_rating,sp.featured_rank,
        p.created_at,p.updated_at
 FROM products p
 LEFT JOIN product_store_profiles sp ON sp.product_id=p.id
`;

export async function listPublishedProducts(kind?:string):Promise<PublicProduct[]>{
  const db=getDb(), normalized=normalizeKind(kind);
  const sql=`${BASE_PRODUCT_SELECT} WHERE p.published=1 ${normalized?"AND p.kind=?":""}
    ORDER BY COALESCE(sp.featured_rank,0) DESC,p.featured DESC,p.updated_at DESC,p.name ASC`;
  const statement=db.prepare(sql);
  const result=normalized?await statement.bind(normalized).all<ProductRow>():await statement.all<ProductRow>();
  return hydrateProducts(result.results??[]);
}

export async function getPublishedProductBySlug(slug:string):Promise<PublicProduct|null>{
  const value=slug.trim(); if(!value) return null;
  const row=await getDb().prepare(`${BASE_PRODUCT_SELECT} WHERE p.slug=? AND p.published=1 LIMIT 1`).bind(value).first<ProductRow>();
  if(!row) return null;
  const [product]=await hydrateProducts([row]);
  return product??null;
}
