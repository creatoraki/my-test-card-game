import type { ItemDef } from "../../items/types";

// 废料不上架商店，只登记回收台出售价值。
export const SCRAP_ITEM_DEFS: ItemDef[] = [
  {
    id: "bronze-bear",
    name: "铜质小熊",
    category: "scrap",
    rarity: "common",
    desc: "旧时代的铜质换金摆件，回收台按贵金属含量收购。",
    maxStack: 1,
    sellValue: 50,
    icon: "scrap",
  },
  {
    id: "silver-bear",
    name: "银质小熊",
    category: "scrap",
    rarity: "fine",
    desc: "旧时代的银质换金摆件，回收台按贵金属含量收购。",
    maxStack: 1,
    sellValue: 200,
    icon: "scrap",
  },
  {
    id: "golden-bear",
    name: "金质小熊",
    category: "scrap",
    rarity: "rare",
    desc: "旧时代的金质换金摆件，回收台按贵金属含量收购。",
    maxStack: 1,
    sellValue: 500,
    icon: "scrap",
  },
];