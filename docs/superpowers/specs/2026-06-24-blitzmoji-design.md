# Blitzmoji — Design Spec (V1)

**Date:** 2026-06-24
**Status:** Approved (Approach A)
**One-liner:** A fast, beautiful, account-free web app to search every public Slack-style emoji (Slackmojis + Unicode) and copy/download them instantly — with face-on-emoji customization designed-for but deferred to Phase 2.

---

## 1. Goals & Non-Goals

### Goals (V1)
- **Instant search** across the full catalog with zero per-keystroke network latency.
- **Beautiful, distinctive UI** (this is a portfolio/showcase piece — polish is a requirement, not a nice-to-have).
- **One-click actions:** copy image to clipboard, download, copy `:shortcode:`.
- **Account-free:** no login, no user data. Works fully anonymously.
- **Trending** strip powered by anonymous, aggregate popularity counters.
- Self-hosted images (never hotlink third-party servers).

### Non-Goals (V1, explicitly deferred)
- User accounts / auth.
- User-uploaded custom emojis.
- AI face-swap / generation (Phase 2 — overlay editor and/or image model).
- Payments / monetization.

---

## 2. Catalog Sources

| Source | Count | Notes |
|---|---|---|
| **Slackmojis** (`slackmojis.com/emojis.json`) | ~500 | Community custom emojis (party parrot, blobs, memes). Fields: `id, name, credit, created_at, image_url, category{id,name}`. Mostly GIF/PNG/JPG. This is the *focus* of the product. |
| **Unicode** (`emojibase-data` npm) | ~1,900 | Standard emoji with rich search annotations/tags. Rendered as Twemoji-style PNG/SVG or native glyph. |

> **Legal note:** Slackmojis are community-submitted derivative/copyrighted works. For a showcase this is normal practice; we add clear attribution ("Emojis via Slackmojis", per-emoji `credit`) and a takedown contact. We mirror images to our own CDN rather than hotlinking.

---

## 3. Architecture (Approach A)

```
                 ┌─────────────────────────────────────────┐
   GitHub Actions │  Ingestion job (manual + scheduled cron) │
   ───────────────┤  1. fetch Slackmojis JSON + emojibase    │
                  │  2. upload images → Cloudflare R2        │
                  │  3. upsert metadata → Supabase Postgres  │
                  │  4. regenerate static catalog.json       │
                  └──────────────┬───────────────────────────┘
                                 │ (commits catalog.json / build artifact)
                                 ▼
   ┌──────────────┐   static    ┌──────────────────────┐    images    ┌──────────────┐
   │  Browser     │ ◀─ catalog ─│  Next.js on Vercel    │             │ Cloudflare R2 │
   │ (Fuse.js     │   .json     │  - app (App Router)   │             │  + CDN        │
   │  client      │ ───────────▶│  - /api/event (edge)  │             │ (zero egress) │
   │  search)     │  copy/dl    │                       │             └──────────────┘
   └──────┬───────┘  pings      └──────────┬────────────┘                    ▲
          │                                 │ increment counters             │ <img src>
          └─────────────────────────────────▼────────────────────────────────┘
                                   ┌──────────────────────┐
                                   │  Supabase Postgres    │
                                   │  emojis, emoji_stats  │
                                   └──────────────────────┘
```

### Components
- **Next.js (App Router) on Vercel** — the app + a thin `/api/event` route (edge) that increments anonymous popularity counters. SSR/SSG for the shell; the catalog is a static asset.
- **Cloudflare R2 + public CDN** — every emoji image mirrored here (PNG/GIF/JPG/SVG). Zero egress fees, global edge. Served via `<img>` from a public R2 dev URL or custom domain.
- **Supabase Postgres** — source of truth:
  - `emojis` (canonical metadata)
  - `emoji_stats` (aggregate counters: copies, downloads)
  - `get_trending()` RPC for the Trending strip.
- **GitHub** — repo + Actions: ingestion (manual `workflow_dispatch` + weekly cron) and CI.

### Why this shape
For a ~2,400-item catalog, a prebuilt index + client-side fuzzy search gives the best possible "fast search" feel (no network per keystroke) and the cheapest serving. Supabase is used where it actually adds value (canonical store + dynamic trending), not forced into the search hot path.

---

## 4. Data Model (Supabase)

