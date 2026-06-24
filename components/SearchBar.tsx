"use client";

import { useEffect, useRef } from "react";

function Bolt() {
  return (
    <svg className="bolt" width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M13 2 4.5 13.5H11l-1 8.5 8.5-11.5H12l1-8.5Z" />
    </svg>
  );
}

export function SearchBar({
  value,
  onChange,
  count,
}: {
  value: string;
  onChange: (v: string) => void;
  count: number;
}) {
  const ref = useRef<HTMLInputElement>(null);

  // Press "/" anywhere to focus; Esc to clear.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement !== ref.current) {
        e.preventDefault();
        ref.current?.focus();
      } else if (e.key === "Escape" && document.activeElement === ref.current) {
        onChange("");
        ref.current?.blur();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onChange]);

  return (
    <div>
      <div className="console">
        <Bolt />
        <input
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search party-parrot, blob, happy…"
          aria-label="Search emoji"
          autoComplete="off"
          spellCheck={false}
        />
        {value ? (
          <button
            type="button"
            className="kbd"
            onClick={() => onChange("")}
            aria-label="Clear search"
          >
            clear
          </button>
        ) : (
          <span className="kbd" aria-hidden>
            press /
          </span>
        )}
      </div>
      <p className="mono" style={{ marginTop: 10, color: "var(--faint)", fontSize: "0.8rem" }}>
        <span style={{ color: "var(--volt)" }}>{count.toLocaleString()}</span> emoji · instant search ·
        click to copy
      </p>
    </div>
  );
}
