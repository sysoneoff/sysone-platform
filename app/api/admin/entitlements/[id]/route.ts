import { isAdminAuthenticated, isSafeAdminMutation } from "@/lib/server/admin-auth";
import {
  getAdminEntitlementById,
  updateAdminEntitlement,
  type EntitlementUpdateInput,
} from "@/lib/server/admin-entitlements";
import { writeAdminAudit } from "@/lib/server/admin-products";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

const noStore = { "Cache-Control": "no-store" };

function unauthorized() {
  return Response.json(
    { ok: false, error: "unauthorized" },
    { status: 401, headers: noStore },
  );
}

export async function GET(_request: Request, context: RouteContext) {
  if (!(await isAdminAuthenticated())) return unauthorized();

  const { id } = await context.params;
  const entitlement = await getAdminEntitlementById(id);

  return entitlement
    ? Response.json({ ok: true, entitlement }, { headers: noStore })
    : Response.json(
        { ok: false, error: "entitlement_not_found" },
        { status: 404, headers: noStore },
      );
}

export async function PATCH(request: Request, context: RouteContext) {
  if (!(await isAdminAuthenticated())) return unauthorized();

  if (!isSafeAdminMutation(request)) {
    return Response.json(
      { ok: false, error: "forbidden" },
      { status: 403, headers: noStore },
    );
  }

  const { id } = await context.params;

  let input: EntitlementUpdateInput;

  try {
    const parsed: unknown = await request.json();

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("invalid_request");
    }

    input = parsed as EntitlementUpdateInput;
  } catch {
    return Response.json(
      { ok: false, error: "invalid_request" },
      { status: 400, headers: noStore },
    );
  }

  try {
    const before = await getAdminEntitlementById(id);

    if (!before) {
      return Response.json(
        { ok: false, error: "entitlement_not_found" },
        { status: 404, headers: noStore },
      );
    }

    const entitlement = await updateAdminEntitlement(id, input);

    if (!entitlement) {
      return Response.json(
        { ok: false, error: "entitlement_not_found" },
        { status: 404, headers: noStore },
      );
    }

    await writeAdminAudit(
      "entitlement.update",
      "entitlement",
      id,
      {
        previousStatus: before.status,
        status: entitlement.status,
        previousEndsAt: before.endsAt,
        endsAt: entitlement.endsAt,
      },
    );

    return Response.json(
      { ok: true, entitlement },
      { headers: noStore },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";
    const validation =
      message === "no_updates" ||
      /required|invalid_/i.test(message);

    console.error("Admin entitlement update failed", error);

    return Response.json(
      {
        ok: false,
        error: validation ? message : "entitlement_update_failed",
      },
      {
        status: validation ? 400 : 500,
        headers: noStore,
      },
    );
  }
}
