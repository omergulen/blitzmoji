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
export function createSearch(records: EmojiRecord[]): Search {
  const fuse = new Fuse(records, {
    keys: [
      { name: "name", weight: 0.5 },
      { name: "shortcodes", weight: 0.3 },
      { name: "tags", weight: 0.2 },
    ],
    threshold: 0.35,
    ignoreLocation: true,
    minMatchCharLength: 1,
    useExtendedSearch: false,
  });

  return {
    query(q: string, filters?: SearchFilters): EmojiRecord[] {
      const trimmed = q.trim();
      const base = trimmed
        ? fuse.search(trimmed).map((res) => res.item)
        : records;
      return filters ? base.filter((r) => passesFilters(r, filters)) : base;
    },
  };
}
