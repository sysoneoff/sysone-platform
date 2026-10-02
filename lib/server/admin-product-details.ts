import { getSysOneEnv, requireBinding } from "@/lib/server/cloudflare";

function db(){return requireBinding(getSysOneEnv().SYSONE_DB,"SYSONE_DB");}
function text(v:unknown,max=500){return typeof v==="string"?v.trim().slice(0,max):"";}
function nullable(v:unknown,max=1000){const s=text(v,max);return s||null;}
function int(v:unknown,min=0,max=2_000_000_000){const n=Number(v);if(!Number.isInteger(n)||n<min||n>max)throw new Error("invalid_number");return n;}

export async function getAdminProductDetails(productId:string){
  const database=db();
  const product=await database.prepare("SELECT id,name,slug,kind FROM products WHERE id=? LIMIT 1").bind(productId).first<Record<string,unknown>>();
  if(!product)return null;
  const [profile,platforms,features,tags,media,promotions,relations,products]=await Promise.all([
    database.prepare(`SELECT tagline,short_description,developer_name,release_date,age_rating,featured_rank FROM product_store_profiles WHERE product_id=? LIMIT 1`).bind(productId).first<Record<string,unknown>>(),
    database.prepare(`SELECT id,platform,architecture,min_os,min_system,recommended_system FROM product_platforms WHERE product_id=? ORDER BY platform,architecture`).bind(productId).all<Record<string,unknown>>(),
    database.prepare(`SELECT id,title,description,sort_order FROM product_features WHERE product_id=? ORDER BY sort_order,created_at`).bind(productId).all<Record<string,unknown>>(),
    database.prepare(`SELECT tag FROM product_tags WHERE product_id=? ORDER BY tag`).bind(productId).all<{tag:string}>(),
    database.prepare(`SELECT id,media_type,r2_key,alt_text,width,height,duration_seconds,sort_order FROM product_media WHERE product_id=? ORDER BY sort_order,created_at`).bind(productId).all<Record<string,unknown>>(),
    database.prepare(`SELECT id,sale_price_minor,currency,starts_at,ends_at,enabled FROM product_promotions WHERE product_id=? ORDER BY created_at DESC`).bind(productId).all<Record<string,unknown>>(),
    database.prepare(`SELECT related_product_id,relation_type,sort_order FROM product_relations WHERE product_id=? ORDER BY sort_order`).bind(productId).all<Record<string,unknown>>(),
    database.prepare(`SELECT id,name,slug,kind FROM products WHERE id<>? ORDER BY name`).bind(productId).all<Record<string,unknown>>(),
  ]);
  return {
    product,
    profile: profile?{
      tagline:profile.tagline??"",shortDescription:profile.short_description??"",developerName:profile.developer_name??"",
      releaseDate:profile.release_date??"",ageRating:profile.age_rating??"",featuredRank:Number(profile.featured_rank??0),
    }:{tagline:"",shortDescription:"",developerName:"",releaseDate:"",ageRating:"",featuredRank:0},
    platforms:(platforms.results??[]).map((r:any)=>({id:r.id,platform:r.platform,architecture:r.architecture??"",minOs:r.min_os??"",minSystem:r.min_system??"",recommendedSystem:r.recommended_system??""})),
    features:(features.results??[]).map((r:any)=>({id:r.id,title:r.title,description:r.description??"",sortOrder:Number(r.sort_order??0)})),
    tags:(tags.results??[]).map((r:{tag:string})=>r.tag),
    media:(media.results??[]).map((r:any)=>({id:r.id,type:r.media_type,key:r.r2_key,alt:r.alt_text??"",width:r.width??null,height:r.height??null,durationSeconds:r.duration_seconds??null,sortOrder:Number(r.sort_order??0)})),
    promotions:promotions.results??[],
    relations:relations.results??[],
    availableProducts:products.results??[],
  };
}

