import type { EmojiRecord } from "./types";

/** Same-origin, cached source URL for an image emoji. Null for unicode glyphs. */
export function imgSrc(record: EmojiRecord): string | null {
  if (!record.imageUrl) return null;
  return `/img?u=${encodeURIComponent(record.imageUrl)}`;
}

/** Filename to use when downloading an emoji. */
export function downloadName(record: EmojiRecord): string {
  const ext = (record.imageUrl?.split("?")[0].split(".").pop() || "png").toLowerCase();
  const base = record.shortcodes[0] || record.name.replace(/\s+/g, "-");
  return `${base}.${ext}`;
}

/** The :shortcode: text people paste into Slack. */
export function shortcodeText(record: EmojiRecord): string {
  return `:${record.shortcodes[0] || record.name}:`;
}
