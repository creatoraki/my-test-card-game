// 剑士 · 被动卡。无费用、不可打出、持在手中自动生效，回合结束自动进入弃牌区
// （不视为弃牌动作，也不参与瀑布等费用计算，见 engine/passive.ts）。
import type { CardDef } from "../../../engine/types";

export const SWORDSMAN_PASSIVE_CARDS: CardDef[] = [
  {
    id: "whetstone",
    name: "武器研磨",
    ownerCharId: "swordsman",
    cost: 0,
    cardType: "passive",
    targeting: "none",
    rarity: "common",
    anim: "buff",
    effects: [],
    passive: {
      on: "cardDiscarded",
      effects: [{ type: "APPLY_STATUS", status: "sharp", stacks: 1, duration: 2, target: "self" }],
    },
    onDiscard: { mode: "custom", effects: [{ type: "DRAW", amount: 2 }] },
    text: "被动：每丢弃 1 张卡牌，为自身附加 1 层持续 2 回合的锋利。本卡被丢弃时，抽 2 张牌。",
  },
  {
    id: "crow",
    name: "鸦",
    ownerCharId: "swordsman",
    cost: 0,
    cardType: "passive",
    targeting: "none",
    rarity: "uncommon",
    anim: "shot",
    effects: [],
    passive: {
      on: "cardDiscarded",
      effects: [{ type: "DAMAGE", multiplier: 0.3, target: "randomFoe" }],
    },
    onDiscard: {
      mode: "custom",
      effects: [{ type: "DAMAGE", multiplier: 0.4, target: "allFoes" }],
    },
    text: "被动：每丢弃 1 张卡牌，对随机敌人造成 {0} 点伤害。本卡被丢弃时，对所有敌人造成 {d0} 点伤害。",
  },
  {
    id: "divine-eye",
    name: "天眼",
    ownerCharId: "swordsman",
    cost: 0,
    cardType: "passive",
    targeting: "none",
    rarity: "uncommon",
    anim: "buff",
    effects: [],
    passive: {
      on: "cardDrawn",
      // eventCard = 刚抽到的那张牌（见 engine/effects.ts MARK_CARDS）。
      effects: [{ type: "MARK_CARDS", mark: "mindsEye", markPick: "eventCard" }],
    },
    onDiscard: {
      mode: "custom",
      effects: [{ type: "DISCARD", amount: 1, discardPick: "handTop" }],
    },
    text: "被动：每抽到 1 张牌，为其附加心眼。本卡被丢弃时，额外丢弃手牌第一张。",
  },
  {
    id: "avidya",
    name: "无明",
    ownerCharId: "swordsman",
    cost: 0,
    cardType: "passive",
    targeting: "none",
    rarity: "rare",
    anim: "buff",
    effects: [],
    text: "被动：当卡牌要求丢弃手牌第一张或最后一张时，可以改为选择任意手牌；丢弃全部手牌时不触发。",
  },
  {
    id: "zanshin",
    name: "残心",
    ownerCharId: "swordsman",
    cost: 0,
    cardType: "passive",
    targeting: "none",
    rarity: "rare",
    anim: "buff",
    effects: [],
    passive: {
      on: ["roundEnd", "cardDiscarded", "cardDrawn", "roundStart"],
      effects: [],
      effectsByTrigger: {
        roundEnd: [
          {
            type: "APPLY_STATUS",
            status: "zanshin",
            stacks: 1,
            duration: 1,
            target: "self",
            condition: "counterAtLeast",
            conditionCounter: "discardsThisRound",
            conditionValue: 3,
          },
        ],
        cardDiscarded: [
          { type: "APPLY_STATUS", status: "zanshinFocus", stacksFrom: "discardPileTens", setStacks: true, target: "self" },
        ],
        cardDrawn: [
          { type: "APPLY_STATUS", status: "zanshinFocus", stacksFrom: "discardPileTens", setStacks: true, target: "self" },
        ],
        roundStart: [
          { type: "APPLY_STATUS", status: "zanshinFocus", stacksFrom: "discardPileTens", setStacks: true, target: "self" },
        ],
      },
    },
    text: "被动：本回合丢弃至少 3 张牌时，下回合开始获得残心；残心生效时获得 1 点法力并抽 2 张牌。弃牌堆每满 10 张，暴击率 +10%。",
  },
  {
    id: "yachiyo",
    name: "八千代",
    ownerCharId: "swordsman",
    cost: 0,
    cardType: "passive",
    targeting: "none",
    rarity: "uncommon",
    anim: "buff",
    effects: [],
    passive: {
      on: ["roundStart", "cardDrawn"],
      effects: [{ type: "APPLY_STATUS", status: "yachiyo", stacks: 1, duration: 1, target: "self" }],
    },
    text: "被动：手牌少于 3 张时，攻击伤害 +20%；手牌仅剩 1 张时，攻击伤害 +40%。",
  },
];
