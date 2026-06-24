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
/** Collapse to lowercase alphanumerics so "party parrot" == "party-parrot" == "partyparrot". */
function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

/**
 * Literal-match rank for a record against a query, or null if it doesn't match.
 * Matching is punctuation/space-insensitive (normalized). Lower is better:
 *   0  exact name/shortcode    1  prefix match    2  substring (incl. tags)
 */
function literalRank(r: EmojiRecord, qNorm: string): number | null {
  const names = [r.name, ...r.shortcodes];
  for (const n of names) if (norm(n) === qNorm) return 0;
  for (const n of names) if (norm(n).startsWith(qNorm)) return 1;
  for (const n of names) if (norm(n).includes(qNorm)) return 2;
  for (const t of r.tags) if (norm(t).includes(qNorm)) return 2;
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
      const qNorm = norm(q);
      let base: EmojiRecord[];
      if (!qNorm) {
        base = records;
      } else {
        // Precise: literal matches, best rank first, catalog order as tiebreak.
        const hits: { r: EmojiRecord; rank: number; i: number }[] = [];
        records.forEach((r, i) => {
          const rank = literalRank(r, qNorm);
          if (rank !== null) hits.push({ r, rank, i });
        });
        if (hits.length > 0) {
          hits.sort((a, b) => a.rank - b.rank || a.i - b.i);
          base = hits.map((h) => h.r);
        } else {
          // Forgiving: typo-tolerant fuzzy fallback.
          base = fuse.search(q.trim()).map((res) => res.item);
        }
      }
      return filters ? base.filter((r) => passesFilters(r, filters)) : base;
    },
  };
}
