import type { CardDef } from "@/engine/types";

// 精算师普通卡 · 攻击。两条思路: 吃全队保险层数(代位求偿 / 超额追偿)、吃盈余(违约金)。
export const ACTUARY_ATTACK_CARDS: CardDef[] = [
  {
    id: "subrogation",
    name: "代位求偿",
    ownerCharId: "actuary",
    cost: 1,
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
  {
    id: "breach-penalty",
    name: "违约金",
    ownerCharId: "actuary",
    cost: 1,
    cardType: "normal",
    targeting: "foe",
    rarity: "common",
    anim: "shot",
    // 两档伤害互斥: 先按当前盈余判定档位, 结算完再扣除 10 点盈余。
    effects: [
      {
        type: "DAMAGE",
        multiplier: 1.3,
        target: "primary",
        condition: "counterAtLeast",
        conditionCounter: "actuarySurplus",
        conditionValue: 10,
      },
      {
        type: "DAMAGE",
        multiplier: 0.7,
        target: "primary",
        condition: "counterBelow",
        conditionCounter: "actuarySurplus",
        conditionValue: 10,
      },
      {
        type: "CONSUME_STATUS",
        status: "surplus",
        maxStacks: 10,
        target: "self",
        condition: "counterAtLeast",
        conditionCounter: "actuarySurplus",
        conditionValue: 10,
      },
    ],
    text: "对一名敌人造成 70% 攻击力伤害；盈余不少于 10 点时，消耗 10 点盈余，改为造成 130% 攻击力伤害。",
  },
  {
    id: "excess-recovery",
    name: "超额追偿",
    ownerCharId: "actuary",
    cost: 1,
    cardType: "normal",
    targeting: "foe",
    rarity: "common",
    anim: "shot",
    // 先消耗全队的超额保险(此刻理赔必然溢出的部分), 消耗量转为追加的固定伤害。
    effects: [
      { type: "CONSUME_INSURANCE", excessOnly: true, maxStacks: 8, target: "allAllies" },
      { type: "DAMAGE", multiplier: 0.4, target: "primary" },
      {
        type: "DAMAGE",
        amount: 1,
        scaleByCounter: { counter: "lastConsumedStatusStacks" },
        target: "primary",
        condition: "counterAtLeast",
        conditionCounter: "lastConsumedStatusStacks",
        conditionValue: 1,
      },
    ],
    text: "消耗全体队友的超额保险（每人至多 8 层），对一名敌人造成 40% 攻击力伤害，并追加等同于消耗层数的固定伤害（不受攻击力影响）。",
  },
];
