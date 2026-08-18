import { notFound } from "next/navigation";
import { ControlCenterClient } from "./ControlCenterClient";

export default function ControlCenterPage() {
  const enabled = process.env.NODE_ENV !== "production" || process.env.ENABLE_CONTROL_CENTER_PREVIEW === "true";
  if (!enabled) notFound();
  return <ControlCenterClient />;
}
