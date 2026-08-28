import {
  createSupportTicket,
  validateSupportTicketInput,
} from "@/lib/server/support-tickets";

import {
  getCurrentUser,
  isSafeUserMutation,
} from "@/lib/server/user-auth";

export const dynamic =
  "force-dynamic";

const MAX_BODY_BYTES =
  16 * 1024;

function json(
  body: Record<string, unknown>,
  status = 200,
  extraHeaders: Record<string, string> = {},
) {
  return Response.json(
    body,
    {
      status,
      headers: {
        "Cache-Control":
          "no-store",
        ...extraHeaders,
      },
    },
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
      Number(contentLength);

    if (
      Number.isFinite(size) &&
      size > MAX_BODY_BYTES
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
      new TextEncoder()
        .encode(raw)
        .byteLength >
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
      value: JSON.parse(raw),
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

export async function POST(
  request: Request,
) {
  if (!isSafeUserMutation(request)) {
    return json(
      {
        ok: false,
        error:
          "invalid_request_origin",
      },
      403,
    );
  }

  const user =
    await getCurrentUser();

  if (!user) {
    return json(
      {
        ok: false,
        error:
          "authentication_required",
      },
      401,
    );
  }

  const body =
    await readJsonBody(
      request,
    );

  if (!body.ok) {
    return body.response;
  }

  const validation =
    validateSupportTicketInput(
      body.value,
    );

  if (!validation.ok) {
    return json(
      {
        ok: false,
        error:
          validation.error,
        field:
          validation.field ??
          null,
      },
      400,
    );
  }

  try {
    const ticket =
      await createSupportTicket(
        user.id,
        validation.data,
      );

    return json(
      {
        ok: true,
        ticket,
      },
      201,
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "unknown_error";

    if (
      message ===
      "too_many_support_tickets"
    ) {
      return json(
        {
          ok: false,
          error: message,
        },
        429,
        {
          "Retry-After":
            "3600",
        },
      );
    }

    console.error(
      "Support ticket creation failed",
      message,
    );

    return json(
      {
        ok: false,
        error:
          "support_ticket_creation_failed",
      },
      500,
    );
  }
}
