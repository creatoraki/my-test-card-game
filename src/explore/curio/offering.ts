import { getItemDef, getItemFamily } from "@/data";
import { findByUid } from "@/items/inventory";
import type { ItemStack } from "@/items/types";
import type { ExploreState } from "../types";
import type { OfferingPart } from "@/data/curios/types";

export interface OfferingPick {
  uid: string;
  count: number;
}

function partMatches(part: OfferingPart, stack: ItemStack): boolean {
  const def = getItemDef(stack.itemId);
  const match = part.match;
  if (match.itemIds?.length && !match.itemIds.includes(stack.itemId)) return false;
  if (match.familyId && def.familyId !== match.familyId) return false;
  if (match.category && def.category !== match.category) return false;
  if (match.relicPolarity && def.relic?.polarity !== match.relicPolarity) return false;
  return true;
}

function normalizedStacks(stacks: ItemStack[]): ItemStack[] {
  return stacks
    .filter((stack) => Number.isInteger(stack.count) && stack.count > 0)
    .map((stack) => ({ ...stack }));
}

/** 多重集合完全匹配：每个背包堆只能被一部分配方占用，且不能多放或少放。 */
export function matchOffering(recipes: OfferingPart[][], stacks: ItemStack[]): boolean {
  const selected = normalizedStacks(stacks);
  const total = selected.reduce((sum, stack) => sum + stack.count, 0);
  for (const recipe of recipes) {
    const required = recipe.reduce((sum, part) => sum + Math.max(0, part.count), 0);
    if (required !== total) continue;
    const used = new Set<number>();
    const assign = (partIndex: number): boolean => {
      if (partIndex >= recipe.length) return true;
      const part = recipe[partIndex];
      for (let index = 0; index < selected.length; index += 1) {
        if (used.has(index) || !partMatches(part, selected[index])) continue;
        used.add(index);
        if (selected[index].count === part.count && assign(partIndex + 1)) return true;
        used.delete(index);
      }
      return false;
    };
    if (assign(0)) return true;
  }
  return false;
}

export function validOfferingPicks(s: ExploreState, picks: OfferingPick[]): ItemStack[] | null {
  if (!picks.length) return null;
  const seen = new Set<string>();
  const out: ItemStack[] = [];
  for (const pick of picks) {
    if (seen.has(pick.uid) || !Number.isInteger(pick.count) || pick.count <= 0) return null;
    const stack = findByUid(s.backpack, pick.uid);
    if (!stack || pick.count > stack.count) return null;
    seen.add(pick.uid);
    out.push({ ...stack, count: pick.count });
  }
  return out;
}

/** 按 uid+数量从背包取出，调用前应先用 validOfferingPicks 校验。 */
export function takeOfferedStacks(s: ExploreState, picks: OfferingPick[]): ItemStack[] {
  const valid = validOfferingPicks(s, picks);
  if (!valid) return [];
  for (const pick of picks) {
    const stack = findByUid(s.backpack, pick.uid);
    if (!stack) return [];
    if (pick.count === stack.count) {
      s.backpack = s.backpack.filter((item) => item.uid !== pick.uid);
    } else {
      s.backpack = s.backpack.map((item) =>
        item.uid === pick.uid ? { ...item, count: item.count - pick.count } : item,
      );
    }
  }
  return valid;
}

export function partCanMatch(part: OfferingPart, stack: ItemStack): boolean {
  // 导出给放入面板筛选可见物品，保持筛选和最终校验共用同一匹配规则。
  return partMatches(part, stack);
}

export function itemFamilyOf(stack: ItemStack): string | undefined {
  const def = getItemDef(stack.itemId);
  if (!def.familyId) return undefined;
  // 触发数据 getter，避免错误的家族 id 在界面选择时静默失效。
  getItemFamily(def.familyId);
  return def.familyId;
}
