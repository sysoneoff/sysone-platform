import { getSysOneEnv, requireBinding } from "@/lib/server/cloudflare";
import { getCurrentUser } from "@/lib/server/user-auth";
import type { PublicProduct } from "@/lib/server/products";
import { createRuntimeToken } from "@/lib/server/runtime-token";

function db(){ return requireBinding(getSysOneEnv().SYSONE_DB,"SYSONE_DB"); }

export type LaunchAccess =
  | { ok:true; url:string; embedMode:"FRAME"|"NEW_TAB"; supportsFullscreen:boolean }
  | { ok:false; reason:"not_web"|"runtime_missing"|"login_required"|"entitlement_required" };

export async function getLaunchAccess(product:PublicProduct):Promise<LaunchAccess>{
  const runtime=product.runtime;
  if(!runtime || !["WEB","HYBRID"].includes(runtime.deliveryMode)) return {ok:false,reason:"not_web"};
  if(runtime.runtimeType==="NONE") return {ok:false,reason:"runtime_missing"};

  const needsUser=runtime.requiresAuth||runtime.requiresEntitlement;
  const user=needsUser?await getCurrentUser():null;
  if(runtime.requiresAuth&&!user) return {ok:false,reason:"login_required"};

  if(runtime.requiresEntitlement){
    if(!user) return {ok:false,reason:"login_required"};
    const entitlement=await db().prepare(
      `SELECT id FROM entitlements
       WHERE user_id=? AND product_id=? AND status='ACTIVE'
         AND (ends_at IS NULL OR datetime(ends_at)>datetime('now'))
       LIMIT 1`,
    ).bind(user.id,product.id).first<{id:string}>();
    if(!entitlement) return {ok:false,reason:"entitlement_required"};
  }

  if(runtime.runtimeType==="EXTERNAL"){
    if(!runtime.launchUrl) return {ok:false,reason:"runtime_missing"};
    return {ok:true,url:runtime.launchUrl,embedMode:runtime.embedMode,supportsFullscreen:runtime.supportsFullscreen};
  }

  if(!runtime.activeBuildId) return {ok:false,reason:"runtime_missing"};
  const origin=(process.env.NEXT_PUBLIC_RUNTIME_ORIGIN||"https://runtime.sysone.top").replace(/\/+$/,"");
  if(!needsUser){
    return {ok:true,url:`${origin}/app/${encodeURIComponent(product.slug)}/`,embedMode:runtime.embedMode,supportsFullscreen:runtime.supportsFullscreen};
  }

  const token=await createRuntimeToken({
    productId:product.id,
    slug:product.slug,
    userId:user?.id??null,
    buildId:runtime.activeBuildId,
  });
  return {
    ok:true,
    url:`${origin}/start/${encodeURIComponent(product.slug)}?token=${encodeURIComponent(token)}`,
    embedMode:runtime.embedMode,
    supportsFullscreen:runtime.supportsFullscreen,
  };
}
