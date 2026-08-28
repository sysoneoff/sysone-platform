import {
  getAdminSupportTicketStats,
  listAdminSupportTickets,
  SUPPORT_STATUSES,
  type SupportStatus,
} from "@/lib/server/support-tickets";

import {
  isAdminAuthenticated,
} from "@/lib/server/admin-auth";

export const dynamic =
  "force-dynamic";

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

function parseLimit(
  value: string | null,
) {
  if (!value) {
    return 100;
  }

  const parsed = Number(value);

  if (
    !Number.isInteger(parsed) ||
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
    return json(
      {
        ok: false,
        error: "unauthorized",
      },
      401,
    );
  }

  const url = new URL(request.url);
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
    !SUPPORT_STATUSES.includes(
      rawStatus as SupportStatus,
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
        error: "invalid_limit",
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
      .slice(0, 200);

  try {
    const [tickets, stats] =
      await Promise.all([
        listAdminSupportTickets({
          status:
            rawStatus === "ALL"
              ? "ALL"
              : rawStatus as SupportStatus,
          query,
          limit,
        }),
        getAdminSupportTicketStats(),
      ]);

    return json({
      ok: true,
      tickets,
      stats,
      filters: {
        status: rawStatus,
        query,
        limit,
      },
    });
  } catch (error) {
    console.error(
      "Admin support tickets list failed",
      error instanceof Error
        ? error.message
        : "unknown_error",
    );

    return json(
      {
        ok: false,
        error:
          "support_tickets_unavailable",
      },
      503,
    );
  }
}