export async function saveAdminProductDetails(productId:string,input:Record<string,any>){
  const database=db();
  const exists=await database.prepare("SELECT id FROM products WHERE id=? LIMIT 1").bind(productId).first<{id:string}>();
  if(!exists)throw new Error("product_not_found");

  const profile=input.profile??{};
  const featuredRank=int(profile.featuredRank??0,0,100000);
  const statements:any[]=[];
  statements.push(database.prepare(`INSERT INTO product_store_profiles
    (product_id,tagline,short_description,developer_name,release_date,age_rating,featured_rank,created_at,updated_at)
    VALUES (?,?,?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
    ON CONFLICT(product_id) DO UPDATE SET tagline=excluded.tagline,short_description=excluded.short_description,
      developer_name=excluded.developer_name,release_date=excluded.release_date,age_rating=excluded.age_rating,
      featured_rank=excluded.featured_rank,updated_at=CURRENT_TIMESTAMP`).bind(
        productId,nullable(profile.tagline,260),nullable(profile.shortDescription,800),nullable(profile.developerName,180),nullable(profile.releaseDate,40),nullable(profile.ageRating,60),featuredRank,
      ));

  statements.push(database.prepare("DELETE FROM product_platforms WHERE product_id=?").bind(productId));
  for(const row of Array.isArray(input.platforms)?input.platforms.slice(0,30):[]){
    const platform=text(row.platform,80);if(!platform)continue;
    statements.push(database.prepare(`INSERT INTO product_platforms(id,product_id,platform,architecture,min_os,min_system,recommended_system,created_at,updated_at)
      VALUES(?,?,?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`).bind(crypto.randomUUID(),productId,platform,nullable(row.architecture,80),nullable(row.minOs,160),nullable(row.minSystem,1500),nullable(row.recommendedSystem,1500)));
  }

  statements.push(database.prepare("DELETE FROM product_features WHERE product_id=?").bind(productId));
  for(const [index,row] of (Array.isArray(input.features)?input.features.slice(0,50):[]).entries()){
    const title=text(row.title,180);if(!title)continue;
    statements.push(database.prepare(`INSERT INTO product_features(id,product_id,title,description,sort_order,created_at) VALUES(?,?,?,?,?,CURRENT_TIMESTAMP)`).bind(crypto.randomUUID(),productId,title,nullable(row.description,1500),Number.isInteger(Number(row.sortOrder))?Number(row.sortOrder):index));
  }

  statements.push(database.prepare("DELETE FROM product_tags WHERE product_id=?").bind(productId));
  const tags=[...new Set((Array.isArray(input.tags)?input.tags:[]).map((v:any)=>text(v,60).toLowerCase()).filter(Boolean))].slice(0,40);
  for(const tag of tags)statements.push(database.prepare("INSERT INTO product_tags(product_id,tag,created_at) VALUES(?,?,CURRENT_TIMESTAMP)").bind(productId,tag));

  statements.push(database.prepare("DELETE FROM product_media WHERE product_id=?").bind(productId));
  for(const [index,row] of (Array.isArray(input.media)?input.media.slice(0,80):[]).entries()){
    const key=text(row.key,500);if(!key.startsWith("media/"))continue;
    const type=(text(row.type,30)||"SCREENSHOT").toUpperCase();
    statements.push(database.prepare(`INSERT INTO product_media(id,product_id,media_type,r2_key,alt_text,width,height,duration_seconds,sort_order,created_at)
      VALUES(?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)`).bind(crypto.randomUUID(),productId,type,key,nullable(row.alt,300),row.width?int(row.width,1,30000):null,row.height?int(row.height,1,30000):null,row.durationSeconds?int(row.durationSeconds,1,1000000):null,Number.isInteger(Number(row.sortOrder))?Number(row.sortOrder):index));
  }

  statements.push(database.prepare("DELETE FROM product_promotions WHERE product_id=?").bind(productId));
  const promo=input.promotion;
  if(promo&&promo.enabled!==false){
    const sale=int(promo.salePriceMinor??0,0,2_000_000_000);
    const currency=(text(promo.currency,8)||"UZS").toUpperCase();
    if(!/^[A-Z]{3}$/.test(currency))throw new Error("invalid_currency");
    statements.push(database.prepare(`INSERT INTO product_promotions(id,product_id,sale_price_minor,currency,starts_at,ends_at,enabled,created_at,updated_at)
      VALUES(?,?,?,?,?,?,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`).bind(crypto.randomUUID(),productId,sale,currency,nullable(promo.startsAt,60),nullable(promo.endsAt,60)));
  }

  statements.push(database.prepare("DELETE FROM product_relations WHERE product_id=?").bind(productId));
  const relationIds=[...new Set((Array.isArray(input.relatedProductIds)?input.relatedProductIds:[]).map((v:any)=>text(v,100)).filter(Boolean))].filter(id=>id!==productId).slice(0,20);
  relationIds.forEach((id,index)=>statements.push(database.prepare(`INSERT INTO product_relations(product_id,related_product_id,relation_type,sort_order,created_at) VALUES(?,?,'RELATED',?,CURRENT_TIMESTAMP)`).bind(productId,id,index)));

  await database.batch(statements);
  return getAdminProductDetails(productId);
}
