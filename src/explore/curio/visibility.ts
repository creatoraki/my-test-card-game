import { CORRIDOR_CURIOS, critterFoods } from "@/data/curios";
import type { CurioDef, CurioDecision, CurioLevel, OfferingPart } from "@/data/curios/types";
import { countByItemId } from "@/items/inventory";
import { matchOffering, partCanMatch } from "./offering";
import { curioAtLevel } from "./leveling";
import type { ExploreState } from "../types";
import { allowsCardRemoval } from "@/data/curios/rules/growthBalance";

function activeObject(s: ExploreState) {
  const id = s.corridor?.activeObjectId;
  return id ? s.corridor?.objects.find((object) => object.id === id) : undefined;
}

/** 喂养选项要用哪种食物：背包里第一种达到数量的对应食物；没有则为 null。 */
export function feedFoodFor(s: Pick<ExploreState, "backpack">, decision: CurioDecision): string | null {
  const feed = decision.feed;
  if (!feed) return null;
  return critterFoods(feed.critter).find((itemId) => countByItemId(s.backpack, itemId) >= feed.count) ?? null;
}

export function visibleDecisions(s: ExploreState, def: CurioDef): CurioDecision[] {
  return def.decisions.filter((decision) => {
    if (!allowsCardRemoval(s) && decision.effects.some(effect => effect.type === "FORGE_REMOVE")) return false;
    if (decision.feed) return Boolean(feedFoodFor(s, decision));
    return true;
  });
}

/** 功能性选物决策(熔合装备、升级遗物)：背包里凑得齐配方才可点。 */
export function canSelectFor(s: ExploreState, decision: CurioDecision): boolean {
  return Boolean(decision.select?.some((recipe) => recipeCanMatch(recipe, s.backpack)));
}

/** 选物面板只列出能用于该决策配方的物品。 */
export function selectableStacks(s: ExploreState, decision: CurioDecision): ExploreState["backpack"] {
  const parts = decision.select?.flat() ?? [];
  return s.backpack.filter((stack) => parts.some((part) => partCanMatch(part, stack)));
}

function recipeCanMatch(recipe: OfferingPart[], stacks: ExploreState["backpack"]): boolean {
  const total = recipe.reduce((sum, part) => sum + Math.max(0, part.count), 0);
  const candidates = stacks.filter((stack) => recipe.some((part) => partCanMatch(part, stack)));
  const walk = (index: number, picked: ExploreState["backpack"], amount: number): boolean => {
    if (amount === total) return matchOffering([recipe], picked);
    if (amount > total || index >= candidates.length) return false;
    if (walk(index + 1, picked, amount)) return true;
    const stack = candidates[index];
    const max = Math.min(stack.count, total - amount);
    for (let count = 1; count <= max; count += 1) {
      if (walk(index + 1, [...picked, { ...stack, count }], amount + count)) return true;
    }
    return false;
  };
  return total > 0 && walk(0, [], 0);
}

/** 当前打开的物件在其等级下的定义。 */
export function activeCurioDef(s: ExploreState): CurioDef | null {
  const object = activeObject(s);
  const def = object ? CORRIDOR_CURIOS[object.kind] : undefined;
  return object && def ? curioAtLevel(def, object.level) : null;
}

export function activeCurioLevel(s: ExploreState): CurioLevel {
  return activeObject(s)?.level ?? 1;
}
