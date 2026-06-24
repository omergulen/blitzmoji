import { describe, it, expect } from "vitest";
import { slackmojiToRecord, unicodeToRecord, slugify, keywords } from "./transform";
import type { SlackmojiRaw, EmojibaseRaw } from "@/lib/types";

describe("slugify / keywords", () => {
  it("slugifies names to lowercase dash form", () => {
    expect(slugify("Party Parrot")).toBe("party-parrot");
    expect(slugify("blob_wave!!")).toBe("blob-wave");
  });
  it("derives search keywords from a name", () => {
    expect(keywords("party-parrot_dance")).toEqual(["party", "parrot", "dance"]);
  });
});

describe("slackmojiToRecord", () => {
  const raw: SlackmojiRaw = {
    id: 7,
    name: "party-parrot",
    credit: "cultofthepartyparrot",
    image_url: "https://emojis.slackmojis.com/emojis/images/123/7/parrot.gif?123",
    category: { id: 3, name: "Party" },
  };

  it("maps id, source, name and category", () => {
    const r = slackmojiToRecord(raw, "https://cdn.example.com/slackmojis/7.gif");
    expect(r.id).toBe("slackmojis:7");
    expect(r.source).toBe("slackmojis");
    expect(r.name).toBe("party-parrot");
    expect(r.category).toBe("Party");
    expect(r.credit).toBe("cultofthepartyparrot");
  });

  it("uses the provided (mirrored) image url and leaves char null", () => {
    const r = slackmojiToRecord(raw, "https://cdn.example.com/slackmojis/7.gif");
    expect(r.imageUrl).toBe("https://cdn.example.com/slackmojis/7.gif");
    expect(r.char).toBeNull();
  });

  it("flags animated from the original .gif extension", () => {
    const r = slackmojiToRecord(raw, "https://cdn.example.com/slackmojis/7.gif");
    expect(r.animated).toBe(true);
    const png: SlackmojiRaw = { ...raw, image_url: "https://x/y/z.png?1" };
    expect(slackmojiToRecord(png, "u").animated).toBe(false);
  });

  it("builds shortcodes and keyword tags from the name", () => {
    const r = slackmojiToRecord(raw, "u");
    expect(r.shortcodes).toContain("party-parrot");
    expect(r.tags).toEqual(expect.arrayContaining(["party", "parrot"]));
  });
});

describe("unicodeToRecord", () => {
  const raw: EmojibaseRaw = {
    label: "grinning face",
    hexcode: "1F600",
    emoji: "😀",
    tags: ["happy", "smile"],
    group: 0,
  };

  it("maps hexcode to a lowercased id and keeps the glyph", () => {
    const r = unicodeToRecord(raw, ["grinning", "grinning_face"], "smileys-emotion");
    expect(r.id).toBe("unicode:1f600");
    expect(r.source).toBe("unicode");
    expect(r.char).toBe("😀");
    expect(r.imageUrl).toBeNull();
    expect(r.animated).toBe(false);
  });

  it("uses provided shortcodes and category, and includes label words in tags", () => {
    const r = unicodeToRecord(raw, ["grinning", "grinning_face"], "smileys-emotion");
    expect(r.shortcodes).toEqual(["grinning", "grinning_face"]);
    expect(r.category).toBe("smileys-emotion");
    expect(r.tags).toEqual(expect.arrayContaining(["happy", "smile", "grinning", "face"]));
  });
});
