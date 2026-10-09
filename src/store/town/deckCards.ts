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

/** 普通卡替换的候选池: 把该卡移出卡组后仍可加入的普通卡, 且不与原卡同名。空数组 = 这张卡无法替换。 */
export function commonReplaceCandidates(cs: CharacterState, uid: string): string[] {
  const card = cs.deck.find((other) => other.uid === uid);
  if (!card) return [];
  return availablePools({ ...cs, deck: cs.deck.filter((other) => other.uid !== uid) }).common
    .filter((id) => id !== card.id);
}

/** 全队混合抽的一张候选: 卡牌归属的角色 + 卡牌定义 id。 */
export interface PartyDrawOffer {
  charId: string;
  cardDefId: string;
}

/**
 * 全队混合三选一: 把传入角色的卡池混在一起抽 count 张(默认 drawChoices = 3), 不需要先选人。
 * 角色顺序先打乱, 再按顺序轮流各抽一张 —— 3 人存活时恰好每人一张, 不足 3 人时从头轮流补足。
 * 每张都按该角色自己的卡组等级摇稀有度并遵守限携; 同名卡不重复出现, 某角色卡池抽干时跳到下一名。
 */
export function rollPartyDrawOffers(
  characters: CharacterState[],
  rand: () => number,
  count: number = RULES.deck.drawChoices,
): PartyDrawOffer[] {
  const order = [...characters];
  for (let i = order.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  const offers: PartyDrawOffer[] = [];
  const taken = new Set<string>();
  for (let attempt = 0; order.length && offers.length < count && attempt < count * order.length * 2; attempt += 1) {
    const cs = order[attempt % order.length];
    const pools = availablePools(cs);
    for (const rarity of Object.keys(pools) as Rarity[]) pools[rarity] = pools[rarity].filter((id) => !taken.has(id));
    const pool = pools[rollRarity(cs.deckLevel, pools, rand)];
    if (!pool.length) continue;
    const cardDefId = pool[Math.floor(rand() * pool.length)];
    taken.add(cardDefId);
    offers.push({ charId: cs.charId, cardDefId });
  }
  return offers;
}
