import { defineRelics } from "../defineRelic";

// 普通档诅咒遗物。
export const COMMON_CURSE_RELIC_DEFS = defineRelics("curse", "common", [
  {
    id: "relic-broken-compass",
    name: "断针罗盘",
    scope: "explore",
    desc: "每抵达一个节点，额外损失 2 点净化粒子。",
    on: "nodeArrived",
    effects: [{ type: "GAIN_RESOURCE", resource: "energy", amount: -2 }],
    purifyTo: { rarity: "common" },
  },
  {
    id: "relic-static-parasite",
    name: "静电寄生体",
    scope: "battle",
    desc: "全队命中率 −10%。",
    mods: { flat: { hitRate: -10 } },
    purifyTo: { rarity: "common" },
  },
]);
