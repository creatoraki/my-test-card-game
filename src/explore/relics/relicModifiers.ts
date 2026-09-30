import { getItemDef } from "@/data";
import { RULES } from "@/engine/core/battleRules";
import type { StatModifier } from "@/engine/types";
import { occupiedSlots } from "@/items/inventory";
import { canWalkCorridor } from "../corridor/corridorSession";
import type { ExploreState } from "../types";

// 以「被动读数」方式实现的遗物 —— 效果由各系统在需要时来这里查询, 不走探索事件分发。
const FOLDING_CRATE = "relic-folding-crate";
const EXPIRY_LABELER = "relic-expiry-labeler";
const RECYCLE_LIST = "relic-recycle-list";
const GLOW_STICKER = "relic-glow-sticker";
const EMERGENCY_BEACON = "relic-emergency-beacon";
const FLASHLIGHT = "relic-flashlight";
const CLING_FILM = "relic-cling-film";
const TASTING_COUPON = "relic-tasting-coupon";

/** 本文件负责实现的遗物 id, 供遗物目录一致性校验。 */
export const EXPLORE_MODIFIER_RELIC_IDS: readonly string[] = [
  FOLDING_CRATE,
  EXPIRY_LABELER,
  RECYCLE_LIST,
  GLOW_STICKER,
  EMERGENCY_BEACON,
  FLASHLIGHT,
  CLING_FILM,
  TASTING_COUPON,
];

export function hasExploreRelic(s: ExploreState, itemId: string): boolean {
  return s.backpack.some((stack) => stack.itemId === itemId && getItemDef(stack.itemId).category === "relic");
}

export function relicBurdenAdapt(s: ExploreState): number {
  return hasExploreRelic(s, FOLDING_CRATE) ? 5 : 0;
}

export function merchantExtraSlots(s: ExploreState): number {
  return hasExploreRelic(s, EXPIRY_LABELER) ? 2 : 0;
}

export function relicScrapSellBonus(s: ExploreState): number {
  return hasExploreRelic(s, RECYCLE_LIST) ? 0.1 : 0;
}

/** 读取背包现状的开战属性修正(夜光贴纸)。与声明式 relic.mods 一样每名角色各叠一份。 */
export function relicBattleMods(s: ExploreState): StatModifier[] {
  if (!hasExploreRelic(s, GLOW_STICKER)) return [];
  const free = RULES.burden.backpackSlots - occupiedSlots(s.backpack, getItemDef);
  const dodgeRate = Math.min(8, Math.floor(Math.max(0, free) / 3));
  return dodgeRate > 0 ? [{ flat: { dodgeRate } }] : [];
}

export function canUseBeacon(s: ExploreState): boolean {
  return hasExploreRelic(s, EMERGENCY_BEACON) && !s.beaconUsed && canWalkCorridor(s);
}

/** 手电筒: 可交互物失败率修正(与 CurioMitigation.chanceDelta 同口径, 0~1 小数)。 */
export function relicCurioFailDelta(s: ExploreState): number {
  return hasExploreRelic(s, FLASHLIGHT) ? -0.05 : 0;
}

/** 保鲜膜: 野餐时每份食材各自不被消耗的几率。 */
export function picnicKeepChance(s: ExploreState): number {
  return hasExploreRelic(s, CLING_FILM) ? 0.3 : 0;
}

/** 试吃券: 本趟在流浪货商的第一件商品免费, 用掉后由 consumeMerchantCoupon 置位。 */
export function merchantCouponActive(s: ExploreState): boolean {
  return hasExploreRelic(s, TASTING_COUPON) && !s.relicCounters.tastingCoupon;
}

export function consumeMerchantCoupon(s: ExploreState): void {
  s.relicCounters.tastingCoupon = 1;
  s.log.push("试吃券：这件商品免费");
}
