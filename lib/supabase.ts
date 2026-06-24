import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** Returns a Supabase client, or null when env is not configured (graceful degrade). */
export function getSupabase(): SupabaseClient | null {
  if (!url || !anonKey) return null;
  return createClient(url, anonKey, { auth: { persistSession: false } });
}

export const supabaseConfigured = Boolean(url && anonKey);

/** Record an anonymous interaction. No-op (returns false) when DB is unconfigured. */
export async function incrementStat(
  emojiId: string,
  kind: "copy" | "download",
): Promise<boolean> {
  const db = getSupabase();
  if (!db) return false;
  const { error } = await db.rpc("increment_stat", {
    p_emoji_id: emojiId,
    p_kind: kind,
  });
  return !error;
}

/** Returns trending emoji ids (highest first), or null when DB is unconfigured/unavailable. */
export async function getTrendingIds(limit = 24): Promise<string[] | null> {
  const db = getSupabase();
  if (!db) return null;
  const { data, error } = await db.rpc("get_trending", { p_limit: limit });
  if (error || !data) return null;
  return (data as { id: string }[]).map((r) => r.id);
}
