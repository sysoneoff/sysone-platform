import { NextResponse } from "next/server";

import {
  createProjectRequest,
  validateProjectRequestInput,
} from "@/lib/server/project-requests";

import {
  getCurrentUser,
  isSafeUserMutation,
} from "@/lib/server/user-auth";

import {
  getSysOneEnv,
  requireBinding,
} from "@/lib/server/cloudflare";

export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 32 * 1024;
const RATE_LIMIT_SECONDS = 60;

function json(
  body: Record<string, unknown>,
  status = 200,
  extraHeaders: Record<string, string> = {},
) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      ...extraHeaders,
    },
  });
}

function getClientRateLimitKey(
  request: Request,
) {
  const cfIp =
    request.headers
      .get("cf-connecting-ip")
      ?.trim();

  if (cfIp) {
    return `project-request-ip:${cfIp}`;
  }

  const forwardedIp =
    request.headers
      .get("x-forwarded-for")
      ?.split(",")[0]
      ?.trim();

  if (forwardedIp) {
    return `project-request-ip:${forwardedIp}`;
  }

  return "project-request-ip:unknown";
}

async function enforceProjectRequestRateLimit(
  request: Request,
) {
  const limiter =
    requireBinding(
      getSysOneEnv()
        .SYSONE_PROJECT_REQUEST_RATE_LIMIT,
      "SYSONE_PROJECT_REQUEST_RATE_LIMIT",
    );

  return limiter.limit({
    key: getClientRateLimitKey(
      request,
    ),
  });
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

  try {
    const rateLimit =
      await enforceProjectRequestRateLimit(
        request,
      );

    if (!rateLimit.success) {
      return json(
        {
          ok: false,
          error:
            "too_many_project_requests",
        },
        429,
        {
          "Retry-After":
            String(
              RATE_LIMIT_SECONDS,
            ),
        },
      );
    }
  } catch (error) {
    console.error(
      "Project request rate limit failed",
      error instanceof Error
        ? error.message
        : "unknown_error",
    );

    return json(
      {
        ok: false,
        error:
          "project_request_rate_limit_unavailable",
      },
      503,
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