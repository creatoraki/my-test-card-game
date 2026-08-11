// 卡牌定义。
// ★ 攻击牌用 multiplier(攻击力倍率), 不写死点数 —— 剑士攻击力 20, 故 1.0 倍 ≈ 20 点。
//   1 费标准攻击牌以 1.0 倍为中心(0.7~1.2); 低倍率换控制/防护/资源, 高倍率必须付代价。
//   只有"固定伤害"才用 amount —— 那类伤害不吃攻击力, 也不吃目标的防御与格挡。
// 护盾/治疗仍写基础值, 护盾强度与治愈力/治愈强度在 ops 里按施法者结算。

import type { CardDef } from "../engine/types";

export const CARD_DEFS: CardDef[] = [
  {
    id: "whirlwind-slash",
    name: "回旋斩",
    ownerCharId: "swordsman",
    cost: 2,
    cardType: "normal",
    targeting: "foe",
    rarity: "common",
    anim: "slash",
    effects: [{ type: "DAMAGE", multiplier: 0.6, target: "allFoes" }],
    text: "选择一名敌人确认施放，回旋挥剑后对所有敌人造成 60% 攻击力的伤害。",
  },
  {
    id: "lightning-infused",
    name: "雷灌",
    ownerCharId: "swordsman",
    cost: 1,
    cardType: "normal",
    targeting: "foe",
    rarity: "common",
    anim: "lightning",
    effects: [{ type: "DAMAGE", multiplier: 1.0, target: "primary" }],
    text: "选择一名敌人，降下雷击造成 100% 攻击力的伤害。",
  },
  {
    id: "sky-rend",
    name: "裂空",
    ownerCharId: "swordsman",
    cost: 2,
    cardType: "normal",
    targeting: "foe",
    rarity: "common",
    anim: "iai-slash",
    effects: [{ type: "DAMAGE", multiplier: 1.7, target: "primary" }],
    text: "选择一名敌人，挥出裂空一斩造成 170% 攻击力的伤害。",
  },

  // ---- 剑士专属抽卡池 · 普通(见 CharacterDef.pools) ----
  {
    id: "quick-slash",
    name: "疾刺",
    ownerCharId: "swordsman",
    cost: 0,
    cardType: "fast",
    targeting: "foe",
    rarity: "common",
    anim: "slash",
    effects: [{ type: "DAMAGE", multiplier: 0.35, target: "primary" }],
    text: "选择一名敌人，闪身疾刺造成 35% 攻击力的伤害。不推进时刻。",
  },
  {
    id: "guard-stance",
    name: "铁壁架势",
    ownerCharId: "swordsman",
    cost: 1,
    cardType: "normal",
    targeting: "self",
    rarity: "common",
    anim: "shield",
    effects: [{ type: "GAIN_SHIELD", amount: 12, target: "self" }],
    text: "摆出铁壁架势，获得 12 点护盾。",
  },
  {
    id: "shield-bash",
    name: "盾击",
    ownerCharId: "swordsman",
    cost: 1,
    cardType: "normal",
    targeting: "foe",
    rarity: "common",
    anim: "slash",
    effects: [
      { type: "DAMAGE", multiplier: 0.5, target: "primary" },
      { type: "GAIN_SHIELD", amount: 7, target: "self" },
    ],
    text: "选择一名敌人，盾面猛击造成 50% 攻击力的伤害，并为自己获得 7 点护盾。",
  },
  {
    id: "battle-cry",
    name: "战吼",
    ownerCharId: "swordsman",
    cost: 1,
    cardType: "fast",
    targeting: "self",
    rarity: "common",
    anim: "buff",
    effects: [
      { type: "APPLY_STATUS", status: "strength", stacks: 2, target: "self" },
      { type: "APPLY_STAT_MOD", stat: "precision", amount: 10, target: "self" },
    ],
    text: "发出震慑战吼，获得 2 层力量，本场战斗内精准 +10。不推进时刻。",
  },
  {
    id: "second-wind",
    name: "回气",
    ownerCharId: "swordsman",
    cost: 1,
    cardType: "normal",
    targeting: "self",
    rarity: "common",
    anim: "heal",
    exhaust: true,
    effects: [
      { type: "HEAL", amount: 8, target: "self" },
      { type: "DRAW", amount: 1 },
    ],
    text: "调匀呼吸回复 8 点生命（受治愈力影响），并抽 1 张牌。打出后本场移除。",
  },
  {
    id: "heavy-cleave",
    name: "破军斩",
    ownerCharId: "swordsman",
    cost: 3,
    cardType: "normal",
    targeting: "foe",
    rarity: "common",
    anim: "sword-fall",
    effects: [{ type: "DAMAGE", multiplier: 1.1, target: "allFoes" }],
    text: "选择一名敌人确认施放，全力横扫对所有敌人造成 110% 攻击力的伤害。",
  },

  // ---- 剑士专属抽卡池 · 罕见 ----
  // ⚠ 占位内容: 卡组等级要摇到罕见/稀有档才有东西可抽, 先各补几张能跑通系统的卡,
  //   正式卡牌设计另起。
  {
    id: "focused-edge",
    name: "凝锋",
    ownerCharId: "swordsman",
    cost: 1,
    cardType: "fast",
    targeting: "self",
    rarity: "uncommon",
    anim: "buff",
    effects: [
      { type: "APPLY_STAT_MOD", stat: "critRate", amount: 20, target: "self" },
      { type: "APPLY_STAT_MOD", stat: "critDamage", amount: 30, target: "self" },
    ],
    text: "屏息凝锋，本场战斗内暴击率 +20、爆伤 +30。不推进时刻。",
  },
  {
    id: "riposte-stance",
    name: "格挡反击",
    ownerCharId: "swordsman",
    cost: 2,
    cardType: "normal",
    targeting: "self",
    rarity: "uncommon",
    anim: "shield",
    effects: [
      { type: "GAIN_SHIELD", amount: 10, target: "self" },
      { type: "APPLY_STAT_MOD", stat: "blockRate", amount: 25, target: "self" },
      { type: "APPLY_STATUS", status: "thorns", stacks: 4, target: "self" },
    ],
    text: "架起反击姿态：获得 10 点护盾、4 层荆棘，本场战斗内格挡 +25。",
  },

  // ---- 剑士专属抽卡池 · 稀有 ----
  {
    id: "executioner",
    name: "断罪",
    ownerCharId: "swordsman",
    cost: 3,
    cardType: "normal",
    targeting: "foe",
    rarity: "rare",
    anim: "sword-fall",
    exhaust: true,
    effects: [
      { type: "DAMAGE", multiplier: 2.6, target: "primary", flags: ["mustHit"] },
      { type: "APPLY_STATUS", status: "vulnerable", stacks: 2, target: "primary" },
    ],
    text: "必中的断罪一击，造成 260% 攻击力的伤害并施加 2 层易伤。打出后本场移除。",
  },

  // ---- 预言家初始卡 ----
  // ⚠ 占位内容: 初始卡组是 5 张同名的「基础攻击」(卡面用占位素材), 专属卡牌与抽卡池设计另起。
  {
    id: "prophet-basic-attack",
    name: "基础攻击",
    ownerCharId: "prophet",
    cost: 1,
    cardType: "normal",
    targeting: "foe",
    rarity: "common",
    anim: "slash",
    effects: [{ type: "DAMAGE", multiplier: 1.0, target: "primary" }],
    text: "选择一名敌人，挥出一击造成 100% 攻击力的伤害。",
  },

  // ---- 植物学家初始卡 ----
  // ⚠ 占位内容: 初始卡组是 5 张同名的「普通攻击」(卡面用占位素材), 专属卡牌与抽卡池设计另起。
  {
    id: "botanist-basic-attack",
    name: "普通攻击",
    ownerCharId: "botanist",
    cost: 1,
    cardType: "normal",
    targeting: "foe",
    rarity: "common",
    anim: "slash",
    effects: [{ type: "DAMAGE", multiplier: 1.0, target: "primary" }],
    text: "选择一名敌人，挥出一击造成 100% 攻击力的伤害。",
  },
];
