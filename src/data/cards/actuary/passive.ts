import type { CardDef } from "../../../engine/types";

export const ACTUARY_PASSIVE_CARDS: CardDef[] = [
  {
    id: "risk-reserve",
    name: "风险准备金",
    ownerCharId: "actuary",
    cost: 0,
    cardType: "passive",
    targeting: "none",
    rarity: "common",
    anim: "buff",
    effects: [],
    passive: {
      on: "allyAttacked",
      effects: [],
      effectsByTrigger: {
        allyAttacked: [
          {
            type: "APPLY_STATUS",
            status: "insurance",
            stacksFromStat: { stat: "healPower", multiplier: 0.1 },
            duration: 2,
            target: "primary",
          },
        ],
      },
    },
    text: "被动：每当一名队友受到敌人的直接攻击时，为其附加相当于治愈力 10% 的保险，持续 2 回合，可与现有保险合并。",
  },
];
