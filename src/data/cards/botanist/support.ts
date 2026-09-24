import type { CardDef } from "@/engine/types";

// 愈 —— 治疗 / 护盾 / 嘲讽: 支援队友, 多数通过培育成长。
export const BOTANIST_SUPPORT_CARDS: CardDef[] = [
  {
    id: "cactus-armor",
    name: "仙人掌护甲",
    ownerCharId: "botanist",
    cost: 1,
    cardType: "normal",
    targeting: "ally",
    rarity: "uncommon",
    anim: "shield",
    effects: [{ type: "GAIN_SHIELD", multiplier: 0.5, target: "primary" }],
    cultivate: {
      turns: 1,
      effects: [{ type: "APPLY_STATUS", status: "cactusCounterattack", stacks: 1, duration: 2, target: "primary" }],
      overripe: {
        effects: [
          { type: "GAIN_SHIELD", multiplier: 0.3, target: "primary" },
          { type: "DAMAGE", multiplier: 0.3, target: "allFoes" },
        ],
      },
    },
    text: "为一名队友附加 {0} 点护盾。培育 {c}：附加仙人掌，持续 2 回合。过熟：附加 {o0} 点护盾，并对所有敌人造成 30% 伤害。",
  },
  {
    id: "guiding-crown",
    name: "引路棘冠",
    ownerCharId: "botanist",
    cost: 1,
    cardType: "normal",
    targeting: "ally",
    rarity: "common",
    anim: "buff",
    effects: [{ type: "APPLY_STATUS", status: "taunt", stacks: 1, duration: 1, target: "primary" }],
    cultivate: {
      turns: 1,
      effects: [{ type: "APPLY_STATUS", status: "thornCrown", stacks: 1, duration: 1, target: "primary" }],
      overripe: {
        effects: [
          { type: "APPLY_STATUS", status: "taunt", stacks: 1, duration: 1, target: "primary" },
          { type: "GAIN_SHIELD", multiplier: 0.4, target: "primary" },
        ],
      },
    },
    text: "目标获得嘲讽，持续 1 回合。培育 {c}：目标受到攻击时，为攻击者附加棘冠穿孔。过熟：目标获得嘲讽，并获得 {o1} 点护盾。",
  },
  {
    id: "agave",
    name: "龙舌兰",
    ownerCharId: "botanist",
    cost: 2,
    cardType: "normal",
    targeting: "ally",
    rarity: "common",
    anim: "heal",
    effects: [{ type: "HEAL", multiplier: 0.8, target: "primary" }],
    cultivate: {
      turns: 1,
      effects: [{ type: "APPLY_STATUS", status: "tequila", stacks: 1, duration: 1, target: "primary" }],
      overripe: {
        effects: [
          { type: "HEAL", multiplier: 0.4, target: "primary" },
          { type: "APPLY_STATUS", status: "agaveBloom", stacks: 1, duration: 1, target: "allAllies" },
        ],
      },
    },
    text: "为一名队友恢复 {0} 点生命。培育 {c}：目标攻击力 +20%，持续 1 回合。过熟：恢复 {o0} 点生命，全队获得龙舌花信。",
  },
  {
    id: "purify-nectar",
    name: "净化甘露",
    ownerCharId: "botanist",
    cost: 2,
    cardType: "normal",
    targeting: "ally",
    rarity: "common",
    anim: "heal",
    effects: [
      { type: "REMOVE_STATUS", statusKind: "debuff", target: "primary" },
      { type: "HEAL", multiplier: 0.4, target: "primary" },
    ],
    cultivate: {
      turns: 1,
      effects: [{ type: "APPLY_STATUS", status: "debuffImmune", stacks: 1, duration: 1, target: "primary" }],
      overripe: {
        effects: [
          { type: "REMOVE_STATUS", statusKind: "debuff", target: "primary" },
          { type: "TRANSFER_DEBUFFS", target: "primary" },
        ],
      },
    },
    text: "移除目标所有负面状态并恢复 {1} 点生命。培育 {c}：目标免疫负面状态 1 回合。过熟：不治疗，将移除的负面状态转移给一名随机敌人，持续 1 回合。",
  },
];