```sql
create table emojis (
  id           text primary key,        -- e.g. "slackmojis:1" or "unicode:1f600"
  source       text not null,           -- 'slackmojis' | 'unicode'
  name         text not null,           -- display name / shortcode base
  shortcodes   text[] not null default '{}',
  tags         text[] not null default '{}',  -- search keywords
  category     text,
  credit       text,                    -- slackmojis submitter
  image_url    text not null,           -- our R2 URL
  animated     boolean not null default false,
  width        int,
  height       int,
  created_at   timestamptz default now()
);

create table emoji_stats (
  emoji_id   text primary key references emojis(id) on delete cascade,
  copies     bigint not null default 0,
  downloads  bigint not null default 0,
  updated_at timestamptz default now()
);

-- atomic increment, called from /api/event
create function increment_stat(p_emoji_id text, p_kind text) returns void ...
-- top-N by (copies + downloads) over recent window
create function get_trending(p_limit int) returns setof ...
```

The static `catalog.json` is a projection of `emojis`: `{id, name, shortcodes, tags, category, credit, url, animated, w, h}`.

---

## 5. Search & Rendering

- **Index:** `catalog.json` (one array) loaded once on first paint; gzipped it is small (tens to low-hundreds of KB).
- **Search:** Fuse.js over `name + shortcodes + tags` with sensible weights; debounced input, but matching is synchronous and instant.
- **Grid:** virtualized (e.g. `@tanstack/react-virtual`) so thousands of GIFs render smoothly. GIFs lazy-load; animate on hover where feasible.
- **Filters:** category chips, source toggle (Slack / Unicode), "animated only".

---

## 6. Core UX

- **Keyboard-first:** `/` focuses search; arrow keys navigate the grid; `Enter` = copy; `Esc` clears.
- **Per-emoji actions (hover / focus):** copy image, download, copy `:shortcode:`. Each success fires a non-blocking `/api/event` ping.
- **Trending strip** at top, hydrated from `get_trending()`.
- **Detail / quick-view** on click: larger preview, all shortcodes, credit, copy/download.
- **Design language:** decided at build time via the frontend-design skill — distinctive, not templated; dark-first, playful, fast feel.

---

## 7. Phase-2 Seams (build later, design now)

- Route stub `app/customize/[id]/page.tsx` and an isolated `lib/editor/` module boundary.
- Customization pipeline (overlay editor first, optional AI face-swap later) plugs in without touching catalog/search.
- `emojis.image_url` already abstracts storage, so generated images can land in the same R2 bucket.

---

## 8. Module Boundaries

| Module | Responsibility | Depends on |
|---|---|---|
| `scripts/ingest/` | Fetch sources, upload to R2, upsert Supabase, emit catalog.json | R2, Supabase, network |
| `lib/catalog.ts` | Load + type the static catalog | catalog.json |
| `lib/search.ts` | Build Fuse index, query | catalog |
| `lib/r2.ts` | R2 client (ingest only) | aws-sdk/s3 |
| `lib/supabase.ts` | Server client + RPCs | supabase-js |
| `components/grid/` | Virtualized emoji grid + card | catalog, search |
| `components/search/` | Search bar + filters | search |
| `app/api/event/route.ts` | Anonymous stat ping (edge) | supabase RPC |
| `lib/editor/` (Phase 2) | Customization | catalog |

---

## 9. Testing

- **Unit:** `lib/search.ts` (query relevance/ordering), catalog parsing, ingest transforms (source record → canonical record).
- **Component:** search bar filtering, card actions (copy/download mocked).
- **Integration (smoke):** ingest dry-run against a fixture JSON; `/api/event` increments via a mocked Supabase.
- TDD where it pays off (search ranking, ingest transforms); lighter for purely visual components.

---

## 10. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Slackmojis JSON is ~500 items / undocumented | Treat as best-effort; cron re-sync; catalog still substantial with Unicode. Log counts. |
| Thousands of animated GIFs jank the grid | Virtualization + lazy load + animate-on-hover. |
| Copyright complaints | Attribution + credit + takedown contact; self-host so we can pull items. |
| R2 public URL / CORS for clipboard copy | Configure R2 public access + CORS; copy via fetch→blob→clipboard. |
| Cost of provisioned services | Free tiers: Vercel Hobby, Supabase Free, R2 free egress. |

---

## 11. Deliverables (V1)

1. Next.js app deployed on Vercel (account-free emoji search).
2. R2 bucket with mirrored images + public access.
3. Supabase project with schema + trending RPC.
4. GitHub repo with ingestion + CI Actions.
5. This spec + an implementation plan.
