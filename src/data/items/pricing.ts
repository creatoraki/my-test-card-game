// ============================================================================
// 商店挂牌价 —— 按「类别 × 稀有度」的基价表。
//
// ★ 单一真相: 装备与材料分散在三张表里(items/equipment.ts、items/materials.ts、
//   旧表 data/items.ts), 三处都调本文件的 withBuyValue() 统一打标 ——
//   逐条手写价格只会让「漏写一条」变成沉默的 bug(那件东西会永远不上架)。
// ★ 逐件差异化定价仍然可行: def 自己写了 buyValue 就以它为准(见 withBuyValue 的 ??)。
//
// 数值口径(对照《游戏设定.md》的积分体量): 解封一名冬眠队员 = 150 积分,
// 一件普通装备 120 ≈ 队员的 4/5 —— 早期买装备是真金白银的取舍, 不是顺手就能扫货。
// 1 级商店只出普通档, 高档位先填好, 日后开高级商店不必回来改结构。
// ============================================================================

import type { ItemDef, ItemRarity } from "../../items/types";

export const EQUIP_BUY_BY_RARITY: Record<ItemRarity, number> = {
  common: 120,
  fine: 260,
  rare: 520,
  epic: 950,
  legendary: 1700,
};

export const MATERIAL_BUY_BY_RARITY: Record<ItemRarity, number> = {
  common: 40,
  fine: 90,
  rare: 180,
  epic: 320,
  legendary: 600,
};

// 只给装备与材料标价 —— 废料是卖给回收台的(sellValue), 数据存档与消耗品本期不上架,
// 它们保持 buyValue 缺省, 于是 data/shop.ts 的候选池自然把它们排除在外。
export function withBuyValue(defs: ItemDef[]): ItemDef[] {
  return defs.map((d) => {
    const table =
      d.category === "equipment"
        ? EQUIP_BUY_BY_RARITY
        : d.category === "material"
          ? MATERIAL_BUY_BY_RARITY
          : null;
    if (!table) return d;
    return { ...d, buyValue: d.buyValue ?? table[d.rarity] };
  });
}
