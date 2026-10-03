import { isAdminAuthenticated, isSafeAdminMutation } from "@/lib/server/admin-auth";
import {
  activateWebBuild,
  deleteWebBuild,
} from "@/lib/server/admin-v4";
import { writeAdminAudit } from "@/lib/server/admin-products";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function unauthorized() {
  return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
}

export async function PATCH(request: Request, context: RouteContext) {
  if (!(await isAdminAuthenticated())) return unauthorized();

  if (!isSafeAdminMutation(request)) {
    return Response.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const { id } = await context.params;

  try {
    const body = await request.json();

    const productId =
      typeof body?.productId === "string"
        ? body.productId.trim()
        : "";

    if (!productId) {
      return Response.json(
        { ok: false, error: "product_id_required" },
        { status: 400 },
      );
    }

    if (body?.action !== "activate") {
      return Response.json(
        { ok: false, error: "invalid_action" },
        { status: 400 },
      );
    }

    const product = await activateWebBuild(productId, id);

    await writeAdminAudit(
      "runtime.build.activate",
      "web_build",
      id,
      { productId },
    );

    return Response.json({ ok: true, product });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "build_activate_failed";

    return Response.json(
      { ok: false, error: message },
      {
        status:
          /not_found|required|invalid/.test(message)
            ? 400
            : 500,
      },
    );
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  if (!(await isAdminAuthenticated())) return unauthorized();

  if (!isSafeAdminMutation(request)) {
    return Response.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const { id } = await context.params;

  try {
    const productId =
      new URL(request.url).searchParams.get("productId")?.trim() ?? "";

    if (!productId) {
      return Response.json(
        { ok: false, error: "product_id_required" },
        { status: 400 },
      );
    }

    const deleted = await deleteWebBuild(productId, id);

    if (!deleted) {
      return Response.json(
        { ok: false, error: "build_not_found" },
        { status: 404 },
      );
    }

    await writeAdminAudit(
      "runtime.build.delete",
      "web_build",
      id,
      { productId },
    );

    return Response.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "build_delete_failed";

    return Response.json(
      { ok: false, error: message },
      {
        status:
          message === "cannot_delete_active_build"
            ? 409
            : 500,
      },
    );
  }
}
