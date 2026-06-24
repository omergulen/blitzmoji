"use client";

import type { SearchFilters } from "@/lib/search";

export function Filters({
  filters,
  onChange,
  categories,
}: {
  filters: SearchFilters;
  onChange: (next: SearchFilters) => void;
  categories: string[];
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

      {categories.length > 0 && (
        <select
          className="chip"
          value={filters.category ?? ""}
          onChange={(e) => set({ category: e.target.value || null })}
          aria-label="Filter by category"
          style={{ appearance: "none" }}
        >
          <option value="">all categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
