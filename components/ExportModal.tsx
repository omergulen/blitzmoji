"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { EmojiRecord } from "@/lib/types";
import { imgSrc, shortcodeText } from "@/lib/images";
import { copyText } from "@/lib/clipboard";
import { prepareFile, saveBlob } from "@/lib/convert";
import {
  PLATFORMS,
  fillStep,
  platformByKey,
  slackEmojiUrl,
  type PlatformKey,
} from "@/lib/platforms";
import { track } from "@/lib/events";

const WORKSPACE_KEY = "blitzmoji.slack.workspace";

export function ExportModal({
  record,
  onClose,
  onToast,
}: {
  record: EmojiRecord | null;
  onClose: () => void;
  onToast: (msg: string) => void;
}) {
  const [platform, setPlatform] = useState<PlatformKey>("slack");
  const [workspace, setWorkspace] = useState(() => {
    if (typeof window === "undefined") return "";
    try {
      return localStorage.getItem(WORKSPACE_KEY) ?? "";
    } catch {
      return "";
    }
  });
  const [busy, setBusy] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Close on Escape; move focus into the dialog when it opens.
  useEffect(() => {
    if (!record) return;
    dialogRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [record, onClose]);

  const src = record ? imgSrc(record) : null;
  const code = record ? shortcodeText(record) : "";
  const base = record ? record.shortcodes[0] || record.name : "";
  const active = platformByKey(platform);
  const slackUrl = useMemo(() => slackEmojiUrl(workspace), [workspace]);

  const saveWorkspace = useCallback((v: string) => {
    setWorkspace(v);
    try {
      localStorage.setItem(WORKSPACE_KEY, v);
    } catch {
      /* ignore */
    }
  }, []);

  const copyName = useCallback(async () => {
    const ok = await copyText(code);
    onToast(ok ? `Copied ${code}` : "Copy failed");
  }, [code, onToast]);

  const download = useCallback(async () => {
    if (!src || !record) return;
    setBusy(true);
    try {
      const file = await prepareFile(src, base, active.prep, record.animated);
      saveBlob(file.blob, file.filename);
      track(record.id, "download");
      onToast(
        file.reencoded
          ? `${active.prep.size}px ready — ${file.filename}`
          : `Downloaded ${file.filename}`,
      );
    } catch {
      onToast("Download failed");
    } finally {
      setBusy(false);
    }
  }, [src, record, base, active, onToast]);

  if (!record) return null;

  const openHref = active.key === "slack" ? slackUrl : active.openUrl ?? null;
  const showAnimatedNote = record.animated && Boolean(active.animatedNote) && active.prep.size;

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={`Add ${base} to a chat app`}
        ref={dialogRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-x" onClick={onClose} aria-label="Close" type="button">
          ✕
        </button>

        <div className="modal-head">
          <div className="modal-emoji">
            {src ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={src} alt={record.name} />
            ) : (
              <span className="tile-glyph">{record.char}</span>
            )}
          </div>
          <div className="modal-meta">
            <p className="eyebrow" style={{ marginBottom: 6 }}>
              add to a chat app
            </p>
            <h2 className="modal-title">{record.name}</h2>
            <button className="code-pill mono" onClick={copyName} type="button" title="Copy shortcode">
              {code} <span className="code-copy">copy</span>
            </button>
          </div>
        </div>

        <div className="modal-tabs" role="tablist">
          {PLATFORMS.map((p) => (
            <button
              key={p.key}
              role="tab"
              aria-selected={p.key === platform}
              data-on={p.key === platform}
              className="modal-tab"
              onClick={() => setPlatform(p.key)}
              type="button"
            >
              <span aria-hidden>{p.icon}</span> {p.name}
            </button>
          ))}
        </div>

        <div className="modal-body">
          <p className="modal-blurb">{active.blurb}</p>

          <div className="modal-actions">
            <button className="btn-primary" onClick={download} disabled={busy} type="button">
              {busy
                ? "Preparing…"
                : active.prep.size
                  ? `Download ${active.prep.size}px`
                  : "Download image"}
            </button>
            {active.key === "slack" ? (
              <input
                className="ws-input mono"
                value={workspace}
                onChange={(e) => saveWorkspace(e.target.value)}
                placeholder="your-workspace"
                aria-label="Slack workspace subdomain"
                spellCheck={false}
              />
            ) : null}
            {openHref ? (
              <a
                className="btn-ghost"
                href={openHref}
                target="_blank"
                rel="noreferrer noopener"
              >
                {active.openLabel} ↗
              </a>
            ) : active.key === "slack" ? (
              <span className="ws-hint mono">enter workspace to deep-link ↑</span>
            ) : null}
          </div>

          <ol className="modal-steps">
            {active.steps.map((s, i) => (
              <li key={i}>{fillStep(s, code)}</li>
            ))}
          </ol>

          {showAnimatedNote ? (
            <p className="modal-note">⚠ {active.animatedNote}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
