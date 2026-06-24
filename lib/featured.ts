import type { EmojiRecord } from "./types";

/**
 * Beloved emoji the landing grid and "crowd favourites" strip should lead with,
 * roughly in priority order. Matched against normalized name/shortcodes so
 * "nyan cat", "nyancat" and "nyan-cat" all count.
 */
export const FEATURED: string[] = [
  "nyancat", "partyparrot", "parrot", "blobcat", "blob", "meow", "catjam",
  "pepe", "doge", "amongus", "thisisfine", "rickroll", "pogchamp", "poggers",
  "shrek", "pikachu", "mario", "sonic", "kekw", "feelsgoodman", "facepalm",
  "tada", "fire", "rocket", "100", "eyes", "sus", "yay", "dance",
];

const featuredIndex = new Map<string, number>(FEATURED.map((k, i) => [k, i]));

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

/** Lower = more featured. Non-featured records get a large, stable score. */
function score(r: EmojiRecord): number {
  let best = Infinity;
  const haystack = norm(`${r.name} ${r.shortcodes.join(" ")} ${r.category ?? ""}`);
  for (const [kw, idx] of featuredIndex) {
    if (haystack.includes(kw) && idx < best) best = idx;
  }
  return best;
}

/**
 * Stable ordering for the default (no-query) view: featured emoji first (in
 * FEATURED order), then everything else in original catalog order. Animated
 * Slackmojis edge out static ones within the non-featured tail so the grid
 * looks alive.
 */
export function featureSort(records: EmojiRecord[]): EmojiRecord[] {
  return records
    .map((r, i) => ({ r, i, s: score(r) }))
    .sort((a, b) => {
      if (a.s !== b.s) return a.s - b.s;
      if (a.s === Infinity) {
        const av = a.r.animated ? 0 : 1;
        const bv = b.r.animated ? 0 : 1;
        if (av !== bv) return av - bv;
      }
      return a.i - b.i;
    })
    .map((x) => x.r);
}

/**
 * A diverse favourites strip: one representative per FEATURED keyword (in
 * order), preferring animated matches, so the row shows nyancat, a party
 * parrot, a blob, meow, pepe… instead of 18 parrots.
 */
export function pickFeatured(records: EmojiRecord[], n: number): EmojiRecord[] {
  const picked: EmojiRecord[] = [];
  const seen = new Set<string>();
  for (const kw of FEATURED) {
    if (picked.length >= n) break;
    const matches = records.filter((r) => {
      if (seen.has(r.id)) return false;
      const hay = norm(`${r.name} ${r.shortcodes.join(" ")} ${r.category ?? ""}`);
      return hay.includes(kw);
    });
    if (matches.length === 0) continue;
    const best = matches.find((r) => r.animated) ?? matches[0];
    picked.push(best);
    seen.add(best.id);
  }
  return picked.slice(0, n);
}
