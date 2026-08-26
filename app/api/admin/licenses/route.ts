import {
  isAdminAuthenticated,
  isSafeAdminMutation,
} from "@/lib/server/admin-auth";
import {
  createAdminLicense,
  listAdminLicenses,
  type LicenseCreateInput,
} from "@/lib/server/admin-licenses";
import { writeAdminAudit } from "@/lib/server/admin-products";

export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };

function unauthorized() {
  return Response.json(
    { ok: false, error: "unauthorized" },
    { status: 401, headers: noStore },
  );
}

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return unauthorized();
  }

  try {
    const licenses = await listAdminLicenses();

    return Response.json(
      {
        ok: true,
        licenses,
      },
      {
        headers: noStore,
      },
    );
  } catch (error) {
    console.error("Admin licenses list failed", error);

    return Response.json(
      {
        ok: false,
        error: "licenses_unavailable",
      },
      {
        status: 503,
        headers: noStore,
      },
    );
  }
}

export async function POST(request: Request) {
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

  let input: LicenseCreateInput;

  try {
    const parsed: unknown = await request.json();

    if (
      !parsed ||
      typeof parsed !== "object" ||
      Array.isArray(parsed)
    ) {
      throw new Error("invalid_request");
    }

    input = parsed as LicenseCreateInput;
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
    const result = await createAdminLicense(input);

    await writeAdminAudit(
      "license.create",
      "license",
      result.license.id,
      {
        entitlementId: result.license.entitlementId,
        deviceLimit: result.license.deviceLimit,
        status: result.license.status,
        expiresAt: result.license.expiresAt,
      },
    );

    return Response.json(
      {
        ok: true,
        license: result.license,

        // Raw license key is intentionally returned only here.
        // Only its SHA-256 hash is stored in D1.
        licenseKey: result.licenseKey,
      },
      {
        status: 201,
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
      message === "invalid_entitlement_dates" ||
      /required|invalid_/i.test(message);

    const conflict =
      /unique|constraint/i.test(message);

    console.error("Admin license create failed", error);

    return Response.json(
      {
        ok: false,
        error: conflict
          ? "license_conflict"
          : notFound
            ? "entitlement_not_found"
            : entitlementConflict
              ? message
              : validation
                ? message
                : "license_create_failed",
      },
      {
        status: conflict
          ? 409
          : notFound
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