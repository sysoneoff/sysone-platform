import {
  activateDevice,
  type DeviceActivationInput,
} from "@/lib/server/device-activation";
import { hashLicenseKey } from "@/lib/server/admin-licenses";
import { getSysOneEnv, requireBinding } from "@/lib/server/cloudflare";

export const dynamic = "force-dynamic";

const noStore = {
  "Cache-Control": "no-store",
};

function errorResponse(
  error: string,
  status: number,
  extraHeaders?: Record<string, string>,
) {
  return Response.json(
    {
      ok: false,
      error,
    },
    {
      status,
      headers: {
        ...noStore,
        ...extraHeaders,
      },
    },
  );
}

function getClientKey(request: Request) {
  const cfIp = request.headers.get("cf-connecting-ip")?.trim();

  if (cfIp) {
    return `activation-ip:${cfIp}`;
  }

  const forwarded = request.headers
    .get("x-forwarded-for")
    ?.split(",")[0]
    ?.trim();

  return `activation-ip:${forwarded || "unknown"}`;
}

async function enforceIpRateLimit(request: Request) {
  const limiter = requireBinding(
    getSysOneEnv().SYSONE_ACTIVATION_IP_RATE_LIMIT,
    "SYSONE_ACTIVATION_IP_RATE_LIMIT",
  );

  return limiter.limit({
    key: getClientKey(request),
  });
}

async function enforceLicenseRateLimit(licenseKey: string) {
  const limiter = requireBinding(
    getSysOneEnv().SYSONE_ACTIVATION_LICENSE_RATE_LIMIT,
    "SYSONE_ACTIVATION_LICENSE_RATE_LIMIT",
  );

  const licenseHash = await hashLicenseKey(licenseKey.trim());

  return limiter.limit({
    key: `activation-license:${licenseHash}`,
  });
}

export async function POST(request: Request) {
  try {
    const { success } = await enforceIpRateLimit(request);

    if (!success) {
      return errorResponse("rate_limit_exceeded", 429, {
        "Retry-After": "60",
      });
    }
  } catch (error) {
    console.error("Activation IP rate limit failed", error);
    return errorResponse("activation_unavailable", 503);
  }

  let input: DeviceActivationInput;

  try {
    const parsed: unknown = await request.json();

    if (
      !parsed ||
      typeof parsed !== "object" ||
      Array.isArray(parsed)
    ) {
      return errorResponse("invalid_request", 400);
    }

    input = parsed as DeviceActivationInput;
  } catch {
    return errorResponse("invalid_request", 400);
  }

  if (
    typeof input.licenseKey === "string" &&
    input.licenseKey.trim()
  ) {
    try {
      const { success } = await enforceLicenseRateLimit(
        input.licenseKey,
      );

      if (!success) {
        return errorResponse("rate_limit_exceeded", 429, {
          "Retry-After": "60",
        });
      }
    } catch (error) {
      console.error("Activation license rate limit failed", error);
      return errorResponse("activation_unavailable", 503);
    }
  }

  try {
    const result = await activateDevice(input);

    return Response.json(
      {
        ok: true,
        activation: result,
      },
      {
        status: result.reused ? 200 : 201,
        headers: noStore,
      },
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "activation_failed";

    if (
      message === "license_key_required" ||
      message === "invalid_license_key" ||
      message === "device_id_required" ||
      message === "invalid_device_id" ||
      message === "invalid_device_label"
    ) {
      return errorResponse(message, 400);
    }

    if (message === "license_not_found") {
      return errorResponse("license_invalid", 401);
    }

    if (
      message === "license_not_active" ||
      message === "license_expired"
    ) {
      return errorResponse(message, 403);
    }

    if (
      message === "entitlement_not_active" ||
      message === "entitlement_not_started" ||
      message === "entitlement_expired"
    ) {
      return errorResponse(message, 403);
    }

    if (message === "device_limit_reached") {
      return errorResponse(message, 409);
    }

    if (
      message === "invalid_license_dates" ||
      message === "invalid_entitlement_dates"
    ) {
      return errorResponse("activation_unavailable", 503);
    }

    console.error("Device activation failed", error);

    return errorResponse("activation_failed", 500);
  }
}
