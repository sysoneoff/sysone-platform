import { isAdminAuthenticated, isSafeAdminMutation } from "@/lib/server/admin-auth";
import { deleteAdminProduct, getAdminProductById, updateAdminProduct, writeAdminAudit } from "@/lib/server/admin-products";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

function unauthorized() {
  return Response.json({ ok: false, error: "unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
}

export async function GET(_request: Request, context: RouteContext) {
  if (!(await isAdminAuthenticated())) return unauthorized();
  const { id } = await context.params;
  const product = await getAdminProductById(id);
  return product
    ? Response.json({ ok: true, product }, { headers: { "Cache-Control": "no-store" } })
    : Response.json({ ok: false, error: "product_not_found" }, { status: 404 });
}

export async function PUT(request: Request, context: RouteContext) {
  if (!(await isAdminAuthenticated())) return unauthorized();
  if (!isSafeAdminMutation(request)) return Response.json({ ok: false, error: "forbidden" }, { status: 403 });
  const { id } = await context.params;

  try {
    const product = await updateAdminProduct(id, await request.json());
    if (!product) return Response.json({ ok: false, error: "product_not_found" }, { status: 404 });
    await writeAdminAudit("product.update", "product", id, { slug: product.slug, name: product.name });
    return Response.json({ ok: true, product });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";
    const conflict = /unique|constraint/i.test(message);
    const validation = /required|invalid_/i.test(message);
    console.error("Admin product update failed", error);
    return Response.json(
      { ok: false, error: conflict ? "product_conflict" : validation ? message : "product_update_failed" },
      { status: conflict ? 409 : validation ? 400 : 500 },
    );
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  if (!(await isAdminAuthenticated())) return unauthorized();
  if (!isSafeAdminMutation(request)) return Response.json({ ok: false, error: "forbidden" }, { status: 403 });
  const { id } = await context.params;

  try {
    const existing = await getAdminProductById(id);
    if (!existing) return Response.json({ ok: false, error: "product_not_found" }, { status: 404 });
    await deleteAdminProduct(id);
    await writeAdminAudit("product.delete", "product", id, { slug: existing.slug, name: existing.name });
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Admin product delete failed", error);
    return Response.json({ ok: false, error: "product_delete_failed" }, { status: 500 });
  }
}
