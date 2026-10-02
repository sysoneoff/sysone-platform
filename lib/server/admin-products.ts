import { getSysOneEnv, requireBinding } from "@/lib/server/cloudflare";

export type AdminProduct={
  id:string;slug:string;name:string;kind:string;category:string|null;description:string|null;status:string;
  pricingModel:string;priceMinor:number;currency:string;featured:boolean;published:boolean;createdAt:string;updatedAt:string;
};
type ProductRow={
  id:string;slug:string;name:string;kind:string;category:string|null;description:string|null;status:string;
  pricing_model:string;price_minor:number;currency:string;featured:number;published:number;created_at:string;updated_at:string;
};
export type ProductMutationInput={
  slug?:string;name?:string;kind?:string;category?:string|null;description?:string|null;status?:string;
  pricingModel?:string;priceMinor?:number;currency?:string;featured?:boolean;published?:boolean;
};

function db(){return requireBinding(getSysOneEnv().SYSONE_DB,"SYSONE_DB")}
function map(row:ProductRow):AdminProduct{return{
  id:row.id,slug:row.slug,name:row.name,kind:row.kind,category:row.category,description:row.description,status:row.status,
  pricingModel:row.pricing_model,priceMinor:row.price_minor,currency:row.currency,featured:row.featured===1,published:row.published===1,
  createdAt:row.created_at,updatedAt:row.updated_at,
}}
function clean(v:unknown,max=180){return typeof v==="string"?v.trim().slice(0,max):""}
function nullable(v:unknown,max=3000){const x=clean(v,max);return x||null}
export function makeSlug(value:string){return value.normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,80)}

function normalize(input:ProductMutationInput,partial=false){
  const out:ProductMutationInput={};
  if(!partial||input.name!==undefined){const v=clean(input.name,120);if(!v)throw new Error("name_required");out.name=v}
  if(!partial||input.slug!==undefined||input.name!==undefined){const v=makeSlug(clean(input.slug,100)||clean(input.name,120));if(!v)throw new Error("slug_required");out.slug=v}
  if(!partial||input.kind!==undefined){const v=clean(input.kind,24).toUpperCase()||"SOFTWARE";if(!["SOFTWARE","GAME","AI_TOOL","DIGITAL_PRODUCT"].includes(v))throw new Error("invalid_kind");out.kind=v}
  if(!partial||input.status!==undefined){const v=clean(input.status,32).toUpperCase()||"DRAFT";if(!["DRAFT","ALPHA","BETA","COMING_SOON","ACTIVE","RELEASED","ARCHIVED"].includes(v))throw new Error("invalid_status");out.status=v}
  if(!partial||input.pricingModel!==undefined){const v=clean(input.pricingModel,32).toUpperCase()||"FREE";if(!["FREE","FREEMIUM","ONE_TIME","SUBSCRIPTION","CUSTOM","TBD"].includes(v))throw new Error("invalid_pricing_model");out.pricingModel=v}
  if(!partial||input.currency!==undefined){const v=clean(input.currency,8).toUpperCase()||"UZS";if(!/^[A-Z]{3}$/.test(v))throw new Error("invalid_currency");out.currency=v}
  if(!partial||input.priceMinor!==undefined){const v=Number(input.priceMinor??0);if(!Number.isInteger(v)||v<0||v>2_000_000_000)throw new Error("invalid_price");out.priceMinor=v}
  if(!partial||input.category!==undefined)out.category=nullable(input.category,100);
  if(!partial||input.description!==undefined)out.description=nullable(input.description,4000);
  if(!partial||input.featured!==undefined)out.featured=Boolean(input.featured);
  if(!partial||input.published!==undefined)out.published=Boolean(input.published);
  return out;
}
export async function listAdminProducts(){
  const result=await db().prepare(`SELECT id,slug,name,kind,category,description,status,pricing_model,price_minor,currency,featured,published,created_at,updated_at FROM products ORDER BY updated_at DESC,name ASC`).all<ProductRow>();
  return (result.results??[]).map(map);
}
export async function getAdminProductById(id:string){
  const row=await db().prepare(`SELECT id,slug,name,kind,category,description,status,pricing_model,price_minor,currency,featured,published,created_at,updated_at FROM products WHERE id=? LIMIT 1`).bind(id).first<ProductRow>();
  return row?map(row):null;
}
export async function createAdminProduct(input:ProductMutationInput){
  const v=normalize(input),id=crypto.randomUUID();
  await db().prepare(`INSERT INTO products(id,slug,name,kind,category,description,status,pricing_model,price_minor,currency,featured,published,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`)
    .bind(id,v.slug,v.name,v.kind,v.category,v.description,v.status,v.pricingModel,v.priceMinor,v.currency,v.featured?1:0,v.published?1:0).run();
  return getAdminProductById(id);
}
export async function updateAdminProduct(id:string,input:ProductMutationInput){
  const v=normalize(input,true),entries=Object.entries(v);if(!entries.length)return getAdminProductById(id);
  const cols:Record<string,string>={slug:"slug",name:"name",kind:"kind",category:"category",description:"description",status:"status",pricingModel:"pricing_model",priceMinor:"price_minor",currency:"currency",featured:"featured",published:"published"};
  const sets:string[]=[],bindings:unknown[]=[];
  for(const [key,raw] of entries){const col=cols[key];if(!col)continue;sets.push(`${col}=?`);bindings.push(typeof raw==="boolean"?(raw?1:0):raw)}
  sets.push("updated_at=CURRENT_TIMESTAMP");bindings.push(id);
  await db().prepare(`UPDATE products SET ${sets.join(",")} WHERE id=?`).bind(...bindings).run();
  return getAdminProductById(id);
}
export async function deleteAdminProduct(id:string){
  const result=await db().prepare("DELETE FROM products WHERE id=?").bind(id).run();
  return Number(result.meta.changes??0)>0;
}
export async function writeAdminAudit(action:string,entityType:string,entityId?:string,metadata?:unknown){
  try{
    await db().prepare(`INSERT INTO audit_logs(id,actor_user_id,action,entity_type,entity_id,metadata_json,created_at) VALUES(?,NULL,?,?,?,?,CURRENT_TIMESTAMP)`)
      .bind(crypto.randomUUID(),action.slice(0,100),entityType.slice(0,80),entityId??null,metadata===undefined?null:JSON.stringify(metadata).slice(0,4000)).run();
  }catch(error){console.error("Failed to write admin audit log",error)}
}
