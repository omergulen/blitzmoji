"use client";

import { memo, useCallback } from "react";
import type { EmojiRecord } from "@/lib/types";
import { imgSrc, downloadName, shortcodeText } from "@/lib/images";
import { copyImage, copyText, downloadImage } from "@/lib/clipboard";
import { track } from "@/lib/events";

function CopyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
    </svg>
  );
}
function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M12 3v12" />
      <path d="m7 11 5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  );
}
function TagIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M7 8 4 12l3 4" />
      <path d="m17 8 3 4-3 4" />
      <path d="m14 5-4 14" />
    </svg>
  );
}

export const EmojiCard = memo(function EmojiCard({
  record,
  onToast,
}: {
  record: EmojiRecord;
  onToast: (msg: string) => void;
}) {
  const src = imgSrc(record);
  const code = shortcodeText(record);

  const primaryCopy = useCallback(async () => {
    if (record.char) {
      const ok = await copyText(record.char);
      onToast(ok ? `Copied ${record.char}` : "Copy failed");
    } else if (src) {
      const result = await copyImage(src);
      onToast(
        result === "image"
          ? `Copied ${code}`
          : result === "url"
            ? `Copied image link`
            : "Copy failed",
      );
    }
    track(record.id, "copy");
  }, [record, src, code, onToast]);

  const copyCode = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      const ok = await copyText(code);
      onToast(ok ? `Copied ${code}` : "Copy failed");
      track(record.id, "copy");
    },
    [code, record.id, onToast],
  );

  const download = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!src) return;
      const ok = await downloadImage(src, downloadName(record));
      onToast(ok ? `Downloaded ${downloadName(record)}` : "Download failed");
      track(record.id, "download");
    },
    [src, record, onToast],
  );

  return (
    <button
      type="button"
      className="tile"
      onClick={primaryCopy}
      title={`${code} — click to copy`}
      aria-label={`${record.name}, ${code}`}
    >
      {record.animated && <span className="gifdot">GIF</span>}

      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="tile-img" src={src} alt={record.name} loading="lazy" decoding="async" />
      ) : (
        <span className="tile-glyph">{record.char}</span>
      )}

      <span className="tile-actions">
        <span className="act" role="button" tabIndex={-1} onClick={copyCode} title={`Copy ${code}`}>
          <TagIcon />
        </span>
        {src && (
          <span className="act" role="button" tabIndex={-1} onClick={download} title="Download">
            <DownloadIcon />
          </span>
        )}
        {!src && (
          <span className="act" role="button" tabIndex={-1} onClick={primaryCopy} title="Copy emoji">
            <CopyIcon />
          </span>
        )}
      </span>

      <span className="tile-name mono">{record.shortcodes[0] || record.name}</span>
    </button>
  );
});
