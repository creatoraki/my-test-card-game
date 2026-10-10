import type { ItemDef, ItemRarity } from "@/items/types";
import { relicChannelOf } from "@/items/types";
import { RELIC_ITEM_DEFS } from "./catalog";

// ============================================================================
// 遗物池 —— 随机发放遗物的唯一入口。
// ★ 任何「随机给一件遗物」的逻辑都从这里取候选, 不要再对 BLESSING_RELIC_DEFS 自行筛选。
//   渠道限定的遗物(首领掉落 / 特殊事件 / 野餐)不进随机池, 由各自的投放点按 id 指名;
//   祝福匣限定的遗物只进临时遗物池。
// ============================================================================

const isNormalBlessing = (def: ItemDef): boolean =>
  def.relic?.polarity === "blessing" && relicChannelOf(def.relic) === "normal";

const isChannel = (def: ItemDef, channel: "picnic" | "blessingBox"): boolean =>
  def.relic !== undefined && relicChannelOf(def.relic) === channel;

/** 随机池: 普通渠道的祝福遗物。遗物匣、流浪货商、据点商店、通关奖励、圣水池净化、神龛升级共用。 */
export const RANDOM_RELIC_POOL = RELIC_ITEM_DEFS.filter(isNormalBlessing);

/**
 * 临时遗物池(起程祈愿龛专用): 普通档的随机池遗物 + 祝福匣限定遗物。发放时实例带 disposable 标记。
 * ⚠ 野餐限定遗物不在其中 —— 两种一次性来源互不相通。
 */
export const TEMPORARY_RELIC_POOL = RELIC_ITEM_DEFS.filter(
  (def) => (isNormalBlessing(def) && def.rarity === "common") || isChannel(def, "blessingBox"),
);

/** 野餐限定遗物的 id: 只由野餐食谱指名。 */
export const PICNIC_RELIC_IDS: readonly string[] = RELIC_ITEM_DEFS.filter((def) => isChannel(def, "picnic")).map(
  (def) => def.id,
);

/** 随机池按稀有度收窄; 不传稀有度即整池。 */
export function randomRelicPool(rarity?: ItemRarity): ItemDef[] {
  return rarity ? RANDOM_RELIC_POOL.filter((def) => def.rarity === rarity) : RANDOM_RELIC_POOL;
}
