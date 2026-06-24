"use client";

import type { SearchFilters } from "@/lib/search";

export function Filters({
  filters,
  onChange,
}: {
  filters: SearchFilters;
  onChange: (next: SearchFilters) => void;
}) {
  const source = filters.source ?? "all";
  const set = (patch: Partial<SearchFilters>) => onChange({ ...filters, ...patch });

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
      <button className="chip" data-on={source === "all"} onClick={() => set({ source: "all" })}>
        all
      </button>
      <button
        className="chip"
        data-on={source === "slackmojis"}
        onClick={() => set({ source: "slackmojis" })}
      >
        :slack:
      </button>
      <button
        className="chip"
        data-on={source === "unicode"}
        onClick={() => set({ source: "unicode" })}
      >
        unicode
      </button>
      <button
        className="chip"
        data-on={Boolean(filters.animatedOnly)}
        onClick={() => set({ animatedOnly: !filters.animatedOnly })}
      >
        ⚡ animated
      </button>
    </div>
  );
}
