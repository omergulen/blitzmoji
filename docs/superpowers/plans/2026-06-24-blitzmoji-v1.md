# Blitzmoji V1 Implementation Plan

> **For agentic workers:** Steps use checkbox (`- [ ]`) syntax. Execute task-by-task; commit after each.

**Goal:** Ship a fast, account-free emoji search app (Slackmojis + Unicode) with copy/download, trending, and Phase-2 customization seams.

**Architecture:** Next.js (App Router) on Vercel serves a static `catalog.json`; the browser does instant Fuse.js search over a virtualized grid. Images are mirrored to Cloudflare R2 (zero egress). Supabase Postgres is the canonical store + anonymous trending counters, populated by a GitHub Actions ingestion job.

**Tech Stack:** Next.js 15 (App Router, TS), Tailwind CSS, Fuse.js, @tanstack/react-virtual, @supabase/supabase-js, @aws-sdk/client-s3 (R2), emojibase-data, Vitest.

## Global Constraints
- TypeScript everywhere; App Router; no user accounts/auth in V1.
- No hotlinking: all emoji images served from our R2 bucket.
- Search is client-side over a static catalog; no network per keystroke.
- Attribution to Slackmojis + per-emoji `credit` visible; takedown contact in footer.
- Free tiers only (Vercel Hobby, Supabase Free, R2).

---

### Task 1: Scaffold Next.js app
**Files:** Create `package.json`, `app/`, `tailwind.config`, `lib/`, `vitest.config.ts`.
- [ ] `create-next-app` (TS, Tailwind, App Router, src dir = no, import alias `@/*`).
- [ ] Add deps: fuse.js, @tanstack/react-virtual, @supabase/supabase-js, @aws-sdk/client-s3, emojibase-data; dev: vitest, @testing-library/react, jsdom.
- [ ] Configure vitest (jsdom env, alias).
- [ ] Verify `npm run build` and a placeholder home render.
- [ ] Commit.

### Task 2: Catalog types + ingestion transforms (TDD)
**Files:** Create `lib/types.ts`, `scripts/ingest/transform.ts`, `scripts/ingest/transform.test.ts`.
**Produces:** `EmojiRecord` type; `slackmojiToRecord(raw)`, `unicodeToRecord(raw)` → `EmojiRecord`.
- [ ] Define `EmojiRecord { id, source, name, shortcodes, tags, category, credit, imageUrl, animated, width?, height? }`.
- [ ] Test: `slackmojiToRecord` maps id→`slackmojis:1`, derives `animated` from `.gif`, builds shortcodes from name.
- [ ] Test: `unicodeToRecord` maps hexcode→`unicode:1f600`, pulls tags from emojibase annotation.
- [ ] Implement transforms; run tests green; commit.

### Task 3: R2 + Supabase clients + provisioning
**Files:** Create `lib/r2.ts`, `lib/supabase.ts`, `supabase/schema.sql`.
- [ ] `lib/r2.ts`: S3 client to R2 endpoint; `uploadImage(key, buf, contentType)` → public URL.
- [ ] `lib/supabase.ts`: server client from env; `upsertEmojis(records)`, `getTrending(limit)`.
- [ ] `supabase/schema.sql`: `emojis`, `emoji_stats`, `increment_stat()`, `get_trending()` per spec §4.
- [ ] Provision (MCP): create Supabase project, apply schema; create R2 bucket + public access.
- [ ] Commit.

### Task 4: Ingestion runner
**Files:** Create `scripts/ingest/run.ts`.
- [ ] Fetch Slackmojis JSON; load emojibase `en/data`.
- [ ] For each: download image → upload to R2 (skip if exists) → transform → collect record.
- [ ] Upsert records to Supabase; write `public/catalog.json` projection.
- [ ] Run end-to-end; verify catalog.json populated + images load from R2.
- [ ] Commit (catalog.json is gitignored; build regenerates or ships artifact).

### Task 5: Search lib (TDD)
**Files:** Create `lib/catalog.ts`, `lib/search.ts`, `lib/search.test.ts`.
**Produces:** `loadCatalog()`, `createSearch(records)` → `{ query(q, filters) }`.
- [ ] Test: querying "parrot" ranks parrot emojis first; empty query returns all (or trending order).
- [ ] Test: filter by source/animated/category narrows results.
- [ ] Implement Fuse index (weights name>shortcodes>tags); run green; commit.

### Task 6: UI — search bar, filters, virtualized grid, card
**Files:** Create `components/SearchBar.tsx`, `components/Filters.tsx`, `components/EmojiGrid.tsx`, `components/EmojiCard.tsx`, `lib/clipboard.ts`, `app/page.tsx`.
- [ ] `lib/clipboard.ts`: `copyImage(url)` (fetch→blob→clipboard), `downloadImage(url,name)`, `copyText`.
- [ ] `EmojiCard`: image + hover actions (copy/download/copy `:shortcode:`), fires `/api/event` on success.
- [ ] `EmojiGrid`: @tanstack/react-virtual responsive grid.
- [ ] `SearchBar` (`/` focus, debounce) + `Filters` chips wired to `createSearch`.
- [ ] `app/page.tsx`: load catalog, compose; distinctive design via frontend-design skill.
- [ ] Component tests for filtering + card actions (mocked); commit.

### Task 7: Trending + /api/event
**Files:** Create `app/api/event/route.ts`, `components/Trending.tsx`; modify `app/page.tsx`.
- [ ] `/api/event` (edge): POST `{id, kind}` → `increment_stat` RPC; rate-limit basic.
- [ ] `Trending`: server component calling `getTrending`, rendered above grid.
- [ ] Verify a copy increments and trending reflects it; commit.

### Task 8: Phase-2 seams
**Files:** Create `app/customize/[id]/page.tsx` (stub), `lib/editor/README.md`.
- [ ] Stub route: shows emoji + "Customization coming soon", module boundary documented.
- [ ] Commit.

### Task 9: Deploy
**Files:** Create `.github/workflows/ingest.yml`, `.github/workflows/ci.yml`, `README.md`.
- [ ] CI: install, lint, test, build.
- [ ] Ingest workflow: `workflow_dispatch` + weekly cron, runs `scripts/ingest/run.ts` with secrets.
- [ ] Create GitHub repo, push.
- [ ] Deploy to Vercel; set env (Supabase URL/key, R2 creds, R2 public base).
- [ ] Verify live URL: search works, images load, copy works, trending shows.
- [ ] README with attribution + takedown contact; commit.

## Self-Review
- Spec coverage: catalog (T2,T4), R2 (T3,T4), Supabase (T3,T7), search (T5), UX (T6), trending (T7), seams (T8), deploy/CI/ingest (T9). ✓
- No placeholders beyond intentional Phase-2 stub. ✓
- Type consistency: `EmojiRecord` defined T2, consumed T4–T7; `getTrending`/`increment_stat` consistent T3/T7. ✓
