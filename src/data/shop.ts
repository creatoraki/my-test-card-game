// ============================================================================
// 据点商店 —— 等级配置、刷新计价与货架生成(纯数据 + 纯函数)。
//
// 商店的**唯一**主刷新机制是「时间推进一日」: 每次出击后返回据点算推进一日,
// 由 store/townStore.advanceDay() 重摇货架。玩家等不及可以花积分按刷新按钮,
// 当日刷得越多下一次越贵, 隔日归零(refreshes 在 advanceDay 里清 0)。
//
// ⚠ 本文件**不能** import ./index —— data/index.ts 是注册表, 反过来引用会成环。
//   候选池直接从三张原始清单拼: 新表(items/equipment、items/materials)+ 旧表(./items)。
// ⚠ 这里的随机**刻意用 Math.random 而不是 engine/rng**: 商店在据点侧, 不属于
//   探索那条「同种子逐件复现」的种子链。硬造一个 rngState 只会污染那条承诺。
// ============================================================================

import type { ItemDef, ItemRarity } from "../items/types";
import { RARITY_ORDER } from "../items/types";
import { ROLLABLE_BOND_IDS } from "./bonds";
import { ITEM_DEFS as LEGACY_ITEM_DEFS } from "./items";
import { EQUIPMENT_ITEM_DEFS, MATERIAL_ITEM_DEFS } from "./items/index";

// ---------------------------------------------------------------------------
// 货架
// ---------------------------------------------------------------------------
// 一个货架格。★ 不是 ItemStack —— 它还没进任何容器, 买下的那一刻才由 townStore
//   调 makeItemStack 实例化(uid 也是那时才发)。
export interface ShopSlot {
  key: string; // 货架格键(React key + 购买定位)。货架整批替换, 故只需批内唯一
  itemId: string;
  affinity?: string; // 装备**上架时**就 roll 好的随机羁绊 —— 玩家能看着词条挑货
  price: number; // 挂牌价快照: 日后改基价表, 存档里这批货的标价不会跟着漂
  sold: boolean; // 已售出: 保留占位, 当日不补货
}

// ---------------------------------------------------------------------------
// 设施等级
// ---------------------------------------------------------------------------
// ★ 等级提升本期不开放(没有升级入口), 但等级本身是真的字段 ——
//   日后开升级只需在这张表里加 2/3 级两行, 生成逻辑一行不用动。
export interface ShopLevel {
  equipCount: number; // 每次刷新上架几件装备
  materialCount: number; // 每次刷新上架几件材料
  weights: Record<ItemRarity, number>; // 品质概率分布(相对权重, 不必凑 100)
}

export const SHOP_LEVELS: Record<number, ShopLevel> = {
  1: {
    equipCount: 5,
    materialCount: 3,
    // 1 级只出普通品质。写成权重而不是布尔, 是为了 2 级直接改数就能出精良档。
    weights: { common: 100, fine: 0, rare: 0, epic: 0, legendary: 0 },
  },
};

export const DEFAULT_SHOP_LEVEL = 1;

export const shopLevel = (level: number): ShopLevel =>
  SHOP_LEVELS[level] ?? SHOP_LEVELS[DEFAULT_SHOP_LEVEL];

// ---------------------------------------------------------------------------
// 刷新计价 —— 线性递增, 隔日重置回首价
// ---------------------------------------------------------------------------
export const SHOP_REFRESH_BASE = 50; // 当日第 1 次刷新
export const SHOP_REFRESH_STEP = 50; // 每多刷一次的增量

export const shopRefreshCost = (refreshes: number): number =>
  SHOP_REFRESH_BASE + Math.max(0, refreshes) * SHOP_REFRESH_STEP;

// ---------------------------------------------------------------------------
// 候选池
// ---------------------------------------------------------------------------
// 上架资格 = 填了 buyValue(见 items/types.ts)。没标价的东西(废料/数据存档/消耗品)
// 自然被排除, 不必在这里再列一张黑名单。
const ALL_DEFS: ItemDef[] = [...LEGACY_ITEM_DEFS, ...EQUIPMENT_ITEM_DEFS, ...MATERIAL_ITEM_DEFS];

const sellable = (category: ItemDef["category"]): ItemDef[] =>
  ALL_DEFS.filter((d) => d.category === category && d.buyValue != null);

const EQUIP_POOL = sellable("equipment");
const MATERIAL_POOL = sellable("material");

// ---------------------------------------------------------------------------
// 生成
// ---------------------------------------------------------------------------
const pickIndex = (n: number, rand: () => number) => Math.floor(rand() * n);

// 按权重摇一档稀有度, 再在该档内随机取一件。★ 池里没有的档直接跳过, 权重不会漏给
//   不存在的稀有度(与 items/drops.pickByQuality 同一口径)。全档权重为 0 时退回最低档。
function pickByWeight(pool: ItemDef[], weights: Record<ItemRarity, number>, rand: () => number) {
  const tiers = RARITY_ORDER.map((r) => ({
    defs: pool.filter((d) => d.rarity === r),
    w: weights[r] ?? 0,
  })).filter((t) => t.defs.length > 0 && t.w > 0);

  if (!tiers.length) {
    const sorted = pool
      .slice()
      .sort((a, b) => RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity));
    return sorted[0];
  }

  let roll = rand() * tiers.reduce((s, t) => s + t.w, 0);
  for (const t of tiers) {
    roll -= t.w;
    if (roll <= 0) return t.defs[pickIndex(t.defs.length, rand)];
  }
  const last = tiers[tiers.length - 1];
  return last.defs[pickIndex(last.defs.length, rand)];
}

// 摇 n 个格子。★ 同一批货架内 itemId **不重复** —— 一排 5 件同款曙光军刀不成其为货架。
//   池子确实不够时(如某档只有 2 件却要摆 3 个)才放宽重复, 否则会摆不满。
function rollSlots(
  prefix: string,
  n: number,
  pool: ItemDef[],
  weights: Record<ItemRarity, number>,
  rand: () => number,
): ShopSlot[] {
  const out: ShopSlot[] = [];
  if (!pool.length) return out;
  const used = new Set<string>();

  for (let i = 0; i < n; i++) {
    let def: ItemDef | undefined;
    // 有限次重试而不是 while(true): 池子被抽干时也必须停下来。
    for (let tries = 0; tries < 24; tries++) {
      const candidate = pickByWeight(pool, weights, rand);
      if (!candidate) break;
      def = candidate;
      if (!used.has(candidate.id)) break;
    }
    if (!def) continue;
    used.add(def.id);
    out.push({
      key: `${prefix}-${i}`,
      itemId: def.id,
      // 词条与掉落同规则: affinityRollable 的装备各带 1 条随机羁绊(《羁绊设计概览.md》§2.1)。
      affinity:
        def.affinityRollable && ROLLABLE_BOND_IDS.length
          ? ROLLABLE_BOND_IDS[pickIndex(ROLLABLE_BOND_IDS.length, rand)]
          : undefined,
      price: def.buyValue ?? 0,
      sold: false,
    });
  }
  return out;
}

// 摇一整个货架。调用方只有 townStore(advanceDay / refreshShop / 建档)。
export function rollShopStock(
  level: number,
  rand: () => number = Math.random,
): { equip: ShopSlot[]; material: ShopSlot[] } {
  const cfg = shopLevel(level);
  return {
    equip: rollSlots("eq", cfg.equipCount, EQUIP_POOL, cfg.weights, rand),
    material: rollSlots("mt", cfg.materialCount, MATERIAL_POOL, cfg.weights, rand),
  };
}
