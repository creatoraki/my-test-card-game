import type { ItemDef } from "../../items/types";

// 废料不上架商店，只登记回收台出售价值。
export const SCRAP_ITEM_DEFS: ItemDef[] = [
  {
    id: "copper-coin",
    name: "铜币",
    category: "scrap",
    rarity: "common",
    desc: "旧时代的铜币，回收台按金属含量收购。",
    maxStack: 1,
    sellValue: 50,
    icon: "scrap",
  },
  {
    id: "silver-coin",
    name: "银币",
    category: "scrap",
    rarity: "fine",
    desc: "旧时代的银币，回收台按金属含量收购。",
    maxStack: 1,
    sellValue: 200,
    icon: "scrap",
  },
  {
    id: "gold-coin",
    name: "金币",
    category: "scrap",
    rarity: "rare",
    desc: "旧时代的金币，回收台按金属含量收购。",
    maxStack: 1,
    sellValue: 500,
    icon: "scrap",
  },
];
