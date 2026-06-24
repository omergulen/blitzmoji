import { describe, it, expect } from "vitest";
import { createSearch } from "./search";
import type { EmojiRecord } from "./types";

const rec = (over: Partial<EmojiRecord> & Pick<EmojiRecord, "id" | "name">): EmojiRecord => ({
  source: "slackmojis",
  shortcodes: [over.name],
  tags: [],
  category: null,
  credit: null,
  imageUrl: "u",
  char: null,
  animated: false,
  ...over,
});

const catalog: EmojiRecord[] = [
  rec({ id: "slackmojis:1", name: "party-parrot", tags: ["party", "parrot"], animated: true }),
  rec({ id: "slackmojis:2", name: "sad-parrot", tags: ["sad", "parrot"], animated: true }),
  rec({ id: "slackmojis:3", name: "blob-wave", tags: ["blob", "wave"], category: "Blobs" }),
  rec({
    id: "unicode:1f600",
    name: "grinning face",
    source: "unicode",
    shortcodes: ["grinning"],
    tags: ["happy", "smile"],
    imageUrl: null,
    char: "😀",
  }),
];

describe("createSearch", () => {
  it("returns all records (original order) for an empty query", () => {
    const { query } = createSearch(catalog);
    expect(query("")).toHaveLength(4);
    expect(query("").map((r) => r.id)).toEqual(catalog.map((r) => r.id));
  });

  it("ranks name/tag matches first for a text query", () => {
    const { query } = createSearch(catalog);
    const ids = query("parrot").map((r) => r.id);
    expect(ids).toContain("slackmojis:1");
    expect(ids).toContain("slackmojis:2");
    expect(ids).not.toContain("slackmojis:3");
  });

  it("matches by shortcode and tag", () => {
    const { query } = createSearch(catalog);
    expect(query("grinning").map((r) => r.id)).toContain("unicode:1f600");
    expect(query("smile").map((r) => r.id)).toContain("unicode:1f600");
  });

  it("filters by source", () => {
    const { query } = createSearch(catalog);
    const res = query("", { source: "unicode" });
    expect(res).toHaveLength(1);
    expect(res[0].id).toBe("unicode:1f600");
  });

  it("filters by animatedOnly", () => {
    const { query } = createSearch(catalog);
    const res = query("", { animatedOnly: true });
    expect(res.map((r) => r.id).sort()).toEqual(["slackmojis:1", "slackmojis:2"]);
  });

  it("filters by category", () => {
    const { query } = createSearch(catalog);
    const res = query("", { category: "Blobs" });
    expect(res.map((r) => r.id)).toEqual(["slackmojis:3"]);
  });

  it("does not leak near-spellings on a literal match (parrot != carrot)", () => {
    const withCarrot = [...catalog, rec({ id: "u:carrot", name: "carrot", tags: ["carrot", "veg"] })];
    const { query } = createSearch(withCarrot);
    const res = query("parrot");
    expect(res.map((r) => r.id)).not.toContain("u:carrot");
    expect(res[0].name).toMatch(/parrot/);
  });

  it("matches multi-word queries against dashless names (party parrot -> party-parrot)", () => {
    const { query } = createSearch(catalog);
    expect(query("party parrot").map((r) => r.id)).toContain("slackmojis:1");
    expect(query("PARTY-PARROT").map((r) => r.id)).toContain("slackmojis:1");
  });

  it("falls back to fuzzy matching only when nothing matches literally", () => {
    const { query } = createSearch(catalog);
    // "parot" is a typo: no literal hit, fuzzy should still surface the parrots.
    const ids = query("parot").map((r) => r.id);
    expect(ids).toContain("slackmojis:1");
  });

  it("combines text query with filters", () => {
    const { query } = createSearch(catalog);
    const res = query("parrot", { animatedOnly: true });
    expect(res.map((r) => r.id).sort()).toEqual(["slackmojis:1", "slackmojis:2"]);
  });
});
