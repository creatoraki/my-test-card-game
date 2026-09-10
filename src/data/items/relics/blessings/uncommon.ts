import type { ItemDef } from "../../../../items/types";

export const UNCOMMON_BLESSING_RELIC_DEFS: ItemDef[] = [
  {
    id: "relic-stun-hammer",
    name: "眩晕锤",
    category: "relic",
    rarity: "fine",
    desc: "每当洗牌时，将一张临时卡牌《眩晕锤》加入随机存活队员的手牌。",
    maxStack: 1,
    relic: { polarity: "blessing", scope: "battle" },
  },
];
