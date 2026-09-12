import type { CardDef } from "../../../engine/types";

export const PROPHET_TEMPORARY_CARDS: CardDef[] = [
  {
    id: "companion-star",
    name: "伴星",
    ownerCharId: "prophet",
    cost: 1,
    cardType: "normal",
    targeting: "foe",
    rarity: "basic",
    temporary: true,
    anim: "lightning",
    effects: [
      { type: "DAMAGE", multiplier: 0.7, target: "primary" },
      { type: "APPLY_STATUS", status: "starlight", stacks: 1, target: "self", condition: "waterfall" },
    ],
    text: "造成 {0} 点伤害。瀑布：汇星 1。",
  },
  {
    id: "spectral-shard",
    name: "光谱碎片",
    ownerCharId: "prophet",
    cost: 0,
    cardType: "normal",
    targeting: "ally",
    rarity: "basic",
    temporary: true,
    anim: "shield",
    effects: [
      { type: "GAIN_SHIELD", multiplier: 0.25, target: "primary" },
      { type: "APPLY_STATUS", status: "starlight", stacks: 1, target: "self" },
    ],
    text: "为一名队友提供 {0} 点护盾。汇星 1。",
  },
];
