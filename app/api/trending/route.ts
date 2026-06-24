import { getTrendingIds } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * Returns trending emoji ids (highest first). Empty array when the DB is
 * unconfigured or has no data yet — the client then shows a curated fallback.
 */
export async function GET() {
  const ids = (await getTrendingIds(24)) ?? [];
  return Response.json(
    { ids },
    { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } },
  );
}
