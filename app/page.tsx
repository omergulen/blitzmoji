"use client";

import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import type { EmojiRecord } from "@/lib/types";
import { loadCatalog, categoriesOf } from "@/lib/catalog";
import { createSearch, type SearchFilters } from "@/lib/search";
import { SearchBar } from "@/components/SearchBar";
import { Filters } from "@/components/Filters";
import { EmojiGrid } from "@/components/EmojiGrid";
import { Trending } from "@/components/Trending";

export default function Home() {
  const [catalog, setCatalog] = useState<EmojiRecord[] | null>(null);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<SearchFilters>({ source: "all" });
  const [toast, setToast] = useState<string>("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadCatalog().then(setCatalog).catch(() => setCatalog([]));
  }, []);

  const search = useMemo(() => (catalog ? createSearch(catalog) : null), [catalog]);
  const categories = useMemo(() => (catalog ? categoriesOf(catalog) : []), [catalog]);

  const deferredQuery = useDeferredValue(query);
  const results = useMemo(
    () => (search ? search.query(deferredQuery, filters) : []),
    [search, deferredQuery, filters],
  );

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 1800);
  }, []);

  const byId = useMemo(() => {
    const m = new Map<string, EmojiRecord>();
    if (catalog) for (const r of catalog) m.set(r.id, r);
    return m;
  }, [catalog]);

  const isSearching = query.trim().length > 0;

  return (
    <main style={{ width: "100%", maxWidth: 1200, margin: "0 auto", padding: "0 20px 80px" }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "22px 0",
        }}
      >
        <div className="wordmark">
          <span className="blitz">blitz</span>
          <span>moji</span>
        </div>
        <a
          className="kbd"
          href="https://slackmojis.com"
          target="_blank"
          rel="noreferrer noopener"
          style={{ textDecoration: "none" }}
        >
          emoji via slackmojis ↗
        </a>
      </header>

      <section style={{ paddingTop: "clamp(24px, 7vw, 70px)", paddingBottom: 28, maxWidth: 760 }}>
        <p className="eyebrow" style={{ marginBottom: 14 }}>
          every slack emoji · zero login
        </p>
        <h1 className="hero-title">
          Find any emoji at <span className="hero-grad">the speed of light.</span>
        </h1>
        <p
          style={{
            marginTop: 18,
            color: "var(--muted)",
            fontSize: "clamp(1rem, 2.2vw, 1.15rem)",
            maxWidth: 540,
          }}
        >
          Thousands of Slack-style and Unicode emoji, searchable instantly. Click to copy, grab the{" "}
          <span className="mono" style={{ color: "var(--ink)" }}>:shortcode:</span>, or download —
          no account, no friction.
        </p>
      </section>

      {catalog === null ? (
        <p className="mono" style={{ color: "var(--faint)", padding: "2rem 0" }}>
          ⚡ charging the catalog…
        </p>
      ) : (
        <>
          <div
            style={{
              position: "sticky",
              top: 0,
              zIndex: 20,
              paddingTop: 8,
              paddingBottom: 14,
              background: "linear-gradient(180deg, var(--void) 72%, transparent)",
            }}
          >
            <SearchBar value={query} onChange={setQuery} count={results.length} />
            <div style={{ marginTop: 14 }}>
              <Filters filters={filters} onChange={setFilters} categories={categories} />
            </div>
          </div>

          {!isSearching && <Trending byId={byId} onToast={showToast} />}

          <section style={{ marginTop: 22 }}>
            <p className="eyebrow" style={{ marginBottom: 14 }}>
              {isSearching ? `results for “${query}”` : "all emoji"}
            </p>
            <EmojiGrid records={results} onToast={showToast} />
          </section>
        </>
      )}

      <footer
        style={{
          marginTop: 64,
          paddingTop: 24,
          borderTop: "1px solid var(--line)",
          color: "var(--faint)",
          fontSize: "0.82rem",
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          justifyContent: "space-between",
        }}
      >
        <span className="mono">blitzmoji — built for speed ⚡</span>
        <span>
          Custom emoji are community works via{" "}
          <a className="link" href="https://slackmojis.com" target="_blank" rel="noreferrer noopener">
            Slackmojis
          </a>
          . Takedown: open an issue on GitHub.
        </span>
      </footer>

      <div className="toast" data-show={Boolean(toast)} role="status" aria-live="polite">
        <span className="bolt">⚡</span>
        {toast}
      </div>
    </main>
  );
}
