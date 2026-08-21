import type { ItemDef } from "@/items/types";

export const MODULE_ITEM_DEFS: ItemDef[] = [
  {
    id: "rush-module",
    name: "速攻模组",
    category: "module",
    rarity: "fine",
    desc: "装配在一张普通牌上，使其成为速攻牌。装配条件：卡牌本身为普通牌。",
    maxStack: 1,
    icon: "module",
  },
];