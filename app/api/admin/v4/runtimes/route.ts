import { isAdminAuthenticated } from "@/lib/server/admin-auth";
import { listRuntimeProducts } from "@/lib/server/admin-v4";

export const dynamic = "force-dynamic";
export async function GET(){
  if(!(await isAdminAuthenticated())) return Response.json({ok:false,error:"unauthorized"},{status:401});
  return Response.json({ok:true,products:await listRuntimeProducts()},{headers:{"Cache-Control":"no-store"}});
}
