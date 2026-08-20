import { isAdminAuthenticated, isSafeAdminMutation } from "@/lib/server/admin-auth";
import { createAdminRelease, listAdminReleases } from "@/lib/server/admin-releases";
import { listAdminProducts, writeAdminAudit } from "@/lib/server/admin-products";

export const dynamic = "force-dynamic";

function unauthorized() {
  return Response.json({ ok: false, error: "unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
}

export async function GET() {
  if (!(await isAdminAuthenticated())) return unauthorized();
  try {
    const [releases, products] = await Promise.all([listAdminReleases(), listAdminProducts()]);
    return Response.json({ ok: true, releases, products }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Admin releases list failed", error);
    return Response.json({ ok: false, error: "releases_unavailable" }, { status: 503 });
  }
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) return unauthorized();
  if (!isSafeAdminMutation(request)) return Response.json({ ok: false, error: "forbidden" }, { status: 403 });

  try {
    const release = await createAdminRelease(await request.json());
    if (!release) throw new Error("release_create_failed");
    await writeAdminAudit("release.create", "product_version", release.id, {
      productId: release.productId,
      version: release.version,
      channel: release.channel,
    });
    return Response.json({ ok: true, release }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";
    const conflict = /unique|constraint/i.test(message);
    const validation = /required|invalid_|not_found/i.test(message);
    console.error("Admin release create failed", error);
    return Response.json(
      { ok: false, error: conflict ? "release_conflict" : validation ? message : "release_create_failed" },
      { status: conflict ? 409 : validation ? 400 : 500 },
    );
  }
}
