import { isAdminAuthenticated, isSafeAdminMutation } from "@/lib/server/admin-auth";
import { getSysOneEnv, requireBinding } from "@/lib/server/cloudflare";
import { writeAdminAudit } from "@/lib/server/admin-products";

export const dynamic="force-dynamic";
const MAX=15*1024*1024;
const SAFE=new Set(["image/png","image/jpeg","image/webp","image/gif","image/svg+xml","video/mp4","video/webm"]);

function safeName(name:string){
  return name.replace(/\\/g,"/").split("/").pop()!.toLowerCase().replace(/[^a-z0-9._-]+/g,"-").slice(0,120)||"asset";
}

export async function POST(request:Request){
  if(!(await isAdminAuthenticated())) return Response.json({ok:false,error:"unauthorized"},{status:401});
  if(!isSafeAdminMutation(request)) return Response.json({ok:false,error:"forbidden"},{status:403});
  const form=await request.formData();
  const file=form.get("file");
  if(!(file instanceof File)) return Response.json({ok:false,error:"file_required"},{status:400});
  if(file.size<=0||file.size>MAX) return Response.json({ok:false,error:"file_too_large"},{status:413});
  if(!SAFE.has(file.type)) return Response.json({ok:false,error:"unsupported_media_type"},{status:415});

  const key=`media/${new Date().toISOString().slice(0,10)}/${crypto.randomUUID()}-${safeName(file.name)}`;
  const bucket=requireBinding(getSysOneEnv().SYSONE_ASSETS,"SYSONE_ASSETS");
  await bucket.put(key,file.stream(),{httpMetadata:{contentType:file.type,cacheControl:"public, max-age=31536000, immutable"}});
  await writeAdminAudit("media.upload","r2_object",key,{name:file.name,size:file.size,type:file.type});
  return Response.json({ok:true,key,url:`/api/media/${key.split("/").map(encodeURIComponent).join("/")}`},{status:201});
}
