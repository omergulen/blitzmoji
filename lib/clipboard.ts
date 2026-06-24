/** Clipboard + download helpers. All best-effort with sensible fallbacks. */

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Copy an image to the clipboard. The async Clipboard API reliably accepts
 * PNG; for other types (notably GIF) browsers often refuse, so we fall back to
 * copying the image URL as text. Returns the action that actually happened.
 */
export async function copyImage(src: string): Promise<"image" | "url" | "fail"> {
  try {
    const res = await fetch(src);
    const blob = await res.blob();
    if (blob.type === "image/png" && "ClipboardItem" in window) {
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
      return "image";
    }
    throw new Error("unsupported type");
  } catch {
    // Fall back to copying a usable URL.
    const ok = await copyText(absolute(src));
    return ok ? "url" : "fail";
  }
}

export async function downloadImage(src: string, filename: string): Promise<boolean> {
  try {
    const res = await fetch(src);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    return true;
  } catch {
    return false;
  }
}

function absolute(src: string): string {
  try {
    return new URL(src, window.location.origin).toString();
  } catch {
    return src;
  }
}
