import type { EmojiRecord } from "./types";

/** Fetch the static catalog index (served from /public). Client-side. */
export async function loadCatalog(): Promise<EmojiRecord[]> {
  const res = await fetch("/catalog.json", { cache: "force-cache" });
  if (!res.ok) throw new Error(`Failed to load catalog: ${res.status}`);
  return (await res.json()) as EmojiRecord[];
}

/** Distinct, sorted category labels present in the catalog. */
export function categoriesOf(records: EmojiRecord[]): string[] {
  const set = new Set<string>();
  for (const r of records) if (r.category) set.add(r.category);
  return Array.from(set).sort();
}
