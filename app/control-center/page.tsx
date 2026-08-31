import { isAdminAuthenticated } from "@/lib/server/admin-auth";
import { ControlCenterClient } from "./ControlCenterClient";
import { ControlCenterLogin } from "./ControlCenterLogin";
import "./control-center.css";
import "./obsidian-admin.css";

export const dynamic = "force-dynamic";

export default async function ControlCenterPage() {
  const authenticated = await isAdminAuthenticated();
  return authenticated ? <ControlCenterClient /> : <ControlCenterLogin />;
}
