import type { ItemDef, ItemRarity } from "@/items/types";
import { relicChannelOf } from "@/items/types";
import { RELIC_ITEM_DEFS } from "./catalog";

// ============================================================================
// 遗物池 —— 随机发放遗物的唯一入口。
// ★ 任何「随机给一件遗物」的逻辑都从这里取候选, 不要再对 BLESSING_RELIC_DEFS 自行筛选。
//   渠道限定的遗物(首领掉落 / 特殊事件 / 一次性)不进随机池, 由各自的投放点按 id 指名。
// ============================================================================

const isNormalBlessing = (def: ItemDef): boolean =>
  def.relic?.polarity === "blessing" && relicChannelOf(def.relic) === "normal";

/** 随机池: 普通渠道的祝福遗物。遗物匣、流浪货商、据点商店、通关奖励、圣水池净化、神龛升级共用。 */
export const RANDOM_RELIC_POOL = RELIC_ITEM_DEFS.filter(isNormalBlessing);

/** 一次性遗物匣的候选: 普通档的随机池遗物 + 一次性限定遗物。发放时实例带 disposable 标记。 */
export const TEMPORARY_RELIC_POOL = RELIC_ITEM_DEFS.filter(
  (def) =>
    (isNormalBlessing(def) && def.rarity === "common") ||
    (def.relic !== undefined && relicChannelOf(def.relic) === "disposable"),
);

/** 随机池按稀有度收窄; 不传稀有度即整池。 */
export function randomRelicPool(rarity?: ItemRarity): ItemDef[] {
  return rarity ? RANDOM_RELIC_POOL.filter((def) => def.rarity === rarity) : RANDOM_RELIC_POOL;
}
