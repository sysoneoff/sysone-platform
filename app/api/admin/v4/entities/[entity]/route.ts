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

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && !Array.isArray(value) && typeof value === "object";
}

async function parseMutation(request: Request) {
  const raw = await request.text();
  if (!raw || new TextEncoder().encode(raw).byteLength > 16000) throw new Error("invalid_body");
  let data: unknown;
  try { data = JSON.parse(raw); } catch { throw new Error("invalid_json"); }
  if (!isPlainObject(data)) throw new Error("invalid_body");
  return data;
}

function validId(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.trim().length <= 128;
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
    const body = await parseMutation(request);
    const id = validId(body.id) ? body.id.trim() : "";
    const changes = body.changes;
    if (!isPlainObject(changes) || Object.keys(changes).length > 30) {
      throw new Error("invalid_changes");
    }

    if (!id) throw new Error("invalid_id");

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

    if (!validId(id)) throw new Error("invalid_id");

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
