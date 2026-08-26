import {
  activateDevice,
  type DeviceActivationInput,
} from "@/lib/server/device-activation";

export const dynamic = "force-dynamic";

const noStore = {
  "Cache-Control": "no-store",
};

function errorResponse(
  error: string,
  status: number,
) {
  return Response.json(
    {
      ok: false,
      error,
    },
    {
      status,
      headers: noStore,
    },
  );
}

export async function POST(request: Request) {
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