import { isAdminAuthenticated, isSafeAdminMutation } from "@/lib/server/admin-auth";
import {
  getAdminProductDetails,
  saveAdminProductDetails,
} from "@/lib/server/admin-product-details";
import { writeAdminAudit } from "@/lib/server/admin-products";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function unauthorized() {
  return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
}

export async function GET(_request: Request, context: RouteContext) {
  if (!(await isAdminAuthenticated())) return unauthorized();

  const { id } = await context.params;

  try {
    const details = await getAdminProductDetails(id);

    if (!details) {
      return Response.json(
        { ok: false, error: "product_not_found" },
        { status: 404 },
      );
    }

    return Response.json(
      { ok: true, details },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      { ok: false, error: "product_details_unavailable" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request, context: RouteContext) {
  if (!(await isAdminAuthenticated())) return unauthorized();

  if (!isSafeAdminMutation(request)) {
    return Response.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const { id } = await context.params;

  try {
    const details = await saveAdminProductDetails(id, await request.json());

    await writeAdminAudit("product.details.update", "product", id);

    return Response.json({ ok: true, details });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "product_details_update_failed";

    return Response.json(
      { ok: false, error: message },
      { status: /invalid|required|not_found/.test(message) ? 400 : 500 },
    );
  }
}
