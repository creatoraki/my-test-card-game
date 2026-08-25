import type { ItemDef } from "@/items/types";

export const MODULE_ITEM_DEFS: ItemDef[] = [
  {
    id: "rush-module",
    name: "速攻模组",
    category: "module",
    rarity: "fine",
    desc: "装配后，该卡牌变为速攻牌。",
    maxStack: 1,
    icon: "module",
  },
  {
    id: "discard-module",
    name: "弃牌模组",
    category: "module",
    rarity: "fine",
    desc: "装配后，该卡牌使用时额外弃置手牌最后一张。",
    maxStack: 1,
    icon: "module",
  },
];
