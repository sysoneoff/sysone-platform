import {
  isAdminAuthenticated,
  isSafeAdminMutation,
} from "@/lib/server/admin-auth";
import {
  getAdminLicenseById,
  updateAdminLicense,
  type LicenseUpdateInput,
} from "@/lib/server/admin-licenses";
import { writeAdminAudit } from "@/lib/server/admin-products";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const noStore = { "Cache-Control": "no-store" };

function unauthorized() {
  return Response.json(
    {
      ok: false,
      error: "unauthorized",
    },
    {
      status: 401,
      headers: noStore,
    },
  );
}

export async function GET(
  _request: Request,
  context: RouteContext,
) {
  if (!(await isAdminAuthenticated())) {
    return unauthorized();
  }

  const { id } = await context.params;

  try {
    const license = await getAdminLicenseById(id);

    if (!license) {
      return Response.json(
        {
          ok: false,
          error: "license_not_found",
        },
        {
          status: 404,
          headers: noStore,
        },
      );
    }

    return Response.json(
      {
        ok: true,
        license,
      },
      {
        headers: noStore,
      },
    );
  } catch (error) {
    console.error("Admin license get failed", error);

    return Response.json(
      {
        ok: false,
        error: "license_unavailable",
      },
      {
        status: 503,
        headers: noStore,
      },
    );
  }
}

export async function PATCH(
  request: Request,
  context: RouteContext,
) {
  if (!(await isAdminAuthenticated())) {
    return unauthorized();
  }

  if (!isSafeAdminMutation(request)) {
    return Response.json(
      {
        ok: false,
        error: "forbidden",
      },
      {
        status: 403,
        headers: noStore,
      },
    );
  }

  const { id } = await context.params;

  let input: LicenseUpdateInput;

  try {
    const parsed: unknown = await request.json();

    if (
      !parsed ||
      typeof parsed !== "object" ||
      Array.isArray(parsed)
    ) {
      throw new Error("invalid_request");
    }

    input = parsed as LicenseUpdateInput;
  } catch {
    return Response.json(
      {
        ok: false,
        error: "invalid_request",
      },
      {
        status: 400,
        headers: noStore,
      },
    );
  }

  try {
    const before = await getAdminLicenseById(id);

    if (!before) {
      return Response.json(
        {
          ok: false,
          error: "license_not_found",
        },
        {
          status: 404,
          headers: noStore,
        },
      );
    }

    const license = await updateAdminLicense(id, input);

    if (!license) {
      return Response.json(
        {
          ok: false,
          error: "license_not_found",
        },
        {
          status: 404,
          headers: noStore,
        },
      );
    }

    await writeAdminAudit(
      "license.update",
      "license",
      license.id,
      {
        previousDeviceLimit: before.deviceLimit,
        deviceLimit: license.deviceLimit,
        previousStatus: before.status,
        status: license.status,
        previousExpiresAt: before.expiresAt,
        expiresAt: license.expiresAt,
      },
    );

    return Response.json(
      {
        ok: true,
        license,
      },
      {
        headers: noStore,
      },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "unknown";

    const notFound =
      message === "entitlement_not_found";

    const entitlementConflict =
      message === "entitlement_not_active" ||
      message === "entitlement_not_started" ||
      message === "entitlement_expired";

    const validation =
      message === "no_updates" ||
      message === "invalid_entitlement_dates" ||
      /required|invalid_/i.test(message);

    console.error("Admin license update failed", error);

    return Response.json(
      {
        ok: false,
        error: notFound
          ? "entitlement_not_found"
          : entitlementConflict
            ? message
            : validation
              ? message
              : "license_update_failed",
      },
      {
        status: notFound
          ? 404
          : entitlementConflict
            ? 409
            : validation
              ? 400
              : 500,
        headers: noStore,
      },
    );
  }
}