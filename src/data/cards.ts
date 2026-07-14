import type { CardDef } from "../engine/types";

export const CARD_DEFS: CardDef[] = [
  {
    id: "whirlwind-slash",
    name: "回旋斩",
    ownerCharId: "swordsman",
    cost: 2,
    cardType: "normal",
    targeting: "allFoes",
    rarity: "common",
    anim: "slash",
    handArtOffsetY: 18,
    effects: [{ type: "DAMAGE", amount: 8, target: "allFoes" }],
    text: "回旋挥剑，对所有敌人造成 8 点伤害。",
  },
];