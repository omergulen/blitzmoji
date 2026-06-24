"use client";

import { useEffect, useMemo, useState } from "react";
import type { EmojiRecord } from "@/lib/types";
import { EmojiCard } from "./EmojiCard";

// Shown before live data exists (or when the DB is unconfigured): a hand-picked
// set of internet favourites, falling back to whatever the catalog has.
const CURATED = [
  "party-parrot", "parrot", "this-is-fine", "thinking", "blob-dance", "yay",
  "doge", "rocket", "tada", "fire", "100", "eyes", "rickroll", "nyan-cat",
  "meow-party", "shipit", "pepe", "feelsgoodman",
];

function pickFallback(records: EmojiRecord[]): EmojiRecord[] {
  const byShort = new Map<string, EmojiRecord>();
  for (const r of records) for (const s of r.shortcodes) if (!byShort.has(s)) byShort.set(s, r);
  const picked: EmojiRecord[] = [];
  const seen = new Set<string>();
  for (const name of CURATED) {
    const hit = byShort.get(name);
    if (hit && !seen.has(hit.id)) {
      picked.push(hit);
      seen.add(hit.id);
    }
  }
  // Pad with leading slackmojis so the strip is never sparse.
  for (const r of records) {
    if (picked.length >= 18) break;
    if (r.source === "slackmojis" && !seen.has(r.id)) {
      picked.push(r);
      seen.add(r.id);
    }
  }
  return picked.slice(0, 18);
}

export function Trending({
  byId,
  onToast,
}: {
  byId: Map<string, EmojiRecord>;
  onToast: (msg: string) => void;
}) {
  const [liveIds, setLiveIds] = useState<string[] | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/trending")
      .then((r) => (r.ok ? r.json() : { ids: [] }))
      .then((d: { ids?: string[] }) => alive && setLiveIds(d.ids ?? []))
      .catch(() => alive && setLiveIds([]));
    return () => {
      alive = false;
    };
  }, []);

  const records = useMemo(() => {
    const all = Array.from(byId.values());
    if (liveIds && liveIds.length > 0) {
      const live = liveIds.map((id) => byId.get(id)).filter(Boolean) as EmojiRecord[];
      if (live.length >= 6) return live.slice(0, 18);
    }
    return pickFallback(all);
  }, [byId, liveIds]);

  if (records.length === 0) return null;
  const live = Boolean(liveIds && liveIds.length > 0);

  return (
    <section style={{ marginTop: 24 }}>
      <p className="eyebrow" style={{ marginBottom: 12 }}>
        {live ? "⚡ trending now" : "⚡ crowd favourites"}
      </p>
      <div
        style={{
          display: "flex",
          gap: 12,
          overflowX: "auto",
          paddingBottom: 8,
          scrollbarWidth: "thin",
        }}
      >
        {records.map((rec) => (
          <div key={rec.id} style={{ flex: "0 0 86px", width: 86 }}>
            <EmojiCard record={rec} onToast={onToast} />
          </div>
        ))}
      </div>
    </section>
  );
}
