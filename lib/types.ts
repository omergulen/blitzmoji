export type EmojiSource = "slackmojis" | "unicode";

/** Canonical, source-agnostic emoji record used across ingest, catalog, and UI. */
export interface EmojiRecord {
  /** Stable id, e.g. "slackmojis:1" or "unicode:1f600". */
  id: string;
  source: EmojiSource;
  /** Human display name. */
  name: string;
  /** `:shortcode:` bases (no colons), lowercased. */
  shortcodes: string[];
  /** Free-text search keywords. */
  tags: string[];
  category: string | null;
  /** Slackmojis submitter, when known. */
  credit: string | null;
  /** Served image URL (our R2 mirror) for image emojis; null for unicode glyphs. */
  imageUrl: string | null;
  /** Native unicode glyph for unicode emojis; null for image emojis. */
  char: string | null;
  animated: boolean;
  width?: number;
  height?: number;
}

/** Raw Slackmojis API record (slackmojis.com/emojis.json). */
export interface SlackmojiRaw {
  id: number;
  name: string;
  credit?: string | null;
  image_url: string;
  category?: { id: number; name: string } | null;
}

/** Raw emojibase data record (emojibase-data/en/data.json). */
export interface EmojibaseRaw {
  label: string;
  hexcode: string;
  emoji: string;
  tags?: string[];
  group?: number;
}
