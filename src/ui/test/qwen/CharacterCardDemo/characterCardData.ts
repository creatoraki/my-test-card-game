import { CHARACTERS } from "@/data/characters";
import { RULES } from "@/engine/rules";
import { characterGlow } from "@/ui/character/characterGlow";

export interface CharacterCardData {
  id: string;
  name: string;
  emoji: string;
  glowColor: string;
  colors: string[];
}

export const CHARACTER_CARDS: CharacterCardData[] = CHARACTERS.map((character) => {
  const glow = characterGlow(character.color);
  return {
    id: character.id,
    name: character.name,
    emoji: character.emoji,
    ...glow,
  };
});

export const PARTY_LIMIT = RULES.progression.partySize;
export const DEFAULT_PARTY = CHARACTER_CARDS.slice(0, PARTY_LIMIT).map((character) => character.id);