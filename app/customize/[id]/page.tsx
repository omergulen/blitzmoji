"use client";

/**
 * Phase-2 seam: the customization route ("put my face on nyancat").
 *
 * This stub establishes the URL contract (/customize/<emoji-id>) and the
 * module boundary so the editor (see lib/editor/README.md) can drop in without
 * touching catalog or search. For now it previews the target emoji.
 */
import { use, useEffect, useState } from "react";
import Link from "next/link";
import type { EmojiRecord } from "@/lib/types";
import { loadCatalog } from "@/lib/catalog";
import { imgSrc, shortcodeText } from "@/lib/images";

export default function Customize({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const emojiId = decodeURIComponent(id);
  const [record, setRecord] = useState<EmojiRecord | null | undefined>(undefined);

  useEffect(() => {
    loadCatalog()
      .then((c) => setRecord(c.find((r) => r.id === emojiId) ?? null))
      .catch(() => setRecord(null));
  }, [emojiId]);

  const src = record ? imgSrc(record) : null;

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "40px 20px 80px" }}>
      <Link className="kbd" href="/" style={{ textDecoration: "none" }}>
        ← back to search
      </Link>

      <section style={{ marginTop: 40, textAlign: "center" }}>
        <p className="eyebrow" style={{ marginBottom: 16 }}>
          customize · coming soon
        </p>

        <div
          style={{
            width: 160,
            height: 160,
            margin: "0 auto 24px",
            display: "grid",
            placeItems: "center",
            border: "1px solid var(--line-2)",
            borderRadius: 20,
            background: "rgba(255,255,255,0.02)",
          }}
        >
          {record && src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt={record.name} style={{ width: "62%", height: "62%", objectFit: "contain" }} />
          ) : record ? (
            <span style={{ fontSize: 64 }}>{record.char}</span>
          ) : (
            <span className="mono" style={{ color: "var(--faint)" }}>
              {record === null ? "not found" : "…"}
            </span>
          )}
        </div>

        <h1 className="hero-title" style={{ fontSize: "clamp(1.8rem, 5vw, 2.8rem)" }}>
          Make it <span className="hero-grad">yours.</span>
        </h1>
        <p style={{ marginTop: 16, color: "var(--muted)", maxWidth: 460, margin: "16px auto 0" }}>
          Soon you&apos;ll be able to drop your own face onto{" "}
          <span className="mono" style={{ color: "var(--ink)" }}>
            {record ? shortcodeText(record) : "this emoji"}
          </span>{" "}
          and export a ready-to-upload custom emoji. The editor is on the roadmap.
        </p>
      </section>
    </main>
  );
}
