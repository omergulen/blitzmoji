/**
 * Blitzmoji ingestion.
 *
 * 1. Fetch Slackmojis (community custom emojis) + load emojibase (Unicode).
 * 2. (Optional) mirror Slackmojis images to Cloudflare R2 when R2_* env is set.
 * 3. (Optional) upsert canonical records to Supabase when SUPABASE_* env is set.
 * 4. Always write public/catalog.json — the static index the app searches.
 *
 * Network/DB/R2 failures degrade gracefully: a missing Slackmojis feed still
 * yields a Unicode-only catalog, so the build never hard-fails.
 *
 * Run: npm run ingest
 */
import { createRequire } from "node:module";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import type { EmojiRecord, SlackmojiRaw, EmojibaseRaw } from "@/lib/types";
import { slackmojiToRecord, unicodeToRecord } from "./transform";
import { r2ConfigFromEnv, makeR2Client, uploadImage } from "@/lib/r2";
import { getSupabase } from "@/lib/supabase";

const require = createRequire(import.meta.url);
const SLACKMOJIS_URL = "https://slackmojis.com/emojis.json";
// Slackmojis has 100k+ community uploads (mostly long-tail). For a fast,
// client-side-searchable showcase we ship a curated slice; the full set is
// available by raising this (and moving search server-side). Override with
// SLACKMOJIS_PAGES env in the ingest workflow.
const MAX_PAGES = Number(process.env.SLACKMOJIS_PAGES) || 20; // 500/page → ~10k
const OUT = path.join(process.cwd(), "public", "catalog.json");

function prettyGroup(slug: string | undefined): string | null {
  if (!slug) return null;
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Fetch every Slackmojis page, deduped by id. Stops when a page adds nothing new. */
async function fetchSlackmojis(): Promise<SlackmojiRaw[]> {
  const byId = new Map<number, SlackmojiRaw>();
  try {
    for (let page = 1; page <= MAX_PAGES; page++) {
      const res = await fetch(`${SLACKMOJIS_URL}?page=${page}`, {
        headers: { "User-Agent": "Blitzmoji/1.0 (+https://github.com)" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status} on page ${page}`);
      const batch = (await res.json()) as SlackmojiRaw[];
      if (batch.length === 0) break;
      const before = byId.size;
      for (const e of batch) byId.set(e.id, e);
      if (byId.size === before) break; // no new ids -> reached the end
      if (page % 10 === 0) console.log(`  …fetched ${byId.size} slackmojis`);
    }
    return Array.from(byId.values());
  } catch (err) {
    console.warn(`! Slackmojis fetch failed (${(err as Error).message}).`);
    return Array.from(byId.values()); // keep whatever we got
  }
}

function loadUnicode(): EmojiRecord[] {
  const data = require("emojibase-data/en/data.json") as EmojibaseRaw[];
  const shortcodes = require("emojibase-data/en/shortcodes/emojibase.json") as Record<
    string,
    string | string[]
  >;
  const groups = require("emojibase-data/meta/groups.json") as {
    groups: Record<string, string>;
  };
  return data.map((raw) => {
    const sc = shortcodes[raw.hexcode];
    const list = sc ? (Array.isArray(sc) ? sc : [sc]) : [];
    const category = prettyGroup(groups.groups?.[String(raw.group ?? "")]);
    return unicodeToRecord(raw, list, category);
  });
}

async function buildSlackmojis(): Promise<EmojiRecord[]> {
  const raws = await fetchSlackmojis();
  if (raws.length === 0) return [];

  const r2 = r2ConfigFromEnv();
  if (!r2) {
    console.log(`• R2 not configured — using upstream image URLs (served via proxy).`);
    return raws.map((r) => slackmojiToRecord(r, r.image_url));
  }

  console.log(`• R2 configured — mirroring ${raws.length} images to ${r2.bucket}...`);
  const client = makeR2Client(r2);
  const out: EmojiRecord[] = [];
  for (const raw of raws) {
    const ext = (raw.image_url.split("?")[0].split(".").pop() || "png").toLowerCase();
    const key = `slackmojis/${raw.id}.${ext}`;
    try {
      const res = await fetch(raw.image_url);
      const buf = new Uint8Array(await res.arrayBuffer());
      const ct = res.headers.get("content-type") || `image/${ext}`;
      const url = await uploadImage(client, r2, key, buf, ct);
      out.push(slackmojiToRecord(raw, url));
    } catch (err) {
      console.warn(`  ! ${raw.name}: ${(err as Error).message} — using upstream URL`);
      out.push(slackmojiToRecord(raw, raw.image_url));
    }
  }
  return out;
}

async function upsertSupabase(records: EmojiRecord[]): Promise<void> {
  const db = getSupabase();
  if (!db) {
    console.log("• Supabase not configured — skipping upsert.");
    return;
  }
  const rows = records.map((r) => ({
    id: r.id,
    source: r.source,
    name: r.name,
    shortcodes: r.shortcodes,
    tags: r.tags,
    category: r.category,
    credit: r.credit,
    image_url: r.imageUrl,
    char: r.char,
    animated: r.animated,
    width: r.width ?? null,
    height: r.height ?? null,
  }));
  for (let i = 0; i < rows.length; i += 500) {
    const chunk = rows.slice(i, i + 500);
    const { error } = await db.from("emojis").upsert(chunk, { onConflict: "id" });
    if (error) {
      console.warn(`  ! Supabase upsert failed: ${error.message}`);
      return;
    }
  }
  console.log(`• Upserted ${rows.length} records to Supabase.`);
}

async function main() {
  console.log("Blitzmoji ingest starting...");
  const [slack, unicode] = await Promise.all([
    buildSlackmojis(),
    Promise.resolve(loadUnicode()),
  ]);
  const records = [...slack, ...unicode];
  console.log(`• ${slack.length} slackmojis + ${unicode.length} unicode = ${records.length} total.`);

  await upsertSupabase(records);

  await mkdir(path.dirname(OUT), { recursive: true });
  await writeFile(OUT, JSON.stringify(records));
  console.log(`✓ Wrote ${records.length} records to ${path.relative(process.cwd(), OUT)}`);
}

main().catch((err) => {
  console.error("Ingest failed:", err);
  process.exit(1);
});
