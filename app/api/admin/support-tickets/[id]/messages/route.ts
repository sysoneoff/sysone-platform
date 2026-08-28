import {
  addAdminSupportMessage,
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
  16 * 1024;

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

export async function POST(
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
    return json(
      {
        ok: false,
        error:
          "application_json_required",
      },
      415,
    );
  }

  let body: unknown;

  try {
    const raw =
      await request.text();

    if (
      new TextEncoder()
        .encode(raw)
        .byteLength >
      MAX_BODY_BYTES
    ) {
      return json(
        {
          ok: false,
          error:
            "request_body_too_large",
        },
        413,
      );
    }

    body = JSON.parse(raw);
  } catch {
    return json(
      {
        ok: false,
        error:
          "invalid_json_body",
      },
      400,
    );
  }

  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body) ||
    Object.keys(body).some(
      (key) => key !== "body",
    )
  ) {
    return json(
      {
        ok: false,
        error:
          "invalid_support_message",
      },
      400,
    );
  }

  const message =
    (body as {
      body?: unknown;
    }).body;
  const { id } =
    await context.params;

  try {
    const ticket =
      await addAdminSupportMessage(
        id,
        message,
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
      "support_ticket.reply",
      "support_ticket",
      ticket.id,
      {
        messageAdded: true,
        status: ticket.status,
      },
    );

    return json(
      {
        ok: true,
        ticket,
      },
      201,
    );
  } catch (error) {
    const messageError =
      error instanceof Error
        ? error.message
        : "unknown_error";

    if (
      messageError ===
        "invalid_support_message" ||
      messageError ===
        "invalid_support_ticket_id"
    ) {
      return json(
        {
          ok: false,
          error: messageError,
        },
        400,
      );
    }

    console.error(
      "Admin support reply failed",
      messageError,
    );

    return json(
      {
        ok: false,
        error:
          "support_reply_failed",
      },
      500,
    );
  }
}
