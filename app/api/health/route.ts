import { getSysOneEnv, requireBinding } from "@/lib/server/cloudflare";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const env = getSysOneEnv();
    const db = requireBinding(env.SYSONE_DB, "SYSONE_DB");
    const result = await db.prepare("SELECT 1 AS ok").first<{ ok: number }>();

    return Response.json(
      {
        ok: result?.ok === 1,
        service: "sysone-platform",
        database: result?.ok === 1 ? "connected" : "unavailable",
        bindings: {
          kv: Boolean(env.SYSONE_CONFIG),
          assets: Boolean(env.SYSONE_ASSETS),
          downloads: Boolean(env.SYSONE_DOWNLOADS),
        },
        timestamp: new Date().toISOString(),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("SysOne health check failed", error);
    return Response.json(
      { ok: false, service: "sysone-platform", error: "backend_unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
