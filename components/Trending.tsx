"use client";

import { useEffect, useMemo, useState } from "react";
import type { EmojiRecord } from "@/lib/types";
import { pickFeatured } from "@/lib/featured";
import { EmojiCard } from "./EmojiCard";

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
    return pickFeatured(all, 18);
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
