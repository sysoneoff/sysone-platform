import { isAdminAuthenticated, isSafeAdminMutation } from "@/lib/server/admin-auth";
import { createAnnouncement, listAdminAnnouncements } from "@/lib/server/announcements";
import { writeAdminAudit } from "@/lib/server/admin-products";

export const dynamic = "force-dynamic";
function unauthorized(){ return Response.json({ok:false,error:"unauthorized"},{status:401}); }

export async function GET(){
  if(!(await isAdminAuthenticated())) return unauthorized();
  return Response.json({ok:true,announcements:await listAdminAnnouncements()},{headers:{"Cache-Control":"no-store"}});
}
export async function POST(request:Request){
  if(!(await isAdminAuthenticated())) return unauthorized();
  if(!isSafeAdminMutation(request)) return Response.json({ok:false,error:"forbidden"},{status:403});
  try{
    const announcement=await createAnnouncement(await request.json());
    await writeAdminAudit("announcement.create","announcement",announcement?.id);
    return Response.json({ok:true,announcement},{status:201});
  }catch(error){
    const message=error instanceof Error?error.message:"announcement_create_failed";
    return Response.json({ok:false,error:message},{status:/required|invalid/.test(message)?400:500});
  }
}
