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
];
