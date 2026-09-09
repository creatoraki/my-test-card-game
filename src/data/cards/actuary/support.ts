import type { CardDef } from "../../../engine/types";

export const ACTUARY_SUPPORT_CARDS: CardDef[] = [
  {
    id: "policy-pledge",
    name: "保单质押",
    ownerCharId: "actuary",
    cost: 1,
    cardType: "fast",
    targeting: "ally",
    rarity: "common",
    anim: "buff",
    effects: [
      { type: "CONSUME_STATUS", status: "insurance", maxStacks: 30, target: "primary" },
      {
        type: "GAIN_RESOURCE",
        resource: "mana",
        amount: 1,
        scaleByCounter: { counter: "lastConsumedStatusStacks", per: 0.1, max: 3 },
      },
      { type: "DRAW", amount: 1 },
    ],
    text: "消耗目标身上至多 30 层保险，每消耗 10 层获得 1 点法力（上限 3 点）；抽 1 张牌。",
  },
];
