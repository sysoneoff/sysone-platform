import { isAdminAuthenticated, isSafeAdminMutation } from "@/lib/server/admin-auth";
import { writeAdminAudit } from "@/lib/server/admin-products";
import { cancelPendingOrder, getOwnerOrder } from "@/lib/server/owner-phase2";
import { assertOwnerRecordId } from "@/lib/owner-phase2-query";
export const dynamic = "force-dynamic";
type Context={params:Promise<{id:string}>};
const response=(data:Record<string,unknown>,status=200)=>Response.json(data,{status,headers:{"Cache-Control":"no-store"}});
export async function GET(_request:Request,context:Context){
  if(!(await isAdminAuthenticated())) return response({ok:false,error:"unauthorized"},401);
  try{const id=assertOwnerRecordId((await context.params).id);const order=await getOwnerOrder(id);return order?response({ok:true,order}):response({ok:false,error:"order_not_found"},404);}
  catch(error){const invalid=error instanceof Error&&error.message==="invalid_id";if(!invalid)console.error("Order details failed",error);return response({ok:false,error:invalid?"invalid_id":"order_unavailable"},invalid?400:503);}
}
export async function PATCH(request:Request,context:Context){
  if(!(await isAdminAuthenticated())) return response({ok:false,error:"unauthorized"},401);
  if(!isSafeAdminMutation(request)) return response({ok:false,error:"forbidden"},403);
  try{
    const id=assertOwnerRecordId((await context.params).id);
    if(!(request.headers.get("content-type")??"").toLowerCase().includes("application/json")) return response({ok:false,error:"json_required"},415);
    const raw=await request.text();if(!raw||new TextEncoder().encode(raw).byteLength>1024)return response({ok:false,error:"invalid_body"},400);
    let input:unknown;try{input=JSON.parse(raw)}catch{return response({ok:false,error:"invalid_json"},400)}
    if(!input||typeof input!=="object"||Array.isArray(input)||Object.keys(input).length!==1||!Object.prototype.hasOwnProperty.call(input,"action")||(input as {action?:unknown}).action!=="CANCEL_PENDING") return response({ok:false,error:"invalid_action"},400);
    await cancelPendingOrder(id);
    await writeAdminAudit("order.cancel_pending","order",id);
    return response({ok:true});
  }catch(error){
    const code=error instanceof Error?error.message:"order_cancel_failed";
    if(!["invalid_id","order_not_found","order_not_cancellable"].includes(code))console.error("Owner order cancellation failed",error);
    return response({ok:false,error:["invalid_id","order_not_found","order_not_cancellable"].includes(code)?code:"order_cancel_failed"},code==="invalid_id"?400:code==="order_not_found"?404:code==="order_not_cancellable"?409:503);
  }
}
