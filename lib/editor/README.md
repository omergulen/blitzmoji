# lib/editor — Phase 2 (customization)

This module is the seam for "put my face on nyancat." It is **not** built yet;
this file documents the boundary so it can drop in without touching catalog or
search.

## Contract

```ts
// lib/editor/index.ts (future)
export interface EditSession {
  base: EmojiRecord;          // the emoji being customized
  layers: Layer[];            // user image(s), positioned/scaled
}
export function exportEmoji(session: EditSession): Promise<Blob>; // PNG/GIF
```

## Plan

1. **Overlay editor (no AI):** canvas; drop a photo, crop/position/scale over the
   base emoji, export PNG (and per-frame for GIFs). Lowest cost, ships first.
2. **AI face-swap (optional):** blend the user's face into the emoji via an image
   model. Higher quality, higher cost — gated behind the overlay MVP.

## Integration points (already in place)

- Route: `app/customize/[id]/page.tsx` (currently a preview stub).
- Storage: generated images reuse the R2 mirror via `lib/r2.ts`
  (`uploadImage`); `EmojiRecord.imageUrl` already abstracts the source.
- Entry: add a "Customize" action to `components/EmojiCard.tsx` linking to
  `/customize/${encodeURIComponent(record.id)}`.
