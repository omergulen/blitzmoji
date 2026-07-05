/**
 * Themed collections derived by keyword, not by Slackmojis category. ~67% of the
 * catalog lands in Slackmojis' catch-all "Random" category, which is useless for
 * browsing — so we re-group the *whole* catalog into chat-relevant themes
 * (reactions, love, hype, animals, food, tech, memes…) from each emoji's
 * name / shortcodes / tags.
 *
 * An emoji can belong to several themes (a dancing cat is both "animals" and
 * "celebrate"); membership is a set, computed once per record and cached.
 */
import type { EmojiRecord } from "./types";

export interface Collection {
  key: string;
  label: string;
  icon: string;
  /** Whole-word matches — precise for short/generic terms ("cat", not "category"). */
  words: string[];
  /** Normalized-substring matches — for distinctive compounds ("thisisfine"). */
  phrases?: string[];
}

export const COLLECTIONS: Collection[] = [
  {
    key: "reactions",
    label: "Reactions",
    icon: "😮",
    words: [
      "lol", "lmao", "oof", "wtf", "wow", "nice", "yes", "no", "this", "shrug",
      "nod", "cry", "crying", "sob", "angry", "mad", "rage", "sad", "happy",
      "confused", "huh", "what", "eyes", "eye", "stare", "blink", "sigh",
      "sweat", "disappointed", "thinking", "think", "facepalm", "clap", "ok",
      "okay", "yeah", "smh", "cringe", "shocked", "scream",
    ],
    phrases: ["thisisfine", "mindblown", "sideeye", "facepalm", "noway", "mrw", "mfw"],
  },
  {
    key: "love",
    label: "Love",
    icon: "❤️",
    words: ["heart", "hearts", "love", "kiss", "hug", "hugs", "blush", "cute", "adore", "xoxo", "valentine", "smooch"],
    phrases: ["loveyou", "iloveyou", "hearteyes"],
  },
  {
    key: "celebrate",
    label: "Celebrate",
    icon: "🎉",
    words: [
      "party", "tada", "confetti", "celebrate", "celebration", "cheers", "birthday",
      "congrats", "congratulations", "fireworks", "balloon", "dance", "dancing",
      "disco", "boogie", "groove", "vibe", "yay",
    ],
    phrases: ["partyparrot", "partytime", "letsgo"],
  },
  {
    key: "hype",
    label: "Hype",
    icon: "🔥",
    words: ["fire", "lit", "hot", "hype", "boom", "rocket", "smash", "metal", "intensifies", "pump", "epic", "gg", "power", "energy", "flame"],
    phrases: ["letsgooo", "onfire", "100", "hundred", "poggers", "pogchamp"],
  },
  {
    key: "animals",
    label: "Animals",
    icon: "🐾",
    words: [
      "cat", "cats", "kitty", "kitten", "dog", "doggo", "puppy", "goose", "bird",
      "penguin", "bear", "turtle", "frog", "fox", "duck", "bunny", "rabbit",
      "unicorn", "dino", "dinosaur", "snake", "owl", "panda", "koala", "sloth",
      "hamster", "shark", "whale", "doge", "snek", "hedgehog", "otter", "capybara",
      "parrot", "blobcat", "monkey", "pig", "cow", "horse", "chicken",
    ],
    phrases: ["nyancat", "catjam", "partyparrot", "blobcat"],
  },
  {
    key: "food",
    label: "Food & Drink",
    icon: "☕",
    words: [
      "coffee", "pizza", "beer", "wine", "taco", "burger", "cake", "donut", "sushi",
      "ramen", "food", "drink", "snack", "cookie", "boba", "tea", "bread", "bacon",
      "hotdog", "fries", "popcorn", "avocado", "banana", "burrito", "cheese", "egg",
    ],
    phrases: ["hotdog", "boba", "coffeetime"],
  },
  {
    key: "tech",
    label: "Tech & Work",
    icon: "⚙️",
    words: [
      "aws", "jenkins", "github", "gitlab", "slack", "deploy", "deployed", "build",
      "building", "ci", "cd", "merge", "merged", "pr", "code", "coding", "bug",
      "ship", "shipit", "loading", "spinner", "reboot", "docker", "kubernetes",
      "k8s", "terminal", "server", "database", "cloud", "linkedin", "jira", "api",
      "npm", "git", "commit", "wip", "lgtm", "approved", "logo",
    ],
    phrases: ["shipit", "lgtm", "wfh", "pairprogramming"],
  },
  {
    key: "memes",
    label: "Memes",
    icon: "🐸",
    words: ["pepe", "doge", "trump", "homer", "drake", "wojak", "chad", "stonks", "shrek", "sus", "harold", "wojack"],
    phrases: ["rickroll", "thisisfine", "sussy", "kekw", "monkas", "feelsgoodman", "feelsbadman", "gigachad", "poggers", "stonks"],
  },
  {
    key: "hands",
    label: "Hands",
    icon: "👏",
    words: ["hand", "clap", "wave", "point", "fist", "raised", "highfive", "pray", "handshake", "finger", "peace", "thumbsup", "thumbsdown"],
    phrases: ["highfive", "okhand", "raisedhands", "thumbsup", "thumbsdown"],
  },
  {
    key: "pride",
    label: "Pride",
    icon: "🏳️‍🌈",
    words: ["pride", "rainbow", "lgbt", "lgbtq", "trans", "gay", "queer"],
    phrases: ["loveislove", "lgbtq"],
  },
];

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function tokenize(r: EmojiRecord): Set<string> {
  const set = new Set<string>();
  for (const part of [r.name, ...r.shortcodes, ...r.tags]) {
    for (const w of part.toLowerCase().split(/[^a-z0-9]+/)) {
      if (w) set.add(w);
    }
  }
  return set;
}

const cache = new WeakMap<EmojiRecord, string[]>();

/** Theme keys this record belongs to (cached per record). */
export function recordCollections(r: EmojiRecord): string[] {
  const hit = cache.get(r);
  if (hit) return hit;
  const tokens = tokenize(r);
  const full = norm(`${r.name} ${r.shortcodes.join(" ")} ${r.tags.join(" ")}`);
  const keys: string[] = [];
  for (const c of COLLECTIONS) {
    const wordHit = c.words.some((w) => tokens.has(w));
    const phraseHit = c.phrases?.some((p) => full.includes(p)) ?? false;
    if (wordHit || phraseHit) keys.push(c.key);
  }
  cache.set(r, keys);
  return keys;
}

export function inCollection(r: EmojiRecord, key: string): boolean {
  return recordCollections(r).includes(key);
}

/** Count of catalog records per theme, in COLLECTIONS order. */
export function collectionCounts(records: EmojiRecord[]): { key: string; label: string; icon: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const r of records) {
    for (const k of recordCollections(r)) counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return COLLECTIONS.map((c) => ({ key: c.key, label: c.label, icon: c.icon, count: counts.get(c.key) ?? 0 }));
}
