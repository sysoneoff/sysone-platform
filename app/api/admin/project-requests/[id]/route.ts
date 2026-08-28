import {
  getAdminProjectRequestById,
  updateAdminProjectRequest,
  type UpdateAdminProjectRequestInput,
} from "@/lib/server/admin-project-requests";

import {
  isAdminAuthenticated,
  isSafeAdminMutation,
} from "@/lib/server/admin-auth";

import {
  writeAdminAudit,
} from "@/lib/server/admin-products";

export const dynamic =
  "force-dynamic";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const MAX_BODY_BYTES =
  16 * 1024;

function json(
  body: Record<
    string,
    unknown
  >,
  status = 200,
) {
  return Response.json(
    body,
    {
      status,

      headers: {
        "Cache-Control":
          "no-store",
      },
    },
  );
}

function unauthorized() {
  return json(
    {
      ok: false,
      error:
        "unauthorized",
    },
    401,
  );
}

async function readJsonBody(
  request: Request,
): Promise<
  | {
      ok: true;
      value: unknown;
    }
  | {
      ok: false;
      response: Response;
    }
> {
  const contentType =
    request.headers.get(
      "content-type",
    ) ?? "";

  if (
    !contentType
      .toLowerCase()
      .includes(
        "application/json",
      )
  ) {
    return {
      ok: false,

      response: json(
        {
          ok: false,
          error:
            "application_json_required",
        },
        415,
      ),
    };
  }

  const contentLength =
    request.headers.get(
      "content-length",
    );

  if (contentLength) {
    const size =
      Number(
        contentLength,
      );

    if (
      Number.isFinite(
        size,
      ) &&
      size >
        MAX_BODY_BYTES
    ) {
      return {
        ok: false,

        response: json(
          {
            ok: false,
            error:
              "request_body_too_large",
          },
          413,
        ),
      };
    }
  }

  try {
    const raw =
      await request.text();

    if (
      new TextEncoder().encode(
        raw,
      ).byteLength >
      MAX_BODY_BYTES
    ) {
      return {
        ok: false,

        response: json(
          {
            ok: false,
            error:
              "request_body_too_large",
          },
          413,
        ),
      };
    }

    return {
      ok: true,
      value:
        JSON.parse(raw),
    };
  } catch {
    return {
      ok: false,

      response: json(
        {
          ok: false,
          error:
            "invalid_json_body",
        },
        400,
      ),
    };
  }
}

function parseUpdateInput(
  value: unknown,
):
  | {
      ok: true;
      data: UpdateAdminProjectRequestInput;
    }
  | {
      ok: false;
      error: string;
    } {
  if (
    !value ||
    typeof value !==
      "object" ||
    Array.isArray(value)
  ) {
    return {
      ok: false,
      error:
        "invalid_project_request_update",
    };
  }

  const input =
    value as Record<
      string,
      unknown
    >;

  const allowedKeys =
    new Set([
      "status",
      "internalNote",
    ]);

  for (
    const key of
    Object.keys(input)
  ) {
    if (
      !allowedKeys.has(
        key,
      )
    ) {
      return {
        ok: false,
        error:
          "unsupported_project_request_field",
      };
    }
  }

  if (
    input.status ===
      undefined &&
    input.internalNote ===
      undefined
  ) {
    return {
      ok: false,
      error:
        "empty_project_request_update",
    };
  }

  const data: UpdateAdminProjectRequestInput =
    {};

  if (
    input.status !==
    undefined
  ) {
    if (
      typeof input.status !==
      "string"
    ) {
      return {
        ok: false,
        error:
          "invalid_project_request_status",
      };
    }

    const status =
      input.status
        .trim()
        .toUpperCase();

    const allowedStatuses =
      [
        "SUBMITTED",
        "REVIEWING",
        "ACCEPTED",
        "REJECTED",
        "CLOSED",
      ] as const;

    if (
      !allowedStatuses.includes(
        status as
          (typeof allowedStatuses)[number],
      )
    ) {
      return {
        ok: false,
        error:
          status ===
          "CONVERTED"
            ? "use_project_request_conversion"
            : "invalid_project_request_status",
      };
    }

    data.status =
      status as
        (typeof allowedStatuses)[number];
  }

  if (
    input.internalNote !==
    undefined
  ) {
    if (
      input.internalNote ===
      null
    ) {
      data.internalNote =
        null;
    } else if (
      typeof input.internalNote ===
      "string"
    ) {
      const note =
        input.internalNote.trim();

      if (
        note.length >
        10000
      ) {
        return {
          ok: false,
          error:
            "invalid_internal_note",
        };
      }

      data.internalNote =
        note || null;
    } else {
      return {
        ok: false,
        error:
          "invalid_internal_note",
      };
    }
  }

  return {
    ok: true,
    data,
  };
}

