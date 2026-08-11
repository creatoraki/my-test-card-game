// 卡牌定义。
// ★ 攻击牌用 multiplier(攻击力倍率), 不写死点数 —— 剑士攻击力 20, 故 1.0 倍 ≈ 20 点。
//   1 费标准攻击牌以 1.0 倍为中心(0.7~1.2); 低倍率换控制/防护/资源, 高倍率必须付代价。
//   只有"固定伤害"才用 amount —— 那类伤害不吃攻击力, 也不吃目标的防御与格挡。
// 护盾/治疗可写固定 amount, 也可写治愈力倍率 multiplier, 二选一; 强度在 ops 里结算。
// 基础卡为 1 费资源曲线底盘, rarity=basic, 不进入抽卡池也不计入稀有度限携。
// text 支持 {0}、{1} 等效果数值占位符；{d0} 对应 onDiscard.effects[0]。

import type { CardDef } from "../engine/types";
import { makeBasicCardDefs } from "./basicCards";

export const CARD_DEFS: CardDef[] = [
  ...makeBasicCardDefs("swordsman"),
  ...makeBasicCardDefs("prophet"),
  ...makeBasicCardDefs("botanist"),

  // ---- 剑士专属抽卡池 · 普通(见 CharacterDef.pools) ----
  {
    id: "snowflake",
    name: "雪花",
    ownerCharId: "swordsman",
    cost: 1,
    cardType: "normal",
    targeting: "foe",
    rarity: "common",
    anim: "ice",
    effects: [{ type: "DAMAGE", multiplier: 1.0, target: "primary", hitBonus: 10 }],
    onDiscard: { mode: "useSelf", autoTarget: "randomFoe" },
    text: "造成 {0} 点伤害。被丢弃时自动对随机敌人使用。",
  },
  {
    id: "buzz",
    name: "蜂鸣",
    ownerCharId: "swordsman",
    cost: 1,
    cardType: "fast",
    targeting: "foe",
    rarity: "common",
    anim: "slash",
    effects: [
      { type: "DAMAGE", multiplier: 0.9, target: "primary" },
      { type: "DISCARD", amount: 1, discardPick: "handBottom" },
    ],
    text: "造成 {0} 点伤害，然后丢弃手牌最后一张。不推进时刻。",
  },

  // ---- 剑士专属抽卡池 · 稀有 ----
  {
    id: "swarm",
    name: "蜂群",
    ownerCharId: "swordsman",
    cost: 2,
    cardType: "normal",
    targeting: "foe",
    rarity: "rare",
    anim: "shot",
    effects: [
      {
        type: "DAMAGE",
        multiplier: 0.6,
        hits: 3,
        bonusHitsFrom: "discardsThisRound",
        target: "primary",
      },
    ],
    text: "对一名敌人造成 3 段 {0} 点伤害；本回合每丢弃过 1 张手牌，额外造成 1 段。",
  },

];
