import { listPublicAnnouncements } from "@/lib/server/announcements";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const announcements = await listPublicAnnouncements();
    return Response.json(
      { ok: true, announcements },
      { headers: { "Cache-Control": "public, max-age=30, s-maxage=60" } },
    );
  } catch (error) {
    console.error("Announcements unavailable", error);
    return Response.json({ ok: false, announcements: [] }, { status: 503 });
  }
}
