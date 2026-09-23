import { getItemDef, makeItemStack, matchPicnicRecipe, NEAR_EXPIRY_FOOD_IDS } from "../data";
import type { PicnicReward } from "../data/picnicRecipes";
import { consumeItems, countByItemId } from "../items/inventory";
import type { ExploreState } from "./types";
import { logLine } from "./session";
import { EXPLORE_RULES } from "./rules";
import { fireExploreRelic } from "./relics";

const FOOD_ID_SET = new Set<string>(NEAR_EXPIRY_FOOD_IDS);

/** 野餐只在没有浮层的待决策相开放。 */
export function canPicnic(s: ExploreState): boolean {
  return s.phase === "atNode";
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

/** 食谱奖励：体力极限回复(上限 picnic.recipeLimitMax)或一次性遗物(远征结束销毁、不能寄回)。 */
function grantRecipeReward(s: ExploreState, reward: PicnicReward): string {
  if (reward.kind === "limit") {
    const amount = Math.min(EXPLORE_RULES.picnic.recipeLimitMax, reward.amount);
    recoverPartyLimit(s, amount);
    return `全队体力极限 +${amount}，当前生命回复等值`;
  }
  const def = getItemDef(reward.relicId);
  s.pendingPickup = [...s.pendingPickup, makeItemStack(reward.relicId, 1, { disposable: true })];
  return `获得一次性遗物「${def.name}」，已放入待拾取框`;
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
      notes: [grantRecipeReward(s, recipe.reward)],
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

  // 野餐遗物的结算文案同时写进结果面板, 让玩家当场看到。
  const relicLogStart = s.log.length;
  fireExploreRelic(s, { type: "picnic" });
  result.notes.push(...s.log.slice(relicLogStart));

  s.picnicUsed = true;
  logLine(s, recipe ? `完成野餐，发现食谱「${recipe.name}」` : "完成野餐，队伍恢复了状态");
  return result;
}
