import type { CardDef } from "../../../engine/types";

export const ACTUARY_ATTACK_CARDS: CardDef[] = [
  {
    id: "subrogation",
    name: "代位求偿",
    ownerCharId: "actuary",
    cost: 2,
    cardType: "normal",
    targeting: "foe",
    rarity: "common",
    anim: "shot",
    effects: [
      {
        type: "DAMAGE",
        multiplier: 0.6,
        target: "primary",
        bonusMultiplierFrom: "partyInsuranceStacks",
        bonusMultiplierPer: 0.025,
        maxBonusMultiplier: 0.8,
        hitBonus: 10,
      },
    ],
    text: "对一名敌人造成 60% 攻击力伤害；每 1 层全队保险额外增加 2.5% 攻击倍率，最多增加 80%；命中修正 +10%。",
  },
];
