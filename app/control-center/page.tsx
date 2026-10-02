import { isAdminAuthenticated } from "@/lib/server/admin-auth";
import { ControlCenterLogin } from "./ControlCenterLogin";
import { OwnerToolV4 } from "./OwnerToolV4";

import "./control-center.css";
import "./obsidian-admin.css";
import "./owner-v4.css";

export const dynamic="force-dynamic";

export default async function ControlCenterPage(){
  const authenticated=await isAdminAuthenticated();
  return authenticated?<OwnerToolV4/>:<ControlCenterLogin/>;
}
