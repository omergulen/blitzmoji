"use client";

import { useEffect, useRef, useState } from "react";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import type { EmojiRecord } from "@/lib/types";
import { EmojiCard } from "./EmojiCard";

const GAP = 12;
const MIN_TILE = 104;

export function EmojiGrid({
  records,
  onToast,
}: {
  records: EmojiRecord[];
  onToast: (msg: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => {
      setWidth(el.clientWidth);
      setOffset(el.offsetTop);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  const cols = Math.max(2, Math.floor((width + GAP) / (MIN_TILE + GAP))) || 2;
  const colWidth = width > 0 ? (width - GAP * (cols - 1)) / cols : MIN_TILE;
  const rowHeight = colWidth + GAP;
  const rowCount = Math.ceil(records.length / cols);

  const virtualizer = useWindowVirtualizer({
    count: rowCount,
    estimateSize: () => rowHeight,
    overscan: 4,
    scrollMargin: offset,
  });

  return (
    <div ref={containerRef} style={{ width: "100%" }}>
      {records.length === 0 ? (
        <p className="mono" style={{ color: "var(--muted)", padding: "3rem 0", textAlign: "center" }}>
          No emoji match that. Try another word.
        </p>
      ) : (
        <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
          {virtualizer.getVirtualItems().map((row) => {
            const start = row.index * cols;
            const items = records.slice(start, start + cols);
            return (
              <div
                key={row.key}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${row.start - virtualizer.options.scrollMargin}px)`,
                  display: "grid",
                  gridTemplateColumns: `repeat(${cols}, 1fr)`,
                  gap: GAP,
                  paddingBottom: GAP,
                }}
              >
                {items.map((rec) => (
                  <EmojiCard key={rec.id} record={rec} onToast={onToast} />
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
