import { isAdminAuthenticated } from "@/lib/server/admin-auth";
import { getOwnerOverview } from "@/lib/server/admin-v4";

export const dynamic = "force-dynamic";
export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return Response.json({ ok:false,error:"unauthorized" }, { status:401 });
  }
  try {
    return Response.json({ ok:true, ...(await getOwnerOverview()) }, { headers:{ "Cache-Control":"no-store" } });
  } catch (error) {
    console.error("Owner overview failed", error);
    return Response.json({ ok:false,error:"overview_unavailable" }, { status:503 });
  }
}
