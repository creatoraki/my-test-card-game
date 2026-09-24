import type { CardDef } from "@/engine/types";

const rewardBase = {
  ownerCharId: "alchemist",
  cost: 1,
  cardType: "fast" as const,
  rarity: "common" as const,
  temporary: true,
  exhaust: true,
};

// 被动类奖励：无法付费，持在手中生效，回合结束进入消耗区(见 passive.recycleHandPassives)。
const passiveRewardBase = { ...rewardBase, cost: 0, cardType: "passive" as const, targeting: "none" as const };

export const ALCHEMIST_REWARD_CARDS: CardDef[] = [
  {
    ...rewardBase,
    id: "over-catalysis",
    name: "过量催化",
    targeting: "foe",
    anim: "fire",
    effects: [
      { type: "APPLY_STATUS", status: "burn", stacksFromStat: { stat: "attack", multiplier: 0.75 }, duration: 2, target: "primary" },
      { type: "APPLY_STATUS", status: "poison", stacksFromStat: { stat: "attack", multiplier: 0.2 }, duration: 2, target: "primary" },
    ],
    text: "对目标施加 {0} 层灼烧与 {1} 层中毒，均持续 2 回合。打出后消耗。",
  },
  {
    ...rewardBase,
    id: "chain-burst",
    name: "链式燃烧",
    targeting: "none",
    anim: "fire",
    effects: [
      { type: "APPLY_STATUS", status: "burn", stacksFromStat: { stat: "attack", multiplier: 0.5 }, duration: 2, target: "allFoes" },
      { type: "APPLY_STATUS", status: "flammable", stacks: 1, duration: 1, target: "allFoes" },
    ],
    text: "对所有敌人施加 {0} 层灼烧（持续 2 回合），并施加易燃 1 回合。打出后消耗。",
  },
  {
    ...rewardBase,
    id: "phase-membrane",
    name: "相变护膜",
    targeting: "none",
    anim: "shield",
    effects: [{ type: "GAIN_SHIELD", multiplier: 0.6, target: "allAllies" }],
    text: "全队获得 {0} 点护盾。打出后消耗。",
  },
  {
    ...rewardBase,
    id: "rejuvenation-potion",
    name: "回生药剂",
    targeting: "ally",
    anim: "heal",
    effects: [
      { type: "HEAL", multiplier: 0.6, target: "primary" },
      { type: "RESTORE_HP_LIMIT", multiplier: 0.6, target: "primary" },
    ],
    text: "选择一名队友，回复 {0} 点生命并恢复等额体力极限。打出后消耗。",
  },
  {
    ...rewardBase,
    id: "tonic-potion",
    name: "滋补魔药",
    targeting: "none",
    anim: "heal",
    effects: [{ type: "HEAL", multiplier: 0.6, target: "allAllies" }],
    text: "全队恢复 {0} 点生命。打出后消耗。",
  },
  {
    ...rewardBase,
    id: "resonance-catalyst",
    name: "共鸣催化剂",
    targeting: "none",
    anim: "buff",
    effects: [
      { type: "RESONATE", amount: 1, resonatePick: "handAll" },
      { type: "DRAW", amount: 1 },
    ],
    text: "手牌中所有共鸣卡各获得 1 次共鸣强化（无视费用限制）；抽 1 张牌。打出后消耗。",
  },
  {
    ...rewardBase,
    id: "inspiration-potion",
    name: "灵感药剂",
    targeting: "none",
    anim: "buff",
    effects: [{ type: "DRAW", amount: 2 }],
    text: "抽 2 张牌。打出后消耗。",
  },
  {
    ...passiveRewardBase,
    id: "bounty-hunter",
    name: "赏金猎人",
    anim: "buff",
    effects: [],
    passive: {
      on: "enemyKilled",
      effects: [{ type: "APPLY_STATUS", status: "bountyHunter", stacks: 1, target: "self" }],
    },
    text: "被动：在手中时，每完成一次击杀获得 1 层赏金猎人，使战斗结算掉率提高 30%。回合结束时移入消耗区。",
  },
  {
    ...passiveRewardBase,
    id: "residual-heat-crystal",
    name: "余温结晶",
    anim: "fire",
    effects: [],
    passive: {
      on: "burnApplied",
      effects: [{ type: "GAIN_SHIELD", multiplier: 0.05, target: "allAllies" }],
    },
    text: "被动：在手中时，你每打出一张施加灼烧的卡，全队获得 5% 治愈力的护盾。回合结束时移入消耗区。",
  },
];
