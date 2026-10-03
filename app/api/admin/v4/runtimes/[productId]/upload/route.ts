import { isAdminAuthenticated, isSafeAdminMutation } from "@/lib/server/admin-auth";
import {
  activateWebBuild,
  createWebBuild,
} from "@/lib/server/admin-v4";
import { writeAdminAudit } from "@/lib/server/admin-products";
import { getSysOneEnv, requireBinding } from "@/lib/server/cloudflare";
import {
  contentTypeForPath,
  unzipStaticBundle,
} from "@/lib/server/runtime-zip";

export const dynamic = "force-dynamic";

const MAX_ZIP_BYTES = 25 * 1024 * 1024;

type RouteContext = {
  params: Promise<{ productId: string }>;
};

function unauthorized() {
  return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
}

function safeVersion(value: unknown) {
  const version =
    typeof value === "string"
      ? value.trim().slice(0, 50)
      : "";

  if (!version || !/^[a-zA-Z0-9._+-]+$/.test(version)) {
    throw new Error("invalid_version");
  }

  return version;
}

function hex(bytes: ArrayBuffer) {
  return [...new Uint8Array(bytes)]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

export async function POST(request: Request, context: RouteContext) {
  if (!(await isAdminAuthenticated())) return unauthorized();

  if (!isSafeAdminMutation(request)) {
    return Response.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const { productId } = await context.params;

  try {
    const form = await request.formData();

    const file = form.get("file");
    const version = safeVersion(form.get("version"));
    const shouldActivate =
      String(form.get("activate") ?? "false").toLowerCase() === "true";

    if (!(file instanceof File)) {
      return Response.json(
        { ok: false, error: "file_required" },
        { status: 400 },
      );
    }

    if (file.size <= 0 || file.size > MAX_ZIP_BYTES) {
      return Response.json(
        { ok: false, error: "zip_too_large" },
        { status: 413 },
      );
    }

    if (!file.name.toLowerCase().endsWith(".zip")) {
      return Response.json(
        { ok: false, error: "zip_required" },
        { status: 415 },
      );
    }

    const buffer = await file.arrayBuffer();
    const entries = await unzipStaticBundle(buffer);

    const checksum = hex(
      await crypto.subtle.digest("SHA-256", buffer),
    );

    const prefix =
      `web/${productId}/${version}/${crypto.randomUUID()}`;

    const bucket = requireBinding(
      getSysOneEnv().SYSONE_RUNTIME,
      "SYSONE_RUNTIME",
    );

    let totalBytes = 0;

    for (const entry of entries) {
      totalBytes += entry.bytes.byteLength;

      await bucket.put(
        `${prefix}/${entry.path}`,
        entry.bytes,
        {
          httpMetadata: {
            contentType: contentTypeForPath(entry.path),
            cacheControl:
              entry.path === "index.html"
                ? "no-cache"
                : "public, max-age=31536000, immutable",
          },
        },
      );
    }

    const buildId = await createWebBuild({
      productId,
      version,
      prefix,
      fileCount: entries.length,
      sizeBytes: totalBytes,
      checksumSha256: checksum,
    });

    let product = null;

    if (shouldActivate) {
      product = await activateWebBuild(productId, buildId);
    }

    await writeAdminAudit(
      "runtime.build.upload",
      "web_build",
      buildId,
      {
        productId,
        version,
        fileCount: entries.length,
        sizeBytes: totalBytes,
        activated: shouldActivate,
      },
    );

    return Response.json(
      {
        ok: true,
        buildId,
        product,
      },
      { status: 201 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "runtime_upload_failed";

    const badRequest =
      /invalid_|required|unsafe_|unsupported|zip_|product_not_found/.test(
        message,
      );

    return Response.json(
      { ok: false, error: message },
      { status: badRequest ? 400 : 500 },
    );
  }
}
