// ============================================================================
// 物品折算服务 —— 鲸纹留声机(物品 → 全队经验)与星砂沙漏(装备 / 模组 → 材料)。
// 预览与实际结算共用同一套计数，界面上看到的数就是到手的数(材料种类在结算时才抽)。
// ============================================================================

import { getItemDef, makeRolledItemStack } from "@/data";
import {
  EXP_CONVERT, SALVAGE_EQUIPMENT, SALVAGE_MODULE, SALVAGE_PERFECT_BONUS,
} from "@/data/curios/rules/serviceBalance";
import { rewardPool } from "@/data/curios/rules/rewardPools";
import { rngPickWeighted } from "@/engine/core/rng";
import { rollPerfectness } from "@/items/equipRoll";
import type { ItemStack } from "@/items/types";
import { addPendingLoot, applyEffect } from "../session";
import type { ExploreState } from "../types";

/** 一件物品折算的经验(全队每名存活队员各得)。 */
function expPerItem(stack: ItemStack): number {
  const def = getItemDef(stack.itemId);
  if (def.category === "material") return EXP_CONVERT.material;
  if (def.category === "consumable") return EXP_CONVERT.consumable;
  if (def.category === "scrap") return EXP_CONVERT.scrap[def.id] ?? EXP_CONVERT.scrapFallback;
  return 0;
}

/** 投入物品合计折算的经验。 */
export function expForOffer(stacks: ItemStack[]): number {
  return stacks.reduce((sum, stack) => sum + expPerItem(stack) * stack.count, 0);
}

export function convertToExp(s: ExploreState, offered: ItemStack[]): string {
  const amount = expForOffer(offered);
  if (amount <= 0) return "没有可以折算的物品";
  return applyEffect(s, { type: "GAIN_EXP_PARTY", amount }, true);
}

/** 完美度达标的装备多给材料。 */
function perfectBonus(stack: ItemStack): number {
  const def = getItemDef(stack.itemId);
  const budget = def.model?.budget;
  if (!budget || !stack.roll || budget.max <= budget.min) return 0;
  const ratio = (rollPerfectness(def, stack.roll) - budget.min) / (budget.max - budget.min);
  return ratio >= SALVAGE_PERFECT_BONUS.ratio ? SALVAGE_PERFECT_BONUS.materials : 0;
}

export interface SalvageYield {
  materials: number;
  /** 水晶 itemId → 数量。 */
  crystals: Record<string, number>;
}

/** 拆解投入物品能得到多少材料与水晶。 */
export function salvageYield(stacks: ItemStack[]): SalvageYield {
  const out: SalvageYield = { materials: 0, crystals: {} };
  for (const stack of stacks) {
    const def = getItemDef(stack.itemId);
    for (let i = 0; i < stack.count; i += 1) {
      if (def.category === "module") {
        out.materials += SALVAGE_MODULE[def.rarity];
        continue;
      }
      if (def.category !== "equipment") continue;
      const row = SALVAGE_EQUIPMENT[def.rarity];
      out.materials += row.materials + perfectBonus(stack);
      if (row.crystal) out.crystals[row.crystal] = (out.crystals[row.crystal] ?? 0) + 1;
    }
  }
  return out;
}

/** 拆解预览文字，例如「通用材料 ×4、绿色水晶 ×1」。 */
export function salvageSummary(yieldOf: SalvageYield): string {
  const parts = yieldOf.materials ? [`通用材料 ×${yieldOf.materials}`] : [];
  for (const [itemId, count] of Object.entries(yieldOf.crystals)) parts.push(`${getItemDef(itemId).name} ×${count}`);
  return parts.join("、");
}

export function salvage(s: ExploreState, offered: ItemStack[]): string {
  const yieldOf = salvageYield(offered);
  const materials = rewardPool("generalMaterial");
  const made: ItemStack[] = [];
  for (let i = 0; i < yieldOf.materials; i += 1) {
    made.push(makeRolledItemStack(s, rngPickWeighted(s, [...materials], (entry) => entry.weight).itemId, 1));
  }
  for (const [itemId, count] of Object.entries(yieldOf.crystals)) {
    for (let i = 0; i < count; i += 1) made.push(makeRolledItemStack(s, itemId, 1));
  }
  if (!made.length) return "没有拆出可用的零件";
  addPendingLoot(s, made);
  return `拆出 ${salvageSummary(yieldOf)}，已放入待拾取框`;
}
