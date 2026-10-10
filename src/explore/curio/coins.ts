// ============================================================================
// 钱币 —— 兑换台合成、游艺摊升级共用的币种阶梯与难度上限。
// 普通难度不出金币(mapDifficulty.curioPoolExcludes 含金币)，合成与升级都封顶到银币。
// ============================================================================

import { getItemDef, makeRolledItemStack } from "@/data";
import { COIN_EXCHANGES, COIN_LADDER, type CoinExchangeId } from "@/data/curios/rules/serviceBalance";
import { getMapDifficulty } from "@/data/maps/mapDifficulty";
import { RULES } from "@/engine/core/battleRules";
import { addToContainer, consumeItems, countByItemId } from "@/items/inventory";
import type { ExploreState } from "../types";

/** 当前难度是否禁止出现金币。 */
export function goldLocked(s: Pick<ExploreState, "difficulty">): boolean {
  return getMapDifficulty(s.difficulty).curioPoolExcludes.includes("gold-coin");
}

/** 当前难度下钱币能达到的最高一级在 COIN_LADDER 里的下标。 */
function topTier(s: Pick<ExploreState, "difficulty">): number {
  return goldLocked(s) ? COIN_LADDER.indexOf("silver-coin") : COIN_LADDER.length - 1;
}

/** 钱币升 steps 级后的 itemId，受难度上限约束；不是钱币则原样返回。 */
export function upgradeCoin(s: Pick<ExploreState, "difficulty">, itemId: string, steps: number): string {
  const index = COIN_LADDER.indexOf(itemId as (typeof COIN_LADDER)[number]);
  if (index < 0) return itemId;
  return COIN_LADDER[Math.min(topTier(s), index + steps)];
}

/** 押注只收还能升级的钱币。 */
export function canStakeCoin(s: Pick<ExploreState, "difficulty">, itemId: string): boolean {
  const index = COIN_LADDER.indexOf(itemId as (typeof COIN_LADDER)[number]);
  return index >= 0 && index < topTier(s);
}

/** 兑换不可用的原因；可兑换时返回 null。 */
export function coinExchangeReason(s: ExploreState, id: CoinExchangeId): string | null {
  const rule = COIN_EXCHANGES[id];
  if (rule.to === "gold-coin" && goldLocked(s)) return "当前难度无法合成金币";
  const have = countByItemId(s.backpack, rule.from);
  if (have < rule.give) return `${getItemDef(rule.from).name}不足 ${rule.give} 枚`;
  return null;
}

/** 背包里的钱币够不够兑换至少一次(兑换台入口用)。 */
export function anyCoinExchange(s: ExploreState): boolean {
  return (Object.keys(COIN_EXCHANGES) as CoinExchangeId[]).some((id) => !coinExchangeReason(s, id));
}

/** 兑换一次：先扣低阶币再放高阶币；兑换只会让格子变少，不会溢出。 */
export function exchangeCoins(s: ExploreState, id: CoinExchangeId): boolean {
  if (!s.coinExchangeOpen || s.phase !== "resolving" || coinExchangeReason(s, id)) return false;
  const rule = COIN_EXCHANGES[id];
  const paid = consumeItems(s.backpack, rule.from, rule.give);
  const made = Array.from({ length: rule.get }, () => makeRolledItemStack(s, rule.to, 1));
  const result = addToContainer(paid, made, (itemId) => getItemDef(itemId), RULES.burden.backpackSlots);
  if (result.overflow.length) return false;
  s.backpack = result.next;
  s.log.push(`钱币兑换：${getItemDef(rule.from).name} ×${rule.give} → ${getItemDef(rule.to).name} ×${rule.get}`);
  return true;
}
