import { getPublicUiConfig } from "@/lib/server/platform-config";

export const dynamic = "force-dynamic";

export async function GET() {
  const config = await getPublicUiConfig();
  return Response.json(
    { ok: true, ...config },
    { headers: { "Cache-Control": "no-store" } },
  );
}
