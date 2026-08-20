import { isAdminAuthenticated } from "@/lib/server/admin-auth";
import { listAdminEntitlements } from "@/lib/server/admin-entitlements";

export const dynamic = "force-dynamic";

function unauthorized() {
  return Response.json(
    { ok: false, error: "unauthorized" },
    { status: 401, headers: { "Cache-Control": "no-store" } },
  );
}

export async function GET() {
  if (!(await isAdminAuthenticated())) return unauthorized();

  try {
    const entitlements = await listAdminEntitlements();
    return Response.json(
      { ok: true, entitlements },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Admin entitlements list failed", error);
    return Response.json(
      { ok: false, error: "entitlements_unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
