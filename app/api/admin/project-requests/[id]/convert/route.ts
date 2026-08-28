import {
  convertAdminProjectRequestToProject,
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
  8 * 1024;

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

async function readBody(
  request: Request,
):
  Promise<
    | {
        ok: true;
        title: string | null;
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

  let raw: string;

  try {
    raw =
      await request.text();
  } catch {
    return {
      ok: false,
      response: json(
        {
          ok: false,
          error:
            "invalid_request_body",
        },
        400,
      ),
    };
  }

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

  let parsed: unknown;

  try {
    parsed =
      JSON.parse(raw);
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

  if (
    !parsed ||
    typeof parsed !==
      "object" ||
    Array.isArray(parsed)
  ) {
    return {
      ok: false,
      response: json(
        {
          ok: false,
          error:
            "invalid_conversion_request",
        },
        400,
      ),
    };
  }

  const input =
    parsed as Record<
      string,
      unknown
    >;

  for (
    const key of
    Object.keys(input)
  ) {
    if (
      key !== "title"
    ) {
      return {
        ok: false,
        response: json(
          {
            ok: false,
            error:
              "unsupported_conversion_field",
          },
          400,
        ),
      };
    }
  }

  if (
    input.title ===
      undefined ||
    input.title ===
      null
  ) {
    return {
      ok: true,
      title: null,
    };
  }

  if (
    typeof input.title !==
    "string"
  ) {
    return {
      ok: false,
      response: json(
        {
          ok: false,
          error:
            "invalid_project_title",
        },
        400,
      ),
    };
  }

  const title =
    input.title.trim();

  if (
    title.length >
    200
  ) {
    return {
      ok: false,
      response: json(
        {
          ok: false,
          error:
            "invalid_project_title",
        },
        400,
      ),
    };
  }

  return {
    ok: true,
    title:
      title || null,
  };
}

export async function POST(
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
    await readBody(
      request,
    );

  if (!body.ok) {
    return body.response;
  }

  try {
    const result =
      await convertAdminProjectRequestToProject(
        id,
        {
          title:
            body.title,
        },
      );

    await writeAdminAudit(
      "project_request.convert",
      "project_request",
      result.request.id,
      {
        projectId:
          result.projectId,

        status:
          result.request.status,

        projectType:
          result.request.projectType,
      },
    );

    return json(
      {
        ok: true,

        request:
          result.request,

        project: {
          id:
            result.projectId,
        },
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
      "invalid_project_request_id" ||
      message ===
      "invalid_project_title"
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
      message ===
      "project_request_not_found"
    ) {
      return json(
        {
          ok: false,
          error:
            message,
        },
        404,
      );
    }

    if (
      message ===
        "project_request_already_converted" ||
      message ===
        "project_request_must_be_accepted" ||
      message ===
        "project_request_conversion_conflict"
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
      "Admin project request conversion failed",
      message,
    );

    return json(
      {
        ok: false,
        error:
          "project_request_conversion_failed",
      },
      500,
    );
  }
}