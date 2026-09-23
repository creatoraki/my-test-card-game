import type { ItemDef, RelicSpec } from "@/items/types";

/**
 * 野餐食谱专属的一次性遗物：只在本趟远征生效，以一次性物资的形式发放，远征结束后销毁、不能寄回。
 * ★ 不并入 BLESSING_RELIC_DEFS —— 否则会被随机祝福遗物池与遗物三选一抽到。
 */
const picnicRelic = (id: string, name: string, desc: string, mods: RelicSpec["mods"]): ItemDef => ({
  id,
  name,
  category: "relic",
  rarity: "common",
  desc: `${desc}（野餐所得，仅本趟远征有效）`,
  maxStack: 1,
  relic: { polarity: "blessing", scope: "battle", mods },
});

export const PICNIC_RELIC_DEFS: ItemDef[] = [
  picnicRelic("relic-picnic-soda", "快乐汽水", "全队先手 +1。", { flat: { initiative: 1 } }),
  picnicRelic("relic-picnic-afterglow", "聚会余温", "全队暴击率 +8%。", { flat: { critRate: 8 } }),
  picnicRelic("relic-picnic-calorie", "热量储备", "全队格挡率 +8%。", { flat: { blockRate: 8 } }),
  picnicRelic("relic-picnic-cloth", "团圆餐布", "全队命中率 +5%，闪避率 +5%。", { flat: { hitRate: 5, dodgeRate: 5 } }),
];
