/**
 * Curated packs mapped to Slackmojis' own categories, so each pack is clean and
 * consistent (e.g. Cats = only the yellow cat characters, Memes are separate).
 * `special` packs aren't category filters: featured = the default curated mix,
 * trending = live most-copied.
 */
export interface Pack {
  key: string;
  label: string;
  icon: string;
  categories?: string[];
  /** Keyword theme (see lib/collections). Cuts across Slackmojis categories. */
  theme?: string;
  special?: "featured" | "trending";
}

export const PACKS: Pack[] = [
  { key: "featured", label: "Featured", icon: "✨", special: "featured" },
  { key: "trending", label: "Trending", icon: "🔥", special: "trending" },
  // Keyword themes — these span the whole catalog (incl. the huge "Random" bucket).
  { key: "reactions", label: "Reactions", icon: "😮", theme: "reactions" },
  { key: "celebrate", label: "Celebrate", icon: "🎉", theme: "celebrate" },
  { key: "animals", label: "Animals", icon: "🐾", theme: "animals" },
  { key: "hype", label: "Hype", icon: "🔥", theme: "hype" },
  { key: "love", label: "Love", icon: "❤️", theme: "love" },
  { key: "food", label: "Food & Drink", icon: "☕", theme: "food" },
  { key: "tech", label: "Tech & Work", icon: "⚙️", theme: "tech" },
  { key: "hands", label: "Hands", icon: "👏", theme: "hands" },
  { key: "memes", label: "Memes", icon: "🐸", theme: "memes" },
  // Curated character packs — clean Slackmojis categories.
  { key: "parrot", label: "Party Parrot", icon: "🦜", categories: ["Party Parrot"] },
  { key: "cats", label: "Cats", icon: "🐱", categories: ["Blob Cats", "Cat Emojis"] },
  { key: "blobs", label: "Blobs", icon: "🫠", categories: ["Hangouts Blob"] },
  { key: "pepe", label: "Pepe", icon: "🐸", categories: ["Pepe the Frog"] },
  { key: "amongus", label: "Among Us", icon: "👾", categories: ["Among Us"] },
  { key: "mario", label: "Mario", icon: "🍄", categories: ["Mario"] },
  { key: "pokemon", label: "Pokémon", icon: "⚡", categories: ["Pokemon"] },
  { key: "spongebob", label: "SpongeBob", icon: "🧽", categories: ["Sponge Bob"] },
  { key: "starwars", label: "Star Wars", icon: "🌌", categories: ["Star Wars"] },
];

export const DEFAULT_PACK = "featured";

export function packByKey(key: string): Pack {
  return PACKS.find((p) => p.key === key) ?? PACKS[0];
}
