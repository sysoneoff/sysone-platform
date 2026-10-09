import { isAdminAuthenticated } from "@/lib/server/admin-auth";
import { getOwnerAnalytics } from "@/lib/server/owner-phase2";
export const dynamic = "force-dynamic";
export async function GET() {
  if (!(await isAdminAuthenticated())) return Response.json({ok:false,error:"unauthorized"},{status:401,headers:{"Cache-Control":"no-store"}});
  try { return Response.json({ok:true,...await getOwnerAnalytics()},{headers:{"Cache-Control":"no-store"}}); }
  catch(error) { console.error("Owner analytics failed",error); return Response.json({ok:false,error:"analytics_unavailable"},{status:503,headers:{"Cache-Control":"no-store"}}); }
}
