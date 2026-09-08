import type { Card, Rarity } from "@/engine";
import { deckRarityWeights, RULES } from "@/engine";
import { getCardDef, getCharacter, makeCard } from "@/data";
import type { CharacterState } from "./townStore";

export function countByRarity(deck: Card[]): Record<Rarity, number> {
  const out: Record<Rarity, number> = { common: 0, uncommon: 0, rare: 0 };
  for (const card of deck) {
    const rarity = card.rarity ?? "common";
    if (rarity === "basic") continue;
    out[rarity] += 1;
  }
  return out;
}

export function canAddRarity(deck: Card[], rarity: Rarity): boolean {
  return countByRarity(deck)[rarity] < RULES.deck.rarityCap[rarity];
}

export function countByDefId(deck: Card[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const card of deck) out[card.id] = (out[card.id] ?? 0) + 1;
  return out;
}

export function canAddCopy(deck: Card[], defId: string): boolean {
  const rarity = getCardDef(defId).rarity ?? "common";
  if (rarity === "basic") return true;
  return (countByDefId(deck)[defId] ?? 0) < RULES.deck.copyCap[rarity];
}

export function availablePools(cs: CharacterState): Record<Rarity, string[]> {
  const pools = getCharacter(cs.charId).pools;
  const out = {} as Record<Rarity, string[]>;
  for (const rarity of ["common", "uncommon", "rare"] as Rarity[]) {
    out[rarity] = canAddRarity(cs.deck, rarity)
      ? pools[rarity].filter((defId) => canAddCopy(cs.deck, defId))
      : [];
  }
  return out;
}

export function rollRarity(
  level: number,
  pools: Record<Rarity, string[]>,
  rand: () => number,
): Rarity {
  const weights = deckRarityWeights(level);
  const order: Rarity[] = ["common", "uncommon", "rare"];
  const total = order.reduce((sum, rarity) => sum + (pools[rarity].length ? weights[rarity] : 0), 0);
  if (total <= 0) return "common";

  let roll = rand() * total;
  for (const rarity of order) {
    if (!pools[rarity].length) continue;
    roll -= weights[rarity];
    if (roll <= 0) return rarity;
  }
  return "common";
}

export function addCardToDeck(cs: CharacterState, cardDefId: string): boolean {
  const card = makeCard(cardDefId);
  const rarity = card.rarity === "basic" ? "common" : card.rarity ?? "common";
  if (!canAddRarity(cs.deck, rarity) || !canAddCopy(cs.deck, cardDefId)) return false;
  cs.deck = [...cs.deck, card];
  return true;
}
