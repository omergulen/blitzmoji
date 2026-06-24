import Fuse from "fuse.js";
import type { EmojiRecord, EmojiSource } from "./types";

export interface SearchFilters {
  source?: EmojiSource | "all";
  animatedOnly?: boolean;
  category?: string | null;
}

export interface Search {
  query: (q: string, filters?: SearchFilters) => EmojiRecord[];
}

function passesFilters(r: EmojiRecord, f?: SearchFilters): boolean {
  if (!f) return true;
  if (f.source && f.source !== "all" && r.source !== f.source) return false;
  if (f.animatedOnly && !r.animated) return false;
  if (f.category && r.category !== f.category) return false;
  return true;
}

/**
 * Build an in-memory fuzzy search over the catalog.
 * Empty queries return all records in original (catalog) order; non-empty
 * queries return Fuse-ranked results. Filters apply in both cases.
 */
/**
 * Literal-match rank for a record against a lowercased query, or null if it
 * doesn't match at all. Lower is better:
 *   0  exact name/shortcode    1  prefix match    2  substring (incl. tags)
 */
function literalRank(r: EmojiRecord, q: string): number | null {
  const name = r.name.toLowerCase();
  const shorts = r.shortcodes.map((s) => s.toLowerCase());
  if (name === q || shorts.includes(q)) return 0;
  if (name.startsWith(q) || shorts.some((s) => s.startsWith(q))) return 1;
  if (name.includes(q) || shorts.some((s) => s.includes(q))) return 2;
  if (r.tags.some((t) => t.toLowerCase().includes(q))) return 2;
  return null;
}

export function createSearch(records: EmojiRecord[]): Search {
  // Fuse is only the typo-tolerant fallback when nothing matches literally.
  const fuse = new Fuse(records, {
    keys: [
      { name: "name", weight: 0.5 },
      { name: "shortcodes", weight: 0.3 },
      { name: "tags", weight: 0.2 },
    ],
    threshold: 0.3,
    ignoreLocation: true,
    minMatchCharLength: 2,
  });

  return {
    query(q: string, filters?: SearchFilters): EmojiRecord[] {
      const trimmed = q.trim().toLowerCase();
      let base: EmojiRecord[];
      if (!trimmed) {
        base = records;
      } else {
        // Precise: literal matches, best rank first, catalog order as tiebreak.
        const hits: { r: EmojiRecord; rank: number; i: number }[] = [];
        records.forEach((r, i) => {
          const rank = literalRank(r, trimmed);
          if (rank !== null) hits.push({ r, rank, i });
        });
        if (hits.length > 0) {
          hits.sort((a, b) => a.rank - b.rank || a.i - b.i);
          base = hits.map((h) => h.r);
        } else {
          // Forgiving: typo-tolerant fuzzy fallback.
          base = fuse.search(trimmed).map((res) => res.item);
        }
      }
      return filters ? base.filter((r) => passesFilters(r, filters)) : base;
    },
  };
}
