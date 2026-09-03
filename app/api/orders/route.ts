import { createPendingOneTimeOrder } from "@/lib/server/orders";
import {
  getCurrentUser,
  isSafeUserMutation,
} from "@/lib/server/user-auth";

export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 4 * 1024;

function json(
  body: Record<string, unknown>,
  status = 200,
) {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

async function readJsonBody(
  request: Request,
): Promise<
  | { ok: true; value: unknown }
  | { ok: false; response: Response }
> {
  const contentType =
    request.headers.get("content-type") ?? "";

  if (
    !contentType
      .toLowerCase()
      .includes("application/json")
  ) {
    return {
      ok: false,
      response: json(
        {
          ok: false,
          error: "application_json_required",
        },
        415,
      ),
    };
  }

  const contentLength =
    request.headers.get("content-length");

  if (contentLength) {
    const size = Number(contentLength);

    if (
      Number.isFinite(size) &&
      size > MAX_BODY_BYTES
    ) {
      return {
        ok: false,
        response: json(
          {
            ok: false,
            error: "request_body_too_large",
          },
          413,
        ),
      };
    }
  }

  try {
    const raw = await request.text();

    if (
      new TextEncoder()
        .encode(raw)
        .byteLength > MAX_BODY_BYTES
    ) {
      return {
        ok: false,
        response: json(
          {
            ok: false,
            error: "request_body_too_large",
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
          error: "invalid_json_body",
        },
        400,
      ),
    };
  }
}

function parseProductSlug(value: unknown) {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return null;
  }

  const input =
    value as Record<string, unknown>;

  const allowedKeys =
    new Set(["productSlug"]);

  for (const key of Object.keys(input)) {
    if (!allowedKeys.has(key)) {
      return null;
    }
  }

  if (typeof input.productSlug !== "string") {
    return null;
  }

  const productSlug =
    input.productSlug.trim().toLowerCase();

  if (
    !productSlug ||
    productSlug.length > 160
  ) {
    return null;
  }

  return productSlug;
}

export async function POST(request: Request) {
  if (!isSafeUserMutation(request)) {
    return json(
      {
        ok: false,
        error: "invalid_request_origin",
      },
      403,
    );
  }

  const user = await getCurrentUser();

  if (!user) {
    return json(
      {
        ok: false,
        error: "authentication_required",
      },
      401,
    );
  }

  const body =
    await readJsonBody(request);

  if (!body.ok) {
    return body.response;
  }

  const productSlug =
    parseProductSlug(body.value);

  if (!productSlug) {
    return json(
      {
        ok: false,
        error: "invalid_product_slug",
      },
      400,
   );
  }

  try {
    const result =
      await createPendingOneTimeOrder(
        user.id,
        productSlug,
      );

    return json(
      {
        ok: true,
        reused: result.reused,
        order: result.order,
      },
      result.reused ? 200 : 201,
   );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "unknown_error";

    if (
      message === "product_not_found"
    ) {
      return json(
        {
          ok: false,
          error: message,
        },
        404,
      );
    }

    if (
      message === "product_already_owned"
    ) {
      return json(
        {
          ok: false,
          error: message,
        },
        409,
     );
    }

    if (
      message ===
        "unsupported_pricing_model" ||
      message ===
        "invalid_product_price" ||
      message ===
        "invalid_product_currency"
    ) {
      return json(
        {
          ok: false,
          error: message,
        },
        422,
      );
    }

    if (
      message ===
        "invalid_product_slug"
    ) {
      return json(
        {
          ok: false,
          error: message,
        },
        400,
     );
    }

    console.error(
      "Order creation failed",
      message,
    );

    return json(
      {
        ok: false,
        error: "order_creation_failed",
      },
      500,
    );
  }
}
