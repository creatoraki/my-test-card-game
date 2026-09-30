import { defineRelics } from "../defineRelic";

// 野餐限定(普通档): 只由野餐食谱按 id 指名(data/facilities/picnicRecipes.ts), 不进任何随机池。
export const PICNIC_BLESSING_RELIC_DEFS = defineRelics("blessing", "common", [
  {
    id: "relic-picnic-soda",
    name: "快乐汽水",
    scope: "battle",
    channel: "picnic",
    desc: "全队先手 +1。",
    mods: { flat: { initiative: 1 } },
  },
  {
    id: "relic-picnic-afterglow",
    name: "聚会余温",
    scope: "battle",
    channel: "picnic",
    desc: "全队暴击率 +8%。",
    mods: { flat: { critRate: 8 } },
  },
  {
    id: "relic-picnic-calorie",
    name: "热量储备",
    scope: "battle",
    channel: "picnic",
    desc: "全队格挡率 +8%。",
    mods: { flat: { blockRate: 8 } },
  },
  {
    id: "relic-picnic-cloth",
    name: "团圆餐布",
    scope: "battle",
    channel: "picnic",
    desc: "全队命中率 +5%，闪避率 +5%。",
    mods: { flat: { hitRate: 5, dodgeRate: 5 } },
  },
]);
