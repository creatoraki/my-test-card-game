// ============================================================================
// 物品定义 —— 首图「废弃楼层」的战利品清单。
//
// 类别口径见《探索模式设计.md》§6.1; 装备槽与稀有度见《物品设计.md》二/四章。
// ★ maxStack 一律 1 ——「1 格 = 1 件」是负重惩罚成立的前提(见 §6.2 的 12-18 格产出配额)。
// ★ 同一 familyId 的若干条各占一个稀有度档 —— 掉落时 qualityBias 在族内右移权重,
//   于是「同一张掉落表, 低档掉破烂、高档掉同类里的好货」不需要写两张表。
// 图标不在此登记 —— 见 ui/itemArt.tsx(与 enemyArt.ts / cardArt.ts 同约定, 数据层不碰素材)。
// ============================================================================

import type { ItemDef } from "../items/types";
import { withBuyValue } from "./items/pricing";

const DEFS: ItemDef[] = [
	{
		id: "data-shard",
		name: "数据存档",
		category: "data",
		rarity: "common",
		desc: "保存着废弃楼层旧时代记录的数据片段。",
		maxStack: 1,
		sellValue: 25,
		icon: "material",
	},
];

// 商店挂牌价统一打标(见 ./items/pricing.ts)。★ 旧表里的装备与材料同样会上架 ——
// 普通材料若只取新表, 候选池就只有魔方/齿轮/电池 3 件, 1 级商店抽 3 个刚好把池子抽干。
export const ITEM_DEFS: ItemDef[] = withBuyValue(DEFS);
