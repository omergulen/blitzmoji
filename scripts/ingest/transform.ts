import type { EmojiRecord, SlackmojiRaw, EmojibaseRaw } from "@/lib/types";

/** "Party Parrot!" -> "party-parrot" */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Split a name into distinct lowercase search words. */
export function keywords(name: string): string[] {
  const words = name
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
  return Array.from(new Set(words));
}

/** Best-effort detection of animated assets from a URL/extension. */
function isAnimated(url: string): boolean {
  return /\.gif(\?|$)/i.test(url);
}

export function slackmojiToRecord(raw: SlackmojiRaw, mirroredUrl: string): EmojiRecord {
  const slug = slugify(raw.name);
  return {
    id: `slackmojis:${raw.id}`,
    source: "slackmojis",
    name: raw.name,
    shortcodes: [slug],
    tags: keywords(raw.name),
    category: raw.category?.name ?? null,
    credit: raw.credit ?? null,
    imageUrl: mirroredUrl,
    char: null,
    animated: isAnimated(raw.image_url),
  };
}

export function unicodeToRecord(
  raw: EmojibaseRaw,
  shortcodes: string[],
  category: string | null,
): EmojiRecord {
  const tags = Array.from(new Set([...(raw.tags ?? []), ...keywords(raw.label)]));
  return {
    id: `unicode:${raw.hexcode.toLowerCase()}`,
    source: "unicode",
    name: raw.label,
    shortcodes,
    tags,
    category,
    credit: null,
    imageUrl: null,
    char: raw.emoji,
    animated: false,
  };
}
