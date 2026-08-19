import { isAdminAuthenticated, isSafeAdminMutation } from "@/lib/server/admin-auth";
import { createAdminProduct, listAdminProducts, writeAdminAudit } from "@/lib/server/admin-products";

export const dynamic = "force-dynamic";

function unauthorized() {
  return Response.json({ ok: false, error: "unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
}

export async function GET() {
  if (!(await isAdminAuthenticated())) return unauthorized();
  try {
    return Response.json({ ok: true, products: await listAdminProducts() }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Admin products list failed", error);
    return Response.json({ ok: false, error: "products_unavailable" }, { status: 503 });
  }
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) return unauthorized();
  if (!isSafeAdminMutation(request)) return Response.json({ ok: false, error: "forbidden" }, { status: 403 });

  try {
    const input = await request.json();
    const product = await createAdminProduct(input);
    if (!product) throw new Error("product_create_failed");
    await writeAdminAudit("product.create", "product", product.id, { slug: product.slug, name: product.name });
    return Response.json({ ok: true, product }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";
    const conflict = /unique|constraint/i.test(message);
    const validation = /required|invalid_/i.test(message);
    console.error("Admin product create failed", error);
    return Response.json(
      { ok: false, error: conflict ? "product_conflict" : validation ? message : "product_create_failed" },
      { status: conflict ? 409 : validation ? 400 : 500 },
    );
  }
}
