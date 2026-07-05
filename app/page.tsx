"use client";

import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import type { EmojiRecord } from "@/lib/types";
import { loadCatalog, categoryCounts } from "@/lib/catalog";
import { featureSort } from "@/lib/featured";
import { createSearch, type SearchFilters } from "@/lib/search";
import { DEFAULT_PACK, packByKey } from "@/lib/packs";
import { SearchBar } from "@/components/SearchBar";
import { Filters } from "@/components/Filters";
import { Packs, CAT_PREFIX } from "@/components/Packs";
import { EmojiGrid } from "@/components/EmojiGrid";
import { ExportModal } from "@/components/ExportModal";

export default function Home() {
  const [catalog, setCatalog] = useState<EmojiRecord[] | null>(null);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<SearchFilters>({ source: "all" });
  const [pack, setPack] = useState<string>(DEFAULT_PACK);
  const [trendingIds, setTrendingIds] = useState<string[] | null>(null);
  const [toast, setToast] = useState<string>("");
  const [adding, setAdding] = useState<EmojiRecord | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadCatalog().then(setCatalog).catch(() => setCatalog([]));
    fetch("/api/trending")
      .then((r) => (r.ok ? r.json() : { ids: [] }))
      .then((d: { ids?: string[] }) => setTrendingIds(d.ids ?? []))
      .catch(() => setTrendingIds([]));
  }, []);

  const ordered = useMemo(() => (catalog ? featureSort(catalog) : null), [catalog]);
  const search = useMemo(() => (ordered ? createSearch(ordered) : null), [ordered]);
  const byId = useMemo(() => {
    const m = new Map<string, EmojiRecord>();
    if (catalog) for (const r of catalog) m.set(r.id, r);
    return m;
  }, [catalog]);

  const categories = useMemo(() => (catalog ? categoryCounts(catalog) : []), [catalog]);

  const deferredQuery = useDeferredValue(query);
  const isSearching = query.trim().length > 0;
  const isCategory = pack.startsWith(CAT_PREFIX);
  const categoryName = isCategory ? pack.slice(CAT_PREFIX.length) : null;
  const activePack = packByKey(pack);

  const passSA = useCallback(
    (r: EmojiRecord) =>
      (!filters.source || filters.source === "all" || r.source === filters.source) &&
      (!filters.animatedOnly || r.animated),
    [filters.source, filters.animatedOnly],
  );

  const results = useMemo(() => {
    if (!search) return [];
    const base: SearchFilters = { source: filters.source, animatedOnly: filters.animatedOnly };

    if (isSearching) return search.query(deferredQuery, base); // search ignores pack

    if (isCategory && categoryName) {
      return search.query("", { ...base, categories: [categoryName] });
    }
    if (activePack.special === "trending") {
      const recs = (trendingIds ?? [])
        .map((id) => byId.get(id))
        .filter((r): r is EmojiRecord => Boolean(r))
        .filter(passSA);
      if (recs.length >= 6) return recs;
      return search.query("", base); // not enough live data yet → featured
    }
    if (activePack.theme) {
      return search.query("", { ...base, theme: activePack.theme });
    }
    if (activePack.categories) {
      return search.query("", { ...base, categories: activePack.categories });
    }
    return search.query("", base); // featured (default order)
  }, [search, isSearching, deferredQuery, filters, activePack, isCategory, categoryName, trendingIds, byId, passSA]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 1800);
  }, []);

  const onSearchChange = useCallback((v: string) => setQuery(v), []);

  const sectionLabel = isSearching
    ? `results for “${query.trim()}”`
    : isCategory && categoryName
      ? `📁 ${categoryName.toLowerCase()}`
      : `${activePack.icon} ${activePack.label.toLowerCase()}`;

  return (
    <main style={{ width: "100%", maxWidth: 1200, margin: "0 auto", padding: "0 20px 80px" }}>
      <header className="nav">
        <div className="wordmark">
          <span className="blitz">blitz</span>
          <span>moji</span>
        </div>
        <nav style={{ display: "flex", gap: 8 }}>
          <a className="nav-link" href="https://github.com/omergulen/blitzmoji" target="_blank" rel="noreferrer noopener">
            GitHub
          </a>
          <a className="nav-link" href="https://slackmojis.com" target="_blank" rel="noreferrer noopener">
            Slackmojis ↗
          </a>
        </nav>
      </header>

      <section style={{ paddingTop: "clamp(20px, 6vw, 60px)", paddingBottom: 24, maxWidth: 760 }}>
        <p className="eyebrow" style={{ marginBottom: 14 }}>
          every slack emoji · zero login
        </p>
        <h1 className="hero-title">
          Find any emoji at <span className="hero-grad">the speed of light.</span>
        </h1>
        <p style={{ marginTop: 16, color: "var(--muted)", fontSize: "clamp(1rem, 2.2vw, 1.15rem)", maxWidth: 540 }}>
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
          <div className="sticky-bar">
            <SearchBar value={query} onChange={onSearchChange} count={results.length} />
            <div style={{ marginTop: 12 }}>
              <Filters filters={filters} onChange={setFilters} />
            </div>
          </div>

          {!isSearching && (
            <div style={{ marginTop: 18 }}>
              <Packs active={pack} onSelect={setPack} categories={categories} />
            </div>
          )}

          <section style={{ marginTop: 22 }}>
            <p className="eyebrow" style={{ marginBottom: 14 }}>
              {sectionLabel}
            </p>
            <EmojiGrid records={results} onToast={showToast} onAdd={setAdding} />
          </section>
        </>
      )}

      <footer className="foot">
        <span className="mono">blitzmoji — built for speed ⚡</span>
        <span>
          Custom emoji are community works via{" "}
          <a className="link" href="https://slackmojis.com" target="_blank" rel="noreferrer noopener">
            Slackmojis
          </a>
          . Takedown: open a{" "}
          <a className="link" href="https://github.com/omergulen/blitzmoji/issues" target="_blank" rel="noreferrer noopener">
            GitHub issue
          </a>
          .
        </span>
      </footer>

      <div className="toast" data-show={Boolean(toast)} role="status" aria-live="polite">
        <span className="bolt">⚡</span>
        {toast}
      </div>

      <ExportModal record={adding} onClose={() => setAdding(null)} onToast={showToast} />
    </main>
  );
}
