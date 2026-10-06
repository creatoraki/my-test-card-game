import type { CardDef } from "@/engine/types";
import { HEXER_ID } from "./gates";

// 咒术师 · 稀有仪式卡: 给自己挂整场 / 整回合的规则改写。
export const HEXER_RITUAL_CARDS: CardDef[] = [
  {
    id: "hex-oath",
    name: "咒誓",
    ownerCharId: HEXER_ID,
    cost: 2,
    cardType: "normal",
    targeting: "self",
    rarity: "rare",
    anim: "buff",
    exhaust: true,
    effects: [
      { type: "GAIN_ENEMY_AP", amount: 1, target: "allFoes" },
      { type: "APPLY_STATUS", status: "hexOath", stacks: 1, target: "self" },
    ],
    text: "所有敌人各获得 1 点行动点。本场战斗获得咒誓。打出后消耗。",
  },
  {
    id: "witching-hour",
    name: "逢魔时刻",
    ownerCharId: HEXER_ID,
    cost: 0,
    cardType: "fast",
    targeting: "self",
    rarity: "rare",
    anim: "buff",
    exhaust: true,
    effects: [{ type: "APPLY_STATUS", status: "witching", stacks: 1, target: "self" }],
    text: "本回合获得逢魔。打出后消耗。",
  },
];
