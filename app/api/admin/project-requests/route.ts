import {
  ADMIN_PROJECT_REQUEST_STATUSES,
  getAdminProjectRequestStats,
  listAdminProjectRequests,
  type AdminProjectRequestStatus,
} from "@/lib/server/admin-project-requests";

import {
  isAdminAuthenticated,
} from "@/lib/server/admin-auth";

export const dynamic =
  "force-dynamic";

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

function isValidStatus(
  value: string,
): value is AdminProjectRequestStatus {
  return ADMIN_PROJECT_REQUEST_STATUSES.includes(
    value as AdminProjectRequestStatus,
  );
}

function parseLimit(
  value: string | null,
) {
  if (!value) {
    return 100;
  }

  const parsed =
    Number(value);

  if (
    !Number.isInteger(
      parsed,
    ) ||
    parsed < 1 ||
    parsed > 250
  ) {
    return null;
  }

  return parsed;
}

export async function GET(
  request: Request,
) {
  if (
    !(await isAdminAuthenticated())
  ) {
    return unauthorized();
  }

  const url =
    new URL(
      request.url,
    );

  const rawStatus =
    (
      url.searchParams.get(
        "status",
      ) ?? "ALL"
    )
      .trim()
      .toUpperCase();

  if (
    rawStatus !== "ALL" &&
    !isValidStatus(
      rawStatus,
    )
  ) {
    return json(
      {
        ok: false,
        error:
          "invalid_project_request_status",
      },
      400,
    );
  }

  const query =
    (
      url.searchParams.get(
        "q",
      ) ?? ""
    )
      .trim()
      .slice(
        0,
        200,
      );

  const limit =
    parseLimit(
      url.searchParams.get(
        "limit",
      ),
    );

  if (limit === null) {
    return json(
      {
        ok: false,
        error:
          "invalid_limit",
      },
      400,
    );
  }

  try {
    const [
      requests,
      stats,
    ] =
      await Promise.all([
        listAdminProjectRequests(
          {
            status:
              rawStatus ===
              "ALL"
                ? "ALL"
                : rawStatus,

            query,

            limit,
          },
        ),

        getAdminProjectRequestStats(),
      ]);

    return json({
      ok: true,

      requests,

      stats,

      filters: {
        status:
          rawStatus,

        query,

        limit,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "unknown_error";

    if (
      message ===
      "invalid_project_request_status"
    ) {
      return json(
        {
          ok: false,
          error:
            "invalid_project_request_status",
        },
        400,
      );
    }

    console.error(
      "Admin project requests list failed",
      message,
    );

    return json(
      {
        ok: false,
        error:
          "project_requests_unavailable",
      },
      503,
    );
  }
}