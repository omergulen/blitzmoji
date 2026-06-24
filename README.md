# ⚡ Blitzmoji

**Every Slack emoji, found at the speed of light.** Search thousands of
Slack-style and Unicode emoji instantly, then copy, grab the `:shortcode:`, or
download — no account, no friction.

Built with Next.js (App Router) on Vercel, Cloudflare R2, and Supabase.

## How it works

- **Catalog** — `scripts/ingest` pulls the full Slackmojis feed (paginated) plus
  the Unicode set (`emojibase-data`), normalizes both to one `EmojiRecord`
  shape, and writes a compact static `public/catalog.json` (the shipped search
  index). The committed catalog is curated to ~10k Slackmojis so the whole index
  loads in one ~380KB gzipped request and search stays instant.
- **Search** — runs entirely client-side: a substring-first match (precise),
  falling back to fuzzy (Fuse.js) only for typos. Zero network per keystroke.
- **Grid** — virtualized (`@tanstack/react-virtual`), so thousands of GIFs
  scroll smoothly. Hover a tile to copy the image, copy `:shortcode:`, or
  download.
- **Images** — served through a same-origin cached proxy (`/img`) so clipboard
  copy works cross-origin and third-party hosts aren't hotlinked from the
  browser. The ingestion script can mirror to **Cloudflare R2** when configured.
- **Trending** — `/api/trending` returns the most-copied emoji from **Supabase**
  (anonymous counters via `/api/event`). With no DB configured it degrades to a
  curated "crowd favourites" strip — the app is fully functional either way.

## Develop

```bash
npm install
npm run ingest   # builds public/catalog.json
npm run dev
```

Quality gates: `npm run lint`, `npm test`, `npm run build`.

## Environment (all optional — the app runs without them)

| Var | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Enable live trending + interaction counters. Apply `supabase/schema.sql` first. |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_BASE_URL` | Mirror emoji images to Cloudflare R2 during ingestion. |
| `SLACKMOJIS_PAGES` | Slackmojis pages to ingest (500/page). Default `20`. |

The weekly **Ingest** GitHub Action refreshes `catalog.json` (and mirrors to R2 /
upserts Supabase when the secrets above are set).

## Roadmap — customization

Phase 2 adds "put your face on nyancat": an overlay editor first, optional
AI face-swap later. The seam is already in place — see
[`lib/editor/README.md`](lib/editor/README.md) and `app/customize/[id]`.

## Attribution & takedown

Custom emoji are community-submitted works via
[Slackmojis](https://slackmojis.com); each retains its original credit. Unicode
emoji are rendered as native glyphs. To request removal of any emoji, open a
GitHub issue.
