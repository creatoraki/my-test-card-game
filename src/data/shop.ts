// ============================================================================
// 据点统一商店 —— 货位类型、品质权重与物品侧抽取。
//
// 卡牌货位需要读取角色卡组，因此整架生成放在 store/shopStock.ts；本文件只负责
// 物品货位工厂与类型权重。随机使用 Math.random，不进入探索的可复现种子链。
//
// ⚠ 本文件不能 import ./index —— data/index.ts 是注册表，反向引用会成环。
//   遗物池同样直接从 ./items/relics 取，不能改成从 ./items/index 引入。
// ============================================================================

import type { Rarity } from "../engine";
import type { EquipRoll, ItemDef, ItemRarity } from "../items/types";
import { rollAffinity } from "../items/drops";
import { rollEquipment } from "../items/equipRoll";
import { RARITY_ORDER } from "../items/types";
import { ROLLABLE_BOND_IDS } from "./bonds";
import { BLESSING_RELIC_DEFS } from "./items/relics";
import { EQUIPMENT_ITEM_DEFS, MATERIAL_ITEM_DEFS } from "./items/index";
import { relicBuyValue } from "./items/pricing";

// ---------------------------------------------------------------------------
// 货位
// ---------------------------------------------------------------------------
export interface ShopCardSlot {
  kind: "card";
  key: string;
  charId: string;
  cardDefId: string;
  rarity: Rarity;
  price: number;
  sold: boolean;
}

export interface ShopItemSlot {
  kind: "item";
  key: string;
  itemId: string;
  affinity?: string;
  roll?: EquipRoll;
  price: number;
  sold: boolean;
}

export type ShopSlot = ShopCardSlot | ShopItemSlot;

// ---------------------------------------------------------------------------
// 设施等级与货位类型
// ---------------------------------------------------------------------------
export interface ShopLevel {
  slotCount: number;
  weights: Record<ItemRarity, number>;
}

export const SHOP_LEVELS: Record<number, ShopLevel> = {
  1: {
    slotCount: 6,
    weights: { common: 100, fine: 0, rare: 0, epic: 0, legendary: 0 },
  },
};

export const DEFAULT_SHOP_LEVEL = 1;

export const SHOP_KIND_WEIGHTS = {
  card: 40,
  equipment: 35,
  material: 20,
  relic: 5,
} as const;

export type ShopKind = keyof typeof SHOP_KIND_WEIGHTS;
export type ShopItemKind = Exclude<ShopKind, "card">;

export const shopLevel = (level: number): ShopLevel =>
  SHOP_LEVELS[level] ?? SHOP_LEVELS[DEFAULT_SHOP_LEVEL];

export function pickShopKind(rand: () => number = Math.random): ShopKind {
  const entries = Object.entries(SHOP_KIND_WEIGHTS) as [ShopKind, number][];
  let roll = rand() * entries.reduce((sum, [, weight]) => sum + weight, 0);
  for (const [kind, weight] of entries) {
    roll -= weight;
    if (roll <= 0) return kind;
  }
  return entries[entries.length - 1][0];
}

// ---------------------------------------------------------------------------
// 候选池
// ---------------------------------------------------------------------------
const ALL_DEFS: ItemDef[] = [...EQUIPMENT_ITEM_DEFS, ...MATERIAL_ITEM_DEFS];

const sellable = (category: ItemDef["category"]): ItemDef[] =>
  ALL_DEFS.filter((def) => def.category === category && def.buyValue != null);

const EQUIP_POOL = sellable("equipment");
const MATERIAL_POOL = sellable("material");
const RELIC_POOL = BLESSING_RELIC_DEFS;

// ---------------------------------------------------------------------------
// 生成工具
// ---------------------------------------------------------------------------
const pickIndex = (length: number, rand: () => number): number =>
  Math.min(length - 1, Math.max(0, Math.floor(rand() * length)));

function pickByWeight(
  pool: ItemDef[],
  weights: Record<ItemRarity, number>,
  rand: () => number,
): ItemDef | undefined {
  const tiers = RARITY_ORDER.map((rarity) => ({
    defs: pool.filter((def) => def.rarity === rarity),
    weight: weights[rarity] ?? 0,
  })).filter((tier) => tier.defs.length > 0 && tier.weight > 0);

  if (!tiers.length) {
    return pool
      .slice()
      .sort((left, right) => RARITY_ORDER.indexOf(left.rarity) - RARITY_ORDER.indexOf(right.rarity))[0];
  }

  let roll = rand() * tiers.reduce((sum, tier) => sum + tier.weight, 0);
  for (const tier of tiers) {
    roll -= tier.weight;
    if (roll <= 0) return tier.defs[pickIndex(tier.defs.length, rand)];
  }
  const last = tiers[tiers.length - 1];
  return last.defs[pickIndex(last.defs.length, rand)];
}

function poolOf(kind: ShopItemKind): ItemDef[] {
  if (kind === "equipment") return EQUIP_POOL;
  if (kind === "material") return MATERIAL_POOL;
  return RELIC_POOL;
}

export function rollShopItemSlot(
  kind: ShopItemKind,
  level: number,
  used: Set<string>,
  rand: () => number = Math.random,
): ShopItemSlot | null {
  const pool = poolOf(kind);
  const unused = pool.filter((def) => !used.has(def.id));
  if (!unused.length) return null;

  const cfg = shopLevel(level);
  let def: ItemDef | undefined;
  for (let tries = 0; tries < 24; tries += 1) {
    const candidate = pickByWeight(pool, cfg.weights, rand);
    if (!candidate) break;
    if (!used.has(candidate.id)) {
      def = candidate;
      break;
    }
  }
  if (!def) def = pickByWeight(unused, cfg.weights, rand);
  if (!def) return null;

  used.add(def.id);
  const isEquipment = kind === "equipment";
  return {
    kind: "item",
    key: "",
    itemId: def.id,
    affinity: isEquipment
      ? rollAffinity(def, ROLLABLE_BOND_IDS, (length) => pickIndex(length, rand))
      : undefined,
    roll: isEquipment ? rollEquipment(def, (length) => pickIndex(length, rand)) : undefined,
    price: kind === "relic" ? relicBuyValue(def) : def.buyValue ?? 0,
    sold: false,
  };
}
