import { isAdminAuthenticated } from "@/lib/server/admin-auth";
import { listOwnerCustomers } from "@/lib/server/owner-phase2";
import { parseOwnerQuery } from "@/lib/owner-phase2-query";
export const dynamic = "force-dynamic";
export async function GET(request:Request){
  if(!(await isAdminAuthenticated()))return Response.json({ok:false,error:"unauthorized"},{status:401,headers:{"Cache-Control":"no-store"}});
  try{
    const options=parseOwnerQuery(new URL(request.url).searchParams,"customers");
    return Response.json({ok:true,...await listOwnerCustomers(options)},{headers:{"Cache-Control":"no-store"}});
  }catch(error){
    const invalid=error instanceof Error&&error.message.startsWith("invalid_");
    if(!invalid)console.error("Owner customers failed",error);
    return Response.json({ok:false,error:invalid?(error as Error).message:"customers_unavailable"},{status:invalid?400:503,headers:{"Cache-Control":"no-store"}});
  }
}
