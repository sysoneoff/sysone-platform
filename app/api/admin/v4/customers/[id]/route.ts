import { isAdminAuthenticated } from "@/lib/server/admin-auth";
import { getOwnerCustomer } from "@/lib/server/owner-phase2";
import { assertOwnerRecordId } from "@/lib/owner-phase2-query";
export const dynamic="force-dynamic";
type Context={params:Promise<{id:string}>};
export async function GET(_request:Request,context:Context){
  const headers={"Cache-Control":"no-store"};
  if(!(await isAdminAuthenticated()))return Response.json({ok:false,error:"unauthorized"},{status:401,headers});
  try{const id=assertOwnerRecordId((await context.params).id);const result=await getOwnerCustomer(id);return result?Response.json({ok:true,...result},{headers}):Response.json({ok:false,error:"customer_not_found"},{status:404,headers});}
  catch(error){const invalid=error instanceof Error&&error.message==="invalid_id";if(!invalid)console.error("Customer details failed",error);return Response.json({ok:false,error:invalid?"invalid_id":"customer_unavailable"},{status:invalid?400:503,headers});}
}
