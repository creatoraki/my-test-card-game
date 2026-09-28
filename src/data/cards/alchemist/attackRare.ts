import type { CardDef } from "@/engine/types";

// 炼金术士稀有攻击牌。
export const ALCHEMIST_RARE_ATTACK_CARDS: CardDef[] = [
  {
    id: "phlogiston-blast",
    name: "燃素爆燃",
    ownerCharId: "alchemist",
    cost: 3,
    cardType: "normal",
    targeting: "none",
    rarity: "rare",
    anim: "fire",
    resonance: true,
    effects: [
      { type: "APPLY_STATUS", status: "burn", stacksFromStat: { stat: "attack", multiplier: 0.5 }, duration: 2, target: "allFoes" },
      { type: "APPLY_STATUS", status: "flammable", stacks: 1, duration: 1, durationFrom: { counter: "activeCardResonance" }, target: "allFoes" },
    ],
    text: "对所有敌人施加 {0} 层灼烧，持续 2 回合，并施加易燃 1 回合；共鸣：易燃持续 +1 回合。",
  },
  {
    id: "terminal-mixture",
    name: "终末合剂",
    ownerCharId: "alchemist",
    cost: 3,
    cardType: "normal",
    targeting: "none",
    rarity: "rare",
    exhaust: true,
    anim: "fire",
    effects: [
      { type: "RELEASE_SQUAD_BUFF", squadBuffPick: "all", amount: 3, target: "self" },
      { type: "APPLY_STATUS", status: "burn", stacksFromStat: { stat: "attack", multiplier: 0.4 }, duration: 2, target: "allFoes" },
    ],
    text: "消耗你持有的全部组装 BUFF（不触发组装成功），每种释放 3 次；然后对所有敌人施加 {1} 层灼烧，持续 2 回合。打出后消耗。",
  },
];
