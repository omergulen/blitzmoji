/**
 * Where a Blitzmoji can go, and how to get it there.
 *
 * Custom-emoji and sticker systems all want a slightly different file: Slack and
 * Discord take the original image as-is, while WhatsApp and Telegram stickers
 * must be a 512×512 square. Each platform below declares how to prepare the file
 * (`prep`), a deep link to the right screen (`open`), and the human steps.
 *
 * None of these platforms expose a browser-side "add this emoji" API, so the
 * honest, reliable UX is: hand the user a correctly-shaped file + the exact
 * screen + the steps. That's what the ExportModal drives.
 */

export type PlatformKey = "slack" | "discord" | "telegram" | "whatsapp";

export interface PlatformPrep {
  /** Square target size in px; omitted → keep the original dimensions. */
  size?: number;
  /** Output encoding when we re-render; omitted with size → keep original type. */
  type?: "image/webp" | "image/png";
  /** True → never re-encode, always download the source file untouched. */
  keepOriginal?: boolean;
}

export interface Platform {
  key: PlatformKey;
  name: string;
  /** Emoji used as the tab glyph. */
  icon: string;
  /** One-line "what this is" under the tab. */
  blurb: string;
  prep: PlatformPrep;
  /** Ordered, imperative steps. `{code}` is replaced with the :shortcode:. */
  steps: string[];
  /** Label for the primary open-platform button, when there's a deep link. */
  openLabel?: string;
  /** True → this platform needs the user's Slack workspace subdomain. */
  needsWorkspace?: boolean;
  /** Static deep link (used when there's nothing to interpolate). */
  openUrl?: string;
  /** Note shown when the emoji is animated and the format can't be re-encoded. */
  animatedNote?: string;
}

export const PLATFORMS: Platform[] = [
  {
    key: "slack",
    name: "Slack",
    icon: "💬",
    blurb: "Custom emoji — the original Blitzmoji use case.",
    prep: { keepOriginal: true },
    needsWorkspace: true,
    openLabel: "Open Slack emoji settings",
    steps: [
      "Download the image (button above).",
      "Open your workspace's emoji admin — set your workspace once and we'll deep-link it.",
      'Click "Add Custom Emoji", upload the file, and name it {code}.',
    ],
  },
  {
    key: "discord",
    name: "Discord",
    icon: "🎮",
    blurb: "Server custom emoji (up to 256 KB, 128×128 recommended).",
    prep: { keepOriginal: true },
    openLabel: "Open Discord",
    openUrl: "https://discord.com/app",
    steps: [
      "Download the image (button above).",
      "In your server: Server Settings → Emoji → Upload Emoji.",
      "Pick the file and name it {code} (no colons needed).",
    ],
  },
  {
    key: "telegram",
    name: "Telegram",
    icon: "✈️",
    blurb: "Sticker pack via @Stickers — stickers are 512×512.",
    prep: { size: 512, type: "image/png" },
    openLabel: "Open @Stickers bot",
    openUrl: "https://t.me/stickers",
    animatedNote:
      "Animated GIFs can't be re-encoded to Telegram's video-sticker format in the browser — the GIF downloads as-is; @Stickers will accept it for a static sticker (first frame) or you can convert to .webm first.",
    steps: [
      "Download the 512×512 image (button above).",
      "Open @Stickers and send /newpack (or /addsticker to extend a pack).",
      "Send the downloaded file, then send an emoji to tag it. /publish when done.",
    ],
  },
  {
    key: "whatsapp",
    name: "WhatsApp",
    icon: "🟢",
    blurb: "Sticker — 512×512 WebP, added through a sticker-maker app.",
    prep: { size: 512, type: "image/webp" },
    animatedNote:
      "WhatsApp animated stickers need a 512×512 animated WebP; the browser can't re-encode a GIF to that, so the still frame is exported instead.",
    steps: [
      "Download the 512×512 WebP (button above).",
      "WhatsApp has no web upload — open a sticker-maker app (Sticker Maker / Sticker.ly).",
      "Import the file there and tap “Add to WhatsApp”.",
    ],
  },
];

export function platformByKey(key: string): Platform {
  return PLATFORMS.find((p) => p.key === key) ?? PLATFORMS[0];
}

/** Normalize whatever the user typed into a bare Slack workspace subdomain. */
export function slackSubdomain(input: string): string | null {
  const raw = input.trim().toLowerCase();
  if (!raw) return null;
  // Accept "acme", "acme.slack.com", "https://acme.slack.com/…"
  const m = raw.match(/^(?:https?:\/\/)?([a-z0-9][a-z0-9-]*)(?:\.slack\.com)?/);
  const sub = m?.[1];
  if (!sub || sub === "slack" || sub === "app" || sub === "www") return null;
  return sub;
}

/** Deep link to a workspace's custom-emoji admin, or null if we can't build it. */
export function slackEmojiUrl(input: string): string | null {
  const sub = slackSubdomain(input);
  return sub ? `https://${sub}.slack.com/customize/emoji` : null;
}

/** Fill `{code}` placeholders in a step with the emoji's :shortcode:. */
export function fillStep(step: string, code: string): string {
  return step.replaceAll("{code}", code);
}
