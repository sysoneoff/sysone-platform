import {
  getAdminSupportTicketById,
  SUPPORT_PRIORITIES,
  SUPPORT_STATUSES,
  updateAdminSupportTicket,
  type SupportPriority,
  type SupportStatus,
} from "@/lib/server/support-tickets";

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
  8 * 1024;

function json(
  body: Record<string, unknown>,
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

async function readJsonBody(
  request: Request,
) {
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
      ok: false as const,
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

  try {
    const raw =
      await request.text();

    if (
      new TextEncoder()
        .encode(raw)
        .byteLength >
      MAX_BODY_BYTES
    ) {
      return {
        ok: false as const,
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
      ok: true as const,
      value: JSON.parse(raw) as unknown,
    };
  } catch {
    return {
      ok: false as const,
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

export async function GET(
  _request: Request,
  context: RouteContext,
) {
  if (
    !(await isAdminAuthenticated())
  ) {
    return json(
      {
        ok: false,
        error: "unauthorized",
      },
      401,
    );
  }

  const { id } =
    await context.params;

  try {
    const ticket =
      await getAdminSupportTicketById(
        id,
      );

    if (!ticket) {
      return json(
        {
          ok: false,
          error:
            "support_ticket_not_found",
        },
        404,
      );
    }

    return json({
      ok: true,
      ticket,
    });
  } catch (error) {
    console.error(
      "Admin support ticket read failed",
      error instanceof Error
        ? error.message
        : "unknown_error",
    );

    return json(
      {
        ok: false,
        error:
          "support_ticket_unavailable",
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
    return json(
      {
        ok: false,
        error: "unauthorized",
      },
      401,
    );
  }

  if (!isSafeAdminMutation(request)) {
    return json(
      {
        ok: false,
        error: "forbidden",
      },
      403,
    );
  }

  const body =
    await readJsonBody(request);

  if (!body.ok) {
    return body.response;
  }

  if (
    !body.value ||
    typeof body.value !== "object" ||
    Array.isArray(body.value)
  ) {
    return json(
      {
        ok: false,
        error:
          "invalid_support_ticket_update",
      },
      400,
    );
  }

  const input =
    body.value as Record<string, unknown>;
  const allowedKeys =
    new Set([
      "status",
      "priority",
    ]);

  if (
    Object.keys(input).some(
      (key) =>
        !allowedKeys.has(key),
    )
  ) {
    return json(
      {
        ok: false,
        error:
          "unsupported_support_ticket_field",
      },
      400,
    );
  }

  const status =
    typeof input.status === "string"
      ? input.status
          .trim()
          .toUpperCase()
      : undefined;
  const priority =
    typeof input.priority === "string"
      ? input.priority
          .trim()
          .toUpperCase()
      : undefined;

  if (
    status !== undefined &&
    !SUPPORT_STATUSES.includes(
      status as SupportStatus,
    )
  ) {
    return json(
      {
        ok: false,
        error:
          "invalid_support_status",
      },
      400,
    );
  }

  if (
    priority !== undefined &&
    !SUPPORT_PRIORITIES.includes(
      priority as SupportPriority,
    )
  ) {
    return json(
      {
        ok: false,
        error:
          "invalid_support_priority",
      },
      400,
    );
  }

  if (
    status === undefined &&
    priority === undefined
  ) {
    return json(
      {
        ok: false,
        error:
          "empty_support_ticket_update",
      },
      400,
    );
  }

  const { id } =
    await context.params;

  try {
    const existing =
      await getAdminSupportTicketById(
        id,
      );

    if (!existing) {
      return json(
        {
          ok: false,
          error:
            "support_ticket_not_found",
        },
        404,
      );
    }

    const ticket =
      await updateAdminSupportTicket(
        id,
        {
          status:
            status as
              | SupportStatus
              | undefined,
          priority:
            priority as
              | SupportPriority
              | undefined,
        },
      );

    if (!ticket) {
      return json(
        {
          ok: false,
          error:
            "support_ticket_not_found",
        },
        404,
      );
    }

    await writeAdminAudit(
      "support_ticket.update",
      "support_ticket",
      ticket.id,
      {
        previousStatus:
          existing.status,
        status: ticket.status,
        previousPriority:
          existing.priority,
        priority:
          ticket.priority,
      },
    );

    return json({
      ok: true,
      ticket,
    });
  } catch (error) {
    console.error(
      "Admin support ticket update failed",
      error instanceof Error
        ? error.message
        : "unknown_error",
    );

    return json(
      {
        ok: false,
        error:
          "support_ticket_update_failed",
      },
      500,
    );
  }
}
