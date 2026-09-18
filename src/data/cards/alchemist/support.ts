import type { CardDef } from "../../../engine/types";

export const ALCHEMIST_SUPPORT_CARDS: CardDef[] = [
  {
    id: "universal-component",
    name: "万能配件",
    ownerCharId: "alchemist",
    cost: 2,
    cardType: "fast",
    targeting: "none",
    rarity: "common",
    anim: "buff",
    effects: [
      { type: "DRAW", amount: 1 },
      { type: "GAIN_SQUAD_BUFF", squadBuffPick: "choose" },
    ],
    text: "抽 1 张牌；选择 1 种组装词条并获得对应 BUFF。",
  },
  {
    id: "reverse-disassembly",
    name: "逆向拆解",
    ownerCharId: "alchemist",
    cost: 1,
    cardType: "fast",
    targeting: "none",
    rarity: "common",
    anim: "buff",
    effects: [
      { type: "REMOVE_SQUAD_BUFF", squadBuffPick: "choose" },
      { type: "GAIN_SHIELD", multiplier: 0.3, target: "allAllies" },
      { type: "DRAW", amount: 1 },
    ],
    text: "选择并移除 1 个已拥有的组装 BUFF；全队获得 {1} 点护盾；抽 1 张牌。",
  },
  {
    id: "resonance-tuning",
    name: "共振调谐",
    ownerCharId: "alchemist",
    cost: 2,
    cardType: "normal",
    targeting: "none",
    rarity: "rare",
    anim: "buff",
    effects: [
      { type: "RESONATE", amount: 2, resonatePick: "handAll" },
      { type: "GAIN_SQUAD_BUFF", squadBuff: "assembleC", target: "self" },
    ],
    text: "手牌中所有共鸣卡获得 2 次共鸣强化（无视费用限制）；组装 C。",
  },
];
