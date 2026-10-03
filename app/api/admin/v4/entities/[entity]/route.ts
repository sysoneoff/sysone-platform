import { isAdminAuthenticated, isSafeAdminMutation } from "@/lib/server/admin-auth";
import { deleteEntity, listEntity, updateEntity } from "@/lib/server/admin-v4";
import { writeAdminAudit } from "@/lib/server/admin-products";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ entity: string }>;
};

function unauthorized() {
  return Response.json(
    { ok: false, error: "unauthorized" },
    { status: 401, headers: { "Cache-Control": "no-store" } },
  );
}

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "entity_request_failed";

  if (message === "invalid_entity") {
    return Response.json({ ok: false, error: message }, { status: 404 });
  }

  if (message === "entity_delete_forbidden") {
    return Response.json({ ok: false, error: message }, { status: 403 });
  }

  if (message === "no_editable_changes" || message.startsWith("invalid_")) {
    return Response.json({ ok: false, error: message }, { status: 400 });
  }

  console.error("Owner entity API failed", error);

  return Response.json(
    { ok: false, error: "entity_request_failed" },
    { status: 500 },
  );
}

export async function GET(_request: Request, context: RouteContext) {
  if (!(await isAdminAuthenticated())) return unauthorized();

  try {
    const { entity } = await context.params;
    const data = await listEntity(entity);

    return Response.json(
      { ok: true, ...data },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  if (!(await isAdminAuthenticated())) return unauthorized();

  if (!isSafeAdminMutation(request)) {
    return Response.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  try {
    const { entity } = await context.params;
    const body = await request.json();

    const id = typeof body?.id === "string" ? body.id.trim() : "";
    const changes =
      body?.changes && typeof body.changes === "object"
        ? body.changes
        : {};

    if (!id) {
      return Response.json(
        { ok: false, error: "id_required" },
        { status: 400 },
      );
    }

    await updateEntity(entity, id, changes);

    await writeAdminAudit(
      "entity.update",
      entity,
      id,
      { fields: Object.keys(changes) },
    );

    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  if (!(await isAdminAuthenticated())) return unauthorized();

  if (!isSafeAdminMutation(request)) {
    return Response.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  try {
    const { entity } = await context.params;
    const id = new URL(request.url).searchParams.get("id")?.trim() ?? "";

    if (!id) {
      return Response.json(
        { ok: false, error: "id_required" },
        { status: 400 },
      );
    }

    const deleted = await deleteEntity(entity, id);

    if (!deleted) {
      return Response.json(
        { ok: false, error: "entity_not_found" },
        { status: 404 },
      );
    }

    await writeAdminAudit("entity.delete", entity, id);

    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
