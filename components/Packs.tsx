"use client";

import { useState } from "react";
import { PACKS } from "@/lib/packs";
import type { CategoryCount } from "@/lib/catalog";

export const CAT_PREFIX = "cat:";

export function Packs({
  active,
  onSelect,
  categories,
}: {
  active: string;
  onSelect: (key: string) => void;
  categories: CategoryCount[];
}) {
  const [showAll, setShowAll] = useState(false);

  return (
    <div>
      <div className="packs" role="tablist" aria-label="Emoji packs">
        {PACKS.map((p) => (
          <button
            key={p.key}
            role="tab"
            aria-selected={active === p.key}
            className="pack"
            data-on={active === p.key}
            onClick={() => onSelect(p.key)}
          >
            <span aria-hidden style={{ fontSize: "1rem", lineHeight: 1 }}>
              {p.icon}
            </span>
            {p.label}
          </button>
        ))}
        <button
          className="pack"
          data-on={showAll}
          aria-expanded={showAll}
          onClick={() => setShowAll((v) => !v)}
        >
          {showAll ? "Hide categories ▴" : `All ${categories.length} categories ▾`}
        </button>
      </div>

      {showAll && (
        <div className="cat-grid">
          {categories.map((c) => {
            const key = CAT_PREFIX + c.category;
            return (
              <button
                key={c.category}
                className="cat-chip"
                data-on={active === key}
                onClick={() => onSelect(key)}
              >
                <span>{c.category}</span>
                <span className="cat-count">{c.count}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
