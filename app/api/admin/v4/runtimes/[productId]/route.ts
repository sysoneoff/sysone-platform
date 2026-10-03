import { isAdminAuthenticated, isSafeAdminMutation } from "@/lib/server/admin-auth";
import {
  getRuntimeProduct,
  listWebBuilds,
  saveRuntimeProduct,
} from "@/lib/server/admin-v4";
import { writeAdminAudit } from "@/lib/server/admin-products";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ productId: string }>;
};

function unauthorized() {
  return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
}

export async function GET(_request: Request, context: RouteContext) {
  if (!(await isAdminAuthenticated())) return unauthorized();

  const { productId } = await context.params;

  try {
    const product = await getRuntimeProduct(productId);

    if (!product) {
      return Response.json(
        { ok: false, error: "product_not_found" },
        { status: 404 },
      );
    }

    const builds = await listWebBuilds(productId);

    return Response.json(
      { ok: true, product, builds },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      { ok: false, error: "runtime_unavailable" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request, context: RouteContext) {
  if (!(await isAdminAuthenticated())) return unauthorized();

  if (!isSafeAdminMutation(request)) {
    return Response.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const { productId } = await context.params;

  try {
    const product = await saveRuntimeProduct(productId, await request.json());

    await writeAdminAudit("runtime.update", "product", productId);

    return Response.json({ ok: true, product });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "runtime_update_failed";

    return Response.json(
      { ok: false, error: message },
      {
        status:
          /invalid|required|not_found/.test(message)
            ? 400
            : 500,
      },
    );
  }
}
