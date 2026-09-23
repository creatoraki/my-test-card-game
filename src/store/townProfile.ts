// 城镇档案的初始值与派生量 —— 建档 / 重置 / 复苏共用的出厂设置, 以及训练点这类跨切片的计算。

import { RULES } from "../engine";
import {
  BLESSING_RELIC_DEFS,
  CHARACTERS,
  REGIONAL_MATERIAL_DEFS,
  getItemDef,
  makeCard,
  makeItemStack,
  techTrainingBonus,
  type CharacterDef,
  type TechTreeState,
} from "../data";
import type { ItemStack } from "../items/types";
import type { CharacterState, CodexState, SquadTalentState, TownStore } from "./townTypes";

// ★ 开局在编队的是 INITIAL_AWAKENED 上的人, 其余角色在复苏舱等待复苏。
//   characters 仍然**全量**建档 —— 复苏时直接用 freshCharacter 重置为初始档案。
// 开局就已唤醒并直接上阵的角色 id(按顺序)。
const INITIAL_AWAKENED = ["swordsman", "prophet", "botanist", "alchemist", "actuary"];
const INITIAL_TEST_EXP = 2000;
const INITIAL_POLLUTION = 30;

const INITIAL_CONSUMABLE_IDS = [
  "sugar-cube-c",
  "medical-kit-c",
  "holy-water-c",
  "fruit-juice-c",
] as const;

// 模组制造与装备养成的测试材料。开局给足，方便直接验证两条消耗路径。
const INITIAL_MATERIAL_IDS = [
  "logic-cube",
  "standard-gear",
  "standard-battery",
  "coil-spring",
  "magnet",
] as const;
const INITIAL_CRYSTAL_IDS = ["green-crystal", "blue-crystal", "red-crystal"] as const;
const INITIAL_RELIC_IDS = ["relic-sport-shoes", "relic-broken-compass"] as const;
const INITIAL_REGIONAL_IDS = REGIONAL_MATERIAL_DEFS.flatMap((def) =>
  Array.from({ length: def.regionTier === "boss" ? 2 : 6 }, () => def.id),
);

export function freshCharacter(def: CharacterDef): CharacterState {
  return {
    charId: def.id,
    hp: Math.max(1, Math.round(def.base.maxHp)),
    hpLimit: Math.max(1, Math.round(def.base.maxHp)),
    exp: 0,
    expEarned: 0,
    deck: def.startingCardIds.map((cid) => ({ ...makeCard(cid) })),
    deckLevel: 0,
    minDeckSize: RULES.deck.initialMinSize,
    equipped: { weapon: null, armor: null, trinket: null },
    pendingDraw: null,
    forgeDay: 1,
    drawUsedToday: 0,
    removeUsedToday: 0,
    pollution: INITIAL_POLLUTION,
    sick: false,
    quirks: [],
  };
}

export function freshStorage(): ItemStack[] {
  return [
    makeItemStack("rush-module"),
    ...INITIAL_CONSUMABLE_IDS.flatMap((itemId) =>
      Array.from({ length: 3 }, () => makeItemStack(itemId)),
    ),
    ...INITIAL_MATERIAL_IDS.flatMap((itemId) =>
      Array.from({ length: 6 }, () => makeItemStack(itemId)),
    ),
    ...INITIAL_CRYSTAL_IDS.map((itemId) => makeItemStack(itemId)),
    ...INITIAL_RELIC_IDS.map((itemId) => makeItemStack(itemId)),
    ...INITIAL_REGIONAL_IDS.map((itemId) => makeItemStack(itemId)),
  ];
}

export function freshProfile(includeInitialExp = true): {
  characters: Record<string, CharacterState>;
  awakened: string[];
  fallen: string[];
  clearedMaps: string[];
  party: string[];
  squadTalent: SquadTalentState;
  techTree: TechTreeState;
  codex: CodexState;
  seenGuides: string[];
} {
  const characters: Record<string, CharacterState> = {};
  for (const c of CHARACTERS) characters[c.id] = freshCharacter(c);
  // 名单里不存在的 id 直接忽略, 保证改角色数据时这里不会崩
  const awakened = INITIAL_AWAKENED.filter((id) => characters[id]);
  if (includeInitialExp) {
    for (const charId of awakened) {
      characters[charId] = {
        ...characters[charId],
        exp: INITIAL_TEST_EXP,
        expEarned: INITIAL_TEST_EXP,
      };
    }
  }
  // 上阵人数有上限, 初始队伍按名单顺序截断
  return {
    characters,
    awakened,
    fallen: [],
    clearedMaps: [],
    party: awakened.slice(0, RULES.progression.partySize),
    squadTalent: { badgeId: null, nodes: [] },
    techTree: { levels: {} },
    codex: { items: [], cards: [], enemies: [] },
    seenGuides: [],
  };
}

export const TRAINING_POINT_CONTRIBUTORS = 5;

export function squadTrainingPoints(
  state: Pick<TownStore, "characters" | "awakened" | "techTree">,
): number {
  const deckLevels = state.awakened
    .map((charId) => state.characters[charId]?.deckLevel ?? 0)
    .sort((left, right) => right - left);
  return deckLevels
    .slice(0, TRAINING_POINT_CONTRIBUTORS)
    .reduce((sum, level) => sum + level, 0) + techTrainingBonus(state.techTree.levels);
}

export const techLevels = (state: TownStore): TechTreeState["levels"] => state.techTree.levels;

// 圣水池净化完成: 在同稀有度、尚未拥有的祝福遗物里随机挑一件。没有候选返回 null(调用方折积分)。
export function purifiedRelicId(relicId: string, storage: ItemStack[]): string | null {
  const source = getItemDef(relicId).relic;
  if (!source?.purifyTo) return null;
  const rarity = typeof source.purifyTo === "string" ? getItemDef(source.purifyTo).rarity : source.purifyTo.rarity;
  const owned = new Set(
    storage
      .filter((stack) => getItemDef(stack.itemId).category === "relic")
      .map((stack) => stack.itemId),
  );
  const candidates = BLESSING_RELIC_DEFS.filter((def) => def.rarity === rarity && !owned.has(def.id));
  if (!candidates.length) return null;
  return candidates[Math.floor(Math.random() * candidates.length)].id;
}