export async function GET(
  _request: Request,
  context: RouteContext,
) {
  if (
    !(await isAdminAuthenticated())
  ) {
    return unauthorized();
  }

  const {
    id,
  } =
    await context.params;

  try {
    const projectRequest =
      await getAdminProjectRequestById(
        id,
      );

    if (!projectRequest) {
      return json(
        {
          ok: false,
          error:
            "project_request_not_found",
        },
        404,
      );
    }

    return json({
      ok: true,
      request:
        projectRequest,
    });
  } catch (error) {
    console.error(
      "Admin project request read failed",
      error instanceof Error
        ? error.message
        : "unknown_error",
    );

    return json(
      {
        ok: false,
        error:
          "project_request_unavailable",
      },
      503,
    );
  }
}

export async function PATCH(
  request: Request,
  context: RouteContext,
) {
  if (
    !(await isAdminAuthenticated())
  ) {
    return unauthorized();
  }

  if (
    !isSafeAdminMutation(
      request,
    )
  ) {
    return json(
      {
        ok: false,
        error:
          "forbidden",
      },
      403,
    );
  }

  const {
    id,
  } =
    await context.params;

  const body =
    await readJsonBody(
      request,
    );

  if (!body.ok) {
    return body.response;
  }

  const parsed =
    parseUpdateInput(
      body.value,
    );

  if (!parsed.ok) {
    const conflict =
      parsed.error ===
      "use_project_request_conversion";

    return json(
      {
        ok: false,
        error:
          parsed.error,
      },
      conflict
        ? 409
        : 400,
    );
  }

  try {
    const existing =
      await getAdminProjectRequestById(
        id,
      );

    if (!existing) {
      return json(
        {
          ok: false,
          error:
            "project_request_not_found",
        },
        404,
      );
    }

    const updated =
      await updateAdminProjectRequest(
        id,
        parsed.data,
      );

    if (!updated) {
      return json(
        {
          ok: false,
          error:
            "project_request_not_found",
        },
        404,
      );
    }

    await writeAdminAudit(
      "project_request.update",
      "project_request",
      updated.id,
      {
        previousStatus:
          existing.status,

        status:
          updated.status,

        internalNoteChanged:
          parsed.data
            .internalNote !==
          undefined,
      },
    );

    return json({
      ok: true,
      request: updated,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "unknown_error";

    const validationErrors =
      new Set([
        "invalid_project_request_id",
        "invalid_project_request_update",
        "invalid_project_request_status",
        "invalid_internal_note",
      ]);

    const conflictErrors =
      new Set([
        "converted_project_request_is_locked",
        "use_project_request_conversion",
      ]);

    if (
      validationErrors.has(
        message,
      )
    ) {
      return json(
        {
          ok: false,
          error:
            message,
        },
        400,
      );
    }

    if (
      conflictErrors.has(
        message,
      )
    ) {
      return json(
        {
          ok: false,
          error:
            message,
        },
        409,
      );
    }

    console.error(
      "Admin project request update failed",
      message,
    );

    return json(
      {
        ok: false,
        error:
          "project_request_update_failed",
      },
      500,
    );
  }
}