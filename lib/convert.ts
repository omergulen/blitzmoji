/** Browser-side image prep for sticker/emoji export. Canvas-based, best-effort. */
import type { PlatformPrep } from "./platforms";

const EXT: Record<string, string> = {
  "image/webp": "webp",
  "image/png": "png",
  "image/gif": "gif",
  "image/jpeg": "jpg",
};

/** Suggested download filename for a prepared file. */
export function preparedName(base: string, mime: string): string {
  const safe = base.replace(/[^a-z0-9_-]+/gi, "-").replace(/^-+|-+$/g, "") || "emoji";
  return `${safe}.${EXT[mime] ?? "png"}`;
}

/**
 * Render a source image onto a transparent square canvas of `size`px, scaled to
 * fit (contain) and centered, then encode to `type`. Used for Telegram/WhatsApp
 * stickers which require a 512×512 square. Returns null if the browser can't
 * decode/encode (e.g. no createImageBitmap) so callers can fall back.
 */
export async function squareImage(
  blob: Blob,
  size: number,
  type: "image/webp" | "image/png",
): Promise<Blob | null> {
  if (typeof document === "undefined" || typeof createImageBitmap !== "function") return null;
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(blob);
  } catch {
    return null;
  }
  try {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const scale = Math.min(size / bitmap.width, size / bitmap.height);
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, (size - w) / 2, (size - h) / 2, w, h);
    return await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), type, 0.92),
    );
  } finally {
    bitmap.close();
  }
}

export interface PreparedFile {
  blob: Blob;
  filename: string;
  /** True when we re-encoded to a square (so the UI can say "512×512 ready"). */
  reencoded: boolean;
  /** True when the source was animated but we could only keep a still/original. */
  animatedFallback: boolean;
}

/**
 * Fetch `src` and prepare it per a platform's requirements. Animated sources
 * (GIF) can't be re-encoded to an animated sticker in-browser, so for those we
 * keep the original file and flag `animatedFallback`.
 */
export async function prepareFile(
  src: string,
  base: string,
  prep: PlatformPrep,
  animated: boolean,
): Promise<PreparedFile> {
  const res = await fetch(src);
  const original = await res.blob();
  const origMime = original.type || "image/png";

  if (prep.keepOriginal || !prep.size || !prep.type) {
    return {
      blob: original,
      filename: preparedName(base, origMime),
      reencoded: false,
      animatedFallback: false,
    };
  }

  // Sticker platforms want a square. Animated GIF → still frame at target size.
  const square = await squareImage(original, prep.size, prep.type);
  if (!square) {
    return {
      blob: original,
      filename: preparedName(base, origMime),
      reencoded: false,
      animatedFallback: animated,
    };
  }
  return {
    blob: square,
    filename: preparedName(base, prep.type),
    reencoded: true,
    animatedFallback: animated,
  };
}

/** Trigger a browser download of a blob. */
export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
