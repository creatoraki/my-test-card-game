import type { CardDef } from "../../../engine/types";

export const ALCHEMIST_DEFENSE_CARDS: CardDef[] = [
  {
    id: "jade-plating",
    name: "翠玉镀层",
    ownerCharId: "alchemist",
    cost: 1,
    cardType: "fast",
    targeting: "self",
    rarity: "common",
    anim: "shield",
    resonance: true,
    effects: [
      { type: "GAIN_SHIELD", multiplier: 0.35, bonusMultiplierFrom: "activeCardResonance", bonusMultiplierPer: 0.1, target: "self" },
      { type: "GAIN_SQUAD_BUFF", squadBuff: "assembleB", target: "self" },
    ],
    text: "获得 {0} 点护盾；共鸣：护盾倍率 +10%；组装 B。",
  },
  {
    id: "retort-wall",
    name: "反应釜壁",
    ownerCharId: "alchemist",
    cost: 2,
    cardType: "normal",
    targeting: "none",
    rarity: "uncommon",
    anim: "shield",
    effects: [
      { type: "GAIN_SHIELD", multiplier: 0.8, target: "allAllies" },
      { type: "APPLY_STATUS", status: "retortWall", stacks: 1, statusDataFrom: { key: "poisonStacks", stat: "attack", multiplier: 0.15 }, target: "allAllies" },
      { type: "GAIN_SQUAD_BUFF", squadBuff: "assembleD", target: "self" },
    ],
    text: "全队获得 {0} 点护盾；护盾存在期间队伍每受到 1 次攻击，使攻击者中毒；组装 D。",
  },
  {
    id: "dissolve-double",
    name: "溶解替身",
    ownerCharId: "alchemist",
    cost: 2,
    cardType: "fast",
    targeting: "ally",
    rarity: "uncommon",
    anim: "shield",
    effects: [
      { type: "REMOVE_STATUS", statusKind: "debuff", target: "primary" },
      { type: "GAIN_SHIELD", multiplier: 0.25, scaleByCounter: { counter: "lastRemovedStatusCount", min: 1 }, target: "allAllies" },
      { type: "GAIN_SQUAD_BUFF", squadBuff: "assembleA", target: "self" },
    ],
    text: "移除一名队友的全部负面状态；每移除 1 个，全队获得 25% 治愈力的护盾；即使没有移除状态也获得 1 次护盾；组装 A。",
  },
];
