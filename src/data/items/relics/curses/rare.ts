import { defineRelics } from "../defineRelic";

// 稀有档诅咒遗物。
export const RARE_CURSE_RELIC_DEFS = defineRelics("curse", "rare", [
  {
    id: "relic-heavy-shadow",
    name: "沉影锚",
    scope: "explore",
    desc: "每场战斗胜利后额外损失 4 点净化粒子。",
    on: "battleVictory",
    effects: [{ type: "GAIN_RESOURCE", resource: "energy", amount: -4 }],
    purifyTo: { rarity: "rare" },
  },
  {
    id: "relic-bleeding-sigil",
    name: "渗血刻印",
    scope: "battle",
    desc: "每两次受到敌方攻击，全队失去 2 点生命。",
    on: "allyAttacked",
    every: 2,
    effects: [{ type: "LOSE_HP", target: "allAllies", amount: 2 }],
    purifyTo: { rarity: "rare" },
  },
]);
