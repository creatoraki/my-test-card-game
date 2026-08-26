// ============================================================================
// 商店挂牌价 —— 按「类别 × 稀有度」的基价表。
//
// ★ 单一真相: 装备与材料分散在三张表里(items/equipment.ts、items/materials.ts、
//   旧表 data/items.ts), 三处都调本文件的 withBuyValue() 统一打标 ——
//   逐条手写价格只会让「漏写一条」变成沉默的 bug(那件东西会永远不上架)。
// ★ 逐件差异化定价仍然可行: def 自己写了 buyValue 就以它为准(见 withBuyValue 的 ??)。
//
// 数值口径(对照《游戏设定.md》的积分体量): 解封一名冬眠队员 = 150 积分,
// 一件普通装备 200 ≈ 队员的 4/3 —— 早期买装备是真金白银的取舍, 不是顺手就能扫货。
// 1 级商店只出普通档, 高档位先填好, 日后开高级商店不必回来改结构。
//
// ⚠ 消耗品(含临期食品)走的是**一口价**, 不吃稀有度阶梯 —— 它们不在据点商店卖, 而在
//   出击准备界面的「货柜」里不限量常驻(货品清单见 data/sortieStock.ts)。这里给它们打
//   buyValue 只是为了让 UI 有价可读、让 townStore 有价可扣。
// ⚠⚠ data/shop.ts 的候选池是「填了 buyValue **且** category 是 equipment/material」——
//   两个条件都要满足。别在那边加一句 sellable("consumable"), 否则消耗品会连带上架到
//   据点商店的随机货架上去。
// ============================================================================

import type { ItemDef, ItemRarity } from "../../items/types";

export const EQUIP_BUY_BY_RARITY: Record<ItemRarity, number> = {
  common: 200,
  fine: 260,
  rare: 520,
  epic: 950,
  legendary: 1700,
};

export const EQUIP_SELL_BY_RARITY: Record<ItemRarity, number> = {
  common: 50,
  fine: 110,
  rare: 220,
  epic: 400,
  legendary: 720,
};

export const MATERIAL_BUY_BY_RARITY: Record<ItemRarity, number> = {
  common: 40,
  fine: 90,
  rare: 180,
  epic: 320,
  legendary: 600,
};

// 未单独配置价格的消耗品使用此基础价。已配置价格的消耗品由自身 ItemDef.buyValue 覆盖。
export const CONSUMABLE_BUY_VALUE = 20;

// 只给装备、材料与消耗品标价 —— 废料与装备可卖给回收台(sellValue), 数据存档本期不上架,
// 它保持 buyValue 缺省。
export function withBuyValue(defs: ItemDef[]): ItemDef[] {
  return defs.map((d) => {
    if (d.category === "consumable") {
      return { ...d, buyValue: d.buyValue ?? CONSUMABLE_BUY_VALUE };
    }
    if (d.category === "equipment") {
      return {
        ...d,
        buyValue: d.buyValue ?? EQUIP_BUY_BY_RARITY[d.rarity],
        sellValue: d.sellValue ?? EQUIP_SELL_BY_RARITY[d.rarity],
      };
    }
    if (d.category === "material") {
      return { ...d, buyValue: d.buyValue ?? MATERIAL_BUY_BY_RARITY[d.rarity] };
    }
    return d;
  });
}
