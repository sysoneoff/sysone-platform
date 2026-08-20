import { isAdminAuthenticated, isSafeAdminMutation } from "@/lib/server/admin-auth";
import {
  createAdminEntitlement,
  listAdminEntitlements,
  type EntitlementMutationInput,
} from "@/lib/server/admin-entitlements";
import { writeAdminAudit } from "@/lib/server/admin-products";

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

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) return unauthorized();

  if (!isSafeAdminMutation(request)) {
    return Response.json(
      { ok: false, error: "forbidden" },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  let input: EntitlementMutationInput;

  try {
    const parsed: unknown = await request.json();

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("invalid_request");
    }

    input = parsed as EntitlementMutationInput;
  } catch {
    return Response.json(
      { ok: false, error: "invalid_request" },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const entitlement = await createAdminEntitlement(input);

    if (!entitlement) {
      throw new Error("entitlement_create_failed");
    }

    await writeAdminAudit(
      "entitlement.create",
      "entitlement",
      entitlement.id,
      {
        userId: entitlement.userId,
        productId: entitlement.productId,
        orderId: entitlement.orderId,
        status: entitlement.status,
      },
    );

    return Response.json(
      { ok: true, entitlement },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";

    const conflict = /unique|constraint/i.test(message);
    const notFound =
      message === "user_not_found" ||
      message === "product_not_found";
    const validation =
      /required|invalid_/i.test(message);

    console.error("Admin entitlement create failed", error);

    return Response.json(
      {
        ok: false,
        error: conflict
          ? "entitlement_conflict"
          : notFound || validation
            ? message
            : "entitlement_create_failed",
      },
      {
        status: conflict
          ? 409
          : notFound
            ? 404
            : validation
              ? 400
              : 500,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }
}
