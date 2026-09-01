// 剑士 · 功能卡与防御卡。设计口径见 design/卡牌设计/剑士/剑士新卡.md。
import type { CardDef } from "../../../engine/types";

export const SWORDSMAN_SUPPORT_CARDS: CardDef[] = [
  {
    id: "declutter",
    name: "断舍离",
    ownerCharId: "swordsman",
    cost: 2,
    cardType: "normal",
    targeting: "self",
    rarity: "rare",
    anim: "buff",
    effects: [
      { type: "DISCARD", amount: 1, discardPick: "handBottom" },
      { type: "DRAW", amount: 2 },
    ],
    text: "丢弃手牌最后一张，然后抽 2 张牌。",
  },
  {
    id: "rashomon",
    name: "罗生门",
    ownerCharId: "swordsman",
    cost: 1,
    cardType: "fast",
    targeting: "self",
    rarity: "uncommon",
    anim: "buff",
    effects: [
      { type: "DISCARD", amount: 1, discardPick: "handTop" },
      { type: "APPLY_STATUS", status: "rashomon", stacks: 1, duration: 1, target: "self" },
    ],
    text: "丢弃手牌第一张，获得持续 1 回合的罗生门：回合开始抽 1 张牌；受到攻击时消耗它，闪避这次攻击并抽 2 张牌。",
  },
  {
    id: "crane-dance",
    name: "鹤舞",
    ownerCharId: "swordsman",
    cost: 2,
    cardType: "normal",
    targeting: "ally",
    rarity: "uncommon",
    anim: "shield",
    effects: [
      { type: "GAIN_SHIELD", multiplier: 0.8, target: "primary" },
      { type: "MARK_CARDS", amount: 2, mark: "mindsEye", markPick: "handRandom" },
    ],
    text: "为一名队友获得 {0} 点护盾，然后随机使 2 张手牌获得心眼。",
  },
  {
    id: "whale-kite",
    name: "鲸鸢",
    ownerCharId: "swordsman",
    cost: 2,
    cardType: "fast",
    targeting: "self",
    rarity: "uncommon",
    anim: "shield",
    effects: [
      { type: "CONVERT_CARD_TYPE", convertPick: "handAllFast", convertTo: "normal" },
      // 护盾倍率完全来自转换张数：每转换 1 张 = 20% 治愈力。
      {
        type: "GAIN_SHIELD",
        multiplier: 0,
        bonusMultiplierFrom: "lastConvertBatch",
        bonusMultiplierPer: 0.2,
        target: "allAllies",
      },
    ],
    text: "将手牌中所有速攻牌转换为普通牌；每转换 1 张，全队获得 20% 治愈力的护盾。",
  },
];
