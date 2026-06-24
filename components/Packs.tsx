"use client";

import { PACKS } from "@/lib/packs";

export function Packs({
  active,
  onSelect,
}: {
  active: string;
  onSelect: (key: string) => void;
}) {
  return (
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
    </div>
  );
}
