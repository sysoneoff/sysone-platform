import type { Metadata } from "next";
import { isAdminAuthenticated } from "@/lib/server/admin-auth";
import { ControlCenterLogin } from "./ControlCenterLogin";
import { OwnerToolV4 } from "./OwnerToolV4";

import "./control-center.css";
import "./obsidian-admin.css";
import "./owner-v4.css";
import "./owner-v4/phase2.css";

export const dynamic="force-dynamic";
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function ControlCenterPage(){
  const authenticated=await isAdminAuthenticated();
  return authenticated?<OwnerToolV4/>:<ControlCenterLogin/>;
}
