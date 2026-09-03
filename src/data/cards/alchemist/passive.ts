import type { CardDef } from "../../../engine/types";

export const ALCHEMIST_PASSIVE_CARDS: CardDef[] = [
  {
    id: "constant-temperature-crucible",
    name: "恒温坩埚",
    ownerCharId: "alchemist",
    cost: 0,
    cardType: "passive",
    targeting: "none",
    rarity: "uncommon",
    anim: "poison",
    effects: [],
    passive: {
      on: ["roundEnd", "enemyKilled"],
      effectsByTrigger: {
        roundEnd: [
          {
            type: "APPLY_STATUS",
            status: "poison",
            stacksFromStat: { stat: "attack", multiplier: 0.1 },
            target: "allFoes",
            targetHasStatus: "poison",
          },
        ],
        enemyKilled: [
          {
            type: "GAIN_RESOURCE",
            resource: "mana",
            amount: 1,
            target: "self",
            condition: "eventTargetHasStatus",
            conditionStatus: "poison",
          },
        ],
      },
    },
    onDiscard: { mode: "custom", effects: [{ type: "TICK_STATUS", status: "poison", target: "allFoes" }] },
    text: "被动：回合结束时，使所有已中毒的敌人额外获得攻击力 10% 层数的中毒；敌人在中毒状态下死亡时，恢复 1 点法力。本卡被丢弃时，立即结算一次全场中毒伤害。",
  },
  {
    id: "unfinished-product",
    name: "半成品",
    ownerCharId: "alchemist",
    cost: 0,
    cardType: "passive",
    targeting: "none",
    rarity: "uncommon",
    anim: "buff",
    effects: [],
    passive: {
      on: "roundEnd",
      effects: [{ type: "GAIN_SQUAD_BUFF", squadBuffPick: "randomMissing" }],
    },
    onDiscard: { mode: "custom", effects: [{ type: "GAIN_SQUAD_BUFF", squadBuffPick: "randomMissing" }] },
    text: "被动：回合结束时，随机获得 1 个当前没有的组装 BUFF。本卡被丢弃时，随机获得 1 个缺少的组装 BUFF。",
  },
];
