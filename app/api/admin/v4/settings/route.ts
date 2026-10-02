import { isAdminAuthenticated, isSafeAdminMutation } from "@/lib/server/admin-auth";
import { getPlatformSettings, setPlatformSetting } from "@/lib/server/admin-v4";
import { writeAdminAudit } from "@/lib/server/admin-products";

export const dynamic = "force-dynamic";
export async function GET(){
  if(!(await isAdminAuthenticated())) return Response.json({ok:false,error:"unauthorized"},{status:401});
  return Response.json({ok:true,settings:await getPlatformSettings()},{headers:{"Cache-Control":"no-store"}});
}
export async function PUT(request:Request){
  if(!(await isAdminAuthenticated())) return Response.json({ok:false,error:"unauthorized"},{status:401});
  if(!isSafeAdminMutation(request)) return Response.json({ok:false,error:"forbidden"},{status:403});
  try{
    const body=await request.json() as {key?:string;value?:unknown};
    await setPlatformSetting(body.key,body.value);
    await writeAdminAudit("settings.update","platform_setting",body.key);
    return Response.json({ok:true});
  }catch(error){
    const message=error instanceof Error?error.message:"settings_update_failed";
    return Response.json({ok:false,error:message},{status:/invalid|too_large/.test(message)?400:500});
  }
}
