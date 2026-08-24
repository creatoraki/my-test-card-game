import type { CardDef } from "../../../engine/types";

export const NEUTRAL_CARD_DEFS: CardDef[] = [
  {
    id: "scrap-shrapnel",
    name: "废料弹片",
    ownerCharId: "swordsman",
    cost: 0,
    cardType: "fast",
    targeting: "foe",
    rarity: "basic",
    temporary: true,
    exhaust: true,
    anim: "shot",
    effects: [{ type: "DAMAGE", multiplier: 1.0 }],
    text: "造成 {0} 点伤害。",
  },
];
