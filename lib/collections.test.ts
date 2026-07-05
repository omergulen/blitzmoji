import { describe, expect, it } from "vitest";
import { COLLECTIONS, collectionCounts, inCollection, recordCollections } from "./collections";
import type { EmojiRecord } from "./types";

function rec(partial: Partial<EmojiRecord>): EmojiRecord {
  return {
    id: "t:1",
    source: "slackmojis",
    name: "x",
    shortcodes: [],
    tags: [],
    category: "Random",
    credit: null,
    imageUrl: "https://e/x.png",
    char: null,
    animated: false,
    ...partial,
  };
}

describe("recordCollections", () => {
  it("matches whole words, not substrings", () => {
    // "cat" the animal, but not "category" / "communicate"
    expect(recordCollections(rec({ name: "grumpy cat", shortcodes: ["grumpy-cat"] }))).toContain("animals");
    expect(recordCollections(rec({ name: "category", shortcodes: ["category"] }))).not.toContain("animals");
    expect(recordCollections(rec({ name: "communicate", shortcodes: ["communicate"] }))).not.toContain("animals");
  });

  it("matches distinctive compounds via phrases", () => {
    expect(recordCollections(rec({ name: "this is fine", shortcodes: ["thisisfine"] }))).toContain("memes");
    expect(recordCollections(rec({ shortcodes: ["rickroll"] }))).toContain("memes");
  });

  it("allows an emoji in multiple themes", () => {
    const dancingCat = rec({ name: "dancing cat", shortcodes: ["catjam"], tags: ["dance", "cat"] });
    const themes = recordCollections(dancingCat);
    expect(themes).toContain("animals");
    expect(themes).toContain("celebrate");
  });

  it("returns empty for unthemed long-tail emoji", () => {
    expect(recordCollections(rec({ name: "quux widget", shortcodes: ["quux"] }))).toEqual([]);
  });

  it("caches without changing the answer", () => {
    const r = rec({ shortcodes: ["coffee"] });
    expect(recordCollections(r)).toEqual(recordCollections(r));
    expect(inCollection(r, "food")).toBe(true);
  });
});

describe("collectionCounts", () => {
  it("counts per theme in COLLECTIONS order", () => {
    const records = [
      rec({ shortcodes: ["coffee"] }),
      rec({ shortcodes: ["pizza"] }),
      rec({ shortcodes: ["facepalm"] }),
    ];
    const counts = collectionCounts(records);
    expect(counts.map((c) => c.key)).toEqual(COLLECTIONS.map((c) => c.key));
    expect(counts.find((c) => c.key === "food")?.count).toBe(2);
    expect(counts.find((c) => c.key === "reactions")?.count).toBe(1);
    expect(counts.find((c) => c.key === "pride")?.count).toBe(0);
  });
});
