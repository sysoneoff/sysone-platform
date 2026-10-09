import { isAdminAuthenticated } from "@/lib/server/admin-auth";
import { listOwnerOrders } from "@/lib/server/owner-phase2";
import { parseOwnerQuery } from "@/lib/owner-phase2-query";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  if (!(await isAdminAuthenticated())) return Response.json({ok:false,error:"unauthorized"},{status:401,headers:{"Cache-Control":"no-store"}});
  try {
    const options=parseOwnerQuery(new URL(request.url).searchParams,"orders");
    return Response.json({ok:true,...await listOwnerOrders(options)},{headers:{"Cache-Control":"no-store"}});
  } catch(error) {
    const invalid=error instanceof Error&&error.message.startsWith("invalid_");
    if(!invalid) console.error("Owner orders failed",error);
    return Response.json({ok:false,error:invalid?(error as Error).message:"orders_unavailable"},{status:invalid?400:503,headers:{"Cache-Control":"no-store"}});
  }
}
