import { defineRelics } from "../defineRelic";

// 精良档诅咒遗物。
export const FINE_CURSE_RELIC_DEFS = defineRelics("curse", "fine", [
  {
    id: "relic-hollow-core",
    name: "空腔核心",
    scope: "battle",
    desc: "每打出 3 张牌，全队获得 1 点污染。",
    on: "cardPlayed",
    every: 3,
    effects: [{ type: "GAIN_POLLUTION", target: "allAllies", amount: 1 }],
    purifyTo: { rarity: "fine" },
  },
]);
