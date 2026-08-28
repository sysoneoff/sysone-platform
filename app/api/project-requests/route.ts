import { NextResponse } from "next/server";

import {
  createProjectRequest,
  validateProjectRequestInput,
} from "@/lib/server/project-requests";

import {
  getCurrentUser,
  isSafeUserMutation,
} from "@/lib/server/user-auth";

export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 32 * 1024;

function json(
  body: Record<string, unknown>,
  status = 200,
) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

export async function POST(
  request: Request,
) {
  if (!isSafeUserMutation(request)) {
    return json(
      {
        ok: false,
        error: "invalid_request_origin",
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
      return json(
        {
          ok: false,
          error:
            "request_body_too_large",
        },
        413,
      );
    }
  }

  let body: unknown;

  try {
    const raw =
      await request.text();

    if (
      new TextEncoder().encode(raw)
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

  const validation =
    validateProjectRequestInput(
      body,
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
    const user =
      await getCurrentUser();

    const projectRequest =
      await createProjectRequest(
        validation.data,
        {
          userId:
            user?.id ?? null,
        },
      );

    return json(
      {
        ok: true,
        request: {
          id:
            projectRequest.id,

          status:
            projectRequest.status,

          createdAt:
            projectRequest.createdAt,
        },
      },
      201,
    );
  } catch (error) {
    console.error(
      "Project request creation failed",
      error instanceof Error
        ? error.message
        : "unknown_error",
    );

    return json(
      {
        ok: false,
        error:
          "project_request_creation_failed",
      },
      500,
    );
  }
}