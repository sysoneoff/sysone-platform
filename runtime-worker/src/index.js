const encoder=new TextEncoder();

function b64urlToBytes(value){
  const normalized=value.replace(/-/g,"+").replace(/_/g,"/");
  const padded=normalized+"=".repeat((4-(normalized.length%4||4))%4);
  const raw=atob(padded);
  return Uint8Array.from(raw,c=>c.charCodeAt(0));
}
function decodePayload(encoded){
  return JSON.parse(new TextDecoder().decode(b64urlToBytes(encoded)));
}
async function verifyToken(token,secret){
  if(!token||!secret||secret.length<32)return null;
  const parts=token.split(".");
  if(parts.length!==2)return null;
  const [encoded,signature]=parts;
  try{
    const key=await crypto.subtle.importKey("raw",encoder.encode(secret),{name:"HMAC",hash:"SHA-256"},false,["verify"]);
    const ok=await crypto.subtle.verify("HMAC",key,b64urlToBytes(signature),encoder.encode(encoded));
    if(!ok)return null;
    const payload=decodePayload(encoded);
    if(payload?.v!==1||!payload.exp||payload.exp<Math.floor(Date.now()/1000))return null;
    return payload;
  }catch{return null}
}
function cookie(request,name){
  const raw=request.headers.get("cookie")||"";
  for(const part of raw.split(";")){
    const [k,...rest]=part.trim().split("=");
    if(k===name)return decodeURIComponent(rest.join("="));
  }
  return null;
}
function safeAssetPath(value){
  const path=(value||"index.html").replace(/^\/+/,"");
  if(!path||path.includes("\0")||path.split("/").some(p=>p===".."||p==="."))return null;
  return path;
}
function errorHtml(status,title,body){
  return new Response(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${title}</title>
  <style>body{margin:0;background:#090a0c;color:#eef1f5;font:14px system-ui;display:grid;place-items:center;min-height:100vh}.c{max-width:520px;padding:30px;border:1px solid #24282e;border-radius:16px;background:#111318}h1{font-size:26px}p{color:#9aa1ab;line-height:1.6}</style></head>
  <body><div class="c"><h1>${title}</h1><p>${body}</p></div></body></html>`,{status,headers:{"content-type":"text/html; charset=utf-8","cache-control":"no-store"}});
}
async function runtimeRow(env,slug){
  return env.SYSONE_DB.prepare(
    `SELECT p.id AS product_id,p.slug,rp.requires_auth,rp.requires_entitlement,rp.active_build_id,
            wb.r2_prefix,wb.entry_file,wb.status
     FROM products p
     JOIN product_runtime_profiles rp ON rp.product_id=p.id
     LEFT JOIN web_app_builds wb ON wb.id=rp.active_build_id
     WHERE p.slug=? AND p.published=1 AND rp.runtime_type='INTERNAL'
       AND rp.delivery_mode IN ('WEB','HYBRID')
     LIMIT 1`
  ).bind(slug).first();
}
function accessRequired(row){return Number(row?.requires_auth)===1||Number(row?.requires_entitlement)===1}

export default {
  async fetch(request,env){
    const url=new URL(request.url);

    if(url.pathname==="/health"){
      return Response.json({ok:true,service:"sysone-runtime",time:new Date().toISOString()},{headers:{"cache-control":"no-store"}});
    }

    const start=url.pathname.match(/^\/start\/([^/]+)\/?$/);
    if(start){
      const slug=decodeURIComponent(start[1]);
      const row=await runtimeRow(env,slug);
      if(!row||!row.active_build_id||!row.r2_prefix)return errorHtml(404,"Runtime topilmadi","Bu web mahsulot uchun aktiv build mavjud emas.");

      if(!accessRequired(row)){
        return Response.redirect(`${url.origin}/app/${encodeURIComponent(slug)}/`,302);
      }

      const token=url.searchParams.get("token")||"";
      const payload=await verifyToken(token,env.SYSONE_RUNTIME_SECRET);
      if(!payload||payload.slug!==slug||payload.productId!==row.product_id||payload.buildId!==row.active_build_id){
        return errorHtml(403,"Kirish rad etildi","Launch token noto‘g‘ri yoki muddati tugagan. SysOne orqali qayta ishga tushiring.");
      }

      const response=Response.redirect(`${url.origin}/app/${encodeURIComponent(slug)}/`,302);
      response.headers.append("Set-Cookie",`sysone_runtime=${encodeURIComponent(token)}; Path=/app/${encodeURIComponent(slug)}/; HttpOnly; Secure; SameSite=Lax; Max-Age=28800`);
      return response;
    }

    const app=url.pathname.match(/^\/app\/([^/]+)\/?(.*)$/);
    if(!app)return errorHtml(404,"SysOne Runtime","Noto‘g‘ri runtime manzili.");

    const slug=decodeURIComponent(app[1]);
    const row=await runtimeRow(env,slug);
    if(!row||!row.active_build_id||!row.r2_prefix||row.status!=="READY"){
      return errorHtml(404,"Build mavjud emas","Owner Tool’dan aktiv web build tanlang.");
    }

    if(accessRequired(row)){
      const token=cookie(request,"sysone_runtime");
      const payload=await verifyToken(token,env.SYSONE_RUNTIME_SECRET);
      if(!payload||payload.slug!==slug||payload.productId!==row.product_id||payload.buildId!==row.active_build_id){
        return errorHtml(401,"SysOne ID talab qilinadi","Bu mahsulotni sysone.top orqali ishga tushiring.");
      }
    }

    const rawPath=app[2]||row.entry_file||"index.html";
    const assetPath=safeAssetPath(rawPath);
    if(!assetPath)return errorHtml(400,"Noto‘g‘ri fayl","Runtime asset manzili xavfsizlik tekshiruvidan o‘tmadi.");

    let object=await env.SYSONE_RUNTIME.get(`${row.r2_prefix}/${assetPath}`);
    let servedPath=assetPath;
    if(!object && !assetPath.split("/").pop().includes(".")){
      servedPath=row.entry_file||"index.html";
      object=await env.SYSONE_RUNTIME.get(`${row.r2_prefix}/${servedPath}`);
    }
    if(!object)return new Response("Not found",{status:404});

    const headers=new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag",object.httpEtag);
    headers.set("x-content-type-options","nosniff");
    headers.set("referrer-policy","strict-origin-when-cross-origin");
    headers.set("cross-origin-resource-policy","cross-origin");
    headers.set("content-security-policy","frame-ancestors https://sysone.top https://*.sysone.top");
    if(servedPath==="index.html")headers.set("cache-control","no-cache");
    else if(!headers.has("cache-control"))headers.set("cache-control","public, max-age=31536000, immutable");

    return new Response(object.body,{headers});
  }
};
