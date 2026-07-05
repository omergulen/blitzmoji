import { describe, expect, it } from "vitest";
import {
  PLATFORMS,
  fillStep,
  platformByKey,
  slackEmojiUrl,
  slackSubdomain,
} from "./platforms";
import { preparedName } from "./convert";

describe("slackSubdomain", () => {
  it("accepts a bare subdomain", () => {
    expect(slackSubdomain("acme")).toBe("acme");
  });
  it("strips slack.com and scheme", () => {
    expect(slackSubdomain("acme.slack.com")).toBe("acme");
    expect(slackSubdomain("https://acme.slack.com/customize/emoji")).toBe("acme");
    expect(slackSubdomain("  ACME  ")).toBe("acme");
  });
  it("rejects empty and reserved hosts", () => {
    expect(slackSubdomain("")).toBeNull();
    expect(slackSubdomain("   ")).toBeNull();
    expect(slackSubdomain("slack.com")).toBeNull();
    expect(slackSubdomain("www")).toBeNull();
  });
});

describe("slackEmojiUrl", () => {
  it("builds the customize/emoji deep link", () => {
    expect(slackEmojiUrl("acme")).toBe("https://acme.slack.com/customize/emoji");
  });
  it("is null when no usable workspace", () => {
    expect(slackEmojiUrl("")).toBeNull();
  });
});

describe("fillStep", () => {
  it("substitutes every {code}", () => {
    expect(fillStep("name it {code} — {code}", ":tada:")).toBe("name it :tada: — :tada:");
  });
});

describe("platformByKey", () => {
  it("returns the matching platform", () => {
    expect(platformByKey("telegram").name).toBe("Telegram");
  });
  it("falls back to the first platform for unknown keys", () => {
    expect(platformByKey("nope").key).toBe("slack");
  });
  it("declares a square size for sticker platforms only", () => {
    const sticker = PLATFORMS.filter((p) => p.prep.size);
    expect(sticker.map((p) => p.key).sort()).toEqual(["telegram", "whatsapp"]);
    expect(platformByKey("slack").prep.keepOriginal).toBe(true);
  });
});

describe("preparedName", () => {
  it("keeps a clean base and maps mime → ext", () => {
    expect(preparedName("party_parrot", "image/webp")).toBe("party_parrot.webp");
    expect(preparedName("tada", "image/png")).toBe("tada.png");
  });
  it("sanitizes unsafe characters", () => {
    expect(preparedName("hello world!", "image/gif")).toBe("hello-world.gif");
    expect(preparedName("", "image/png")).toBe("emoji.png");
  });
});
