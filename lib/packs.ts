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
  special?: "featured" | "trending";
}

export const PACKS: Pack[] = [
  { key: "featured", label: "Featured", icon: "✨", special: "featured" },
  { key: "trending", label: "Trending", icon: "🔥", special: "trending" },
  { key: "parrot", label: "Party Parrot", icon: "🦜", categories: ["Party Parrot"] },
  { key: "cats", label: "Cats", icon: "🐱", categories: ["Blob Cats", "Cat Emojis"] },
  { key: "blobs", label: "Blobs", icon: "🫠", categories: ["Hangouts Blob"] },
  { key: "pepe", label: "Pepe", icon: "🐸", categories: ["Pepe the Frog"] },
  { key: "amongus", label: "Among Us", icon: "👾", categories: ["Among Us"] },
  { key: "memes", label: "Memes", icon: "😂", categories: ["Meme"] },
  { key: "mario", label: "Mario", icon: "🍄", categories: ["Mario"] },
  { key: "pokemon", label: "Pokémon", icon: "⚡", categories: ["Pokemon"] },
  { key: "spongebob", label: "SpongeBob", icon: "🧽", categories: ["Sponge Bob"] },
  { key: "starwars", label: "Star Wars", icon: "🌌", categories: ["Star Wars"] },
];

export const DEFAULT_PACK = "featured";

export function packByKey(key: string): Pack {
  return PACKS.find((p) => p.key === key) ?? PACKS[0];
}
