import { matchPicnicRecipe, NEAR_EXPIRY_FOOD_IDS } from "../data";
import { consumeItems, countByItemId } from "../items/inventory";
import type { ExploreState } from "./types";
import { applyEffect, logLine } from "./session";
import { EXPLORE_RULES } from "./rules";

const FOOD_ID_SET = new Set<string>(NEAR_EXPIRY_FOOD_IDS);

/** 野餐只在没有浮层的待决策相开放。 */
export function canPicnic(s: ExploreState): boolean {
  return s.phase === "choosingEntry" || s.phase === "atNode";
}

/** 合并背包中跨堆的六种临期食品。 */
export function picnicFoods(s: ExploreState): { itemId: string; count: number }[] {
  return NEAR_EXPIRY_FOOD_IDS.flatMap((itemId) => {
    const count = countByItemId(s.backpack, itemId);
    return count > 0 ? [{ itemId, count }] : [];
  });
}

export interface PicnicResult {
  recipeId: string | null;
  recipeName: string | null;
  story: string;
  notes: string[];
}

function validPicks(s: ExploreState, picks: Record<string, number>): boolean {
  const entries = Object.entries(picks);
  const total = entries.reduce((sum, [, count]) => sum + count, 0);
  if (total < 0 || total > EXPLORE_RULES.picnic.maxFoods) return false;
  return entries.every(([itemId, count]) => {
    if (!FOOD_ID_SET.has(itemId) || !Number.isInteger(count) || count < 0) return false;
    return count <= countByItemId(s.backpack, itemId);
  });
}

function recoverPartyLimit(s: ExploreState, amount: number): void {
  for (const member of s.party) {
    if (!member.alive) continue;
    const beforeLimit = member.hpLimit;
    member.hpLimit = Math.min(member.maxHp, member.hpLimit + amount);
    member.hp = Math.min(member.hpLimit, member.hp + member.hpLimit - beforeLimit);
  }
}

/** 校验、扣除食品并结算隐藏食谱或兜底恢复。 */
export function resolvePicnic(s: ExploreState, picks: Record<string, number>): PicnicResult | null {
  if (!canPicnic(s) || s.picnicUsed || !validPicks(s, picks)) return null;

  const counts = Object.fromEntries(
    Object.entries(picks).filter(([, count]) => count > 0),
  ) as Record<string, number>;
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
  for (const [itemId, count] of Object.entries(counts)) {
    s.backpack = consumeItems(s.backpack, itemId, count);
  }

  const recipe = matchPicnicRecipe(counts);
  let result: PicnicResult;
  if (recipe) {
    result = {
      recipeId: recipe.id,
      recipeName: recipe.name,
      story: recipe.story,
      notes: [applyEffect(s, { type: "GRANT_RANDOM_RELIC" })],
    };
  } else if (total > 0) {
    const amount = EXPLORE_RULES.picnic.limitPerFood * total;
    recoverPartyLimit(s, amount);
    result = {
      recipeId: null,
      recipeName: null,
      story: "食物没有拼成特别的组合，但热量足够让队伍撑住接下来的路。",
      notes: [`全队体力极限 +${amount}，当前生命回复等值`],
    };
  } else {
    for (const member of s.party) {
      if (!member.alive) continue;
      member.hp = Math.min(member.hpLimit, member.hp + EXPLORE_RULES.picnic.emptyHeal);
    }
    result = {
      recipeId: null,
      recipeName: null,
      story: "空着肚子坐了一会儿，队伍的状态反而缓了过来。",
      notes: [`全队回复 ${EXPLORE_RULES.picnic.emptyHeal} 点生命`],
    };
  }

  s.picnicUsed = true;
  logLine(s, recipe ? "完成野餐，祝福遗物已进入待拾取框" : "完成野餐，队伍恢复了状态");
  return result;
}
