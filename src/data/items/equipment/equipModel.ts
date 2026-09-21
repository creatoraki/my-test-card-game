import type { StatBlock } from "../../../engine/types";
import type { EquipSlot, ItemDef } from "../../../items/types";
import { assertModelValid } from "../../../items/equipRoll";
import { RARITY_ORDER } from "../../../items/types";

export interface EquipFamily {
  familyId: string;
  name: string;
  desc: string;
  affixes:
    | [keyof StatBlock, keyof StatBlock]
    | [keyof StatBlock, keyof StatBlock, keyof StatBlock];
  drawback?: keyof StatBlock;
}

export interface EquipSlotPreset {
  slot: EquipSlot;
  icon: string;
  /** 按稀有度的模型值下限/上限；缺省走通用表。 */
  budget?: { min: readonly number[]; max: readonly number[] };
  /** 每次升阶投入的模型值区间；缺省走 equipRoll 的 DEFAULT_UPGRADE_ADD。 */
  upgradeAdd?: readonly [number, number];
}

// ★ 武器模型值: 1 阶 10, 之后每阶上限 +10(10/20/30/40/50); 升阶投入与之对齐为 9~10。
export const WEAPON_PRESET: EquipSlotPreset = {
  slot: "weapon",
  icon: "weapon",
  budget: { min: [7, 14, 21, 28, 35], max: [10, 20, 30, 40, 50] },
  upgradeAdd: [9, 10],
};
export const ARMOR_PRESET: EquipSlotPreset = { slot: "armor", icon: "armor" };
export const TRINKET_PRESET: EquipSlotPreset = { slot: "trinket", icon: "trinket" };

const STANDARD_BUDGET_MAX = [15, 20, 25, 30, 35];
const STANDARD_BUDGET_MIN = [10, 14, 18, 22, 26];
const BUDGET_ROLLS = 2; // 取两次预算的较小值，压低满完美度出现率。
const DRAWBACK_COST = [3, 3, 4, 4, 5];
const DRAWBACK_REFUND = [2, 2, 3, 3, 4];
// 词条总容量至少为「模型上限 + 返还」的这个倍数，留出随机分配的余量。
const AFFIX_CAPACITY_SLACK = 1.3;

function createAffixes(
  stats: EquipFamily["affixes"],
  index: number,
  extreme: boolean,
  required: number,
) {
  const maxBySlot = stats.length === 2
    ? extreme
      ? [7 + index * 5, 6 + index * 4]
      : [6 + index * 4, 6 + index * 3]
    : extreme
      ? [6 + index * 4, 5 + index * 3, 3 + index * 2]
      : [5 + index * 3, 4 + index * 2, 3 + index];
  maxBySlot[0] += 5;
  // 模型值更高的槽位(如武器高阶)按原槽位比例放大词条上限，保证模型值放得下。
  const capacity = maxBySlot.reduce((sum, max) => sum + max, 0);
  const target = Math.ceil(required * AFFIX_CAPACITY_SLACK);
  const scale = capacity < target ? target / capacity : 1;
  const minBySlot = stats.length === 2 ? [3, 2] : [2, 2, 1];
  const weights = [3, 2, 1];
  return stats.map((stat, slot) => ({
    stat,
    min: minBySlot[slot],
    max: Math.ceil(maxBySlot[slot] * scale),
    weight: weights[slot],
  }));
}

function createDrawback(stat: EquipFamily["drawback"], index: number) {
  if (!stat) return undefined;
  const cost = DRAWBACK_COST[index];
  return [{ stat, min: cost, max: cost, weight: 1 }];
}

export function expandEquipTiers(
  family: EquipFamily,
  preset: EquipSlotPreset,
): ItemDef[] {
  const extreme = Boolean(family.drawback);
  return RARITY_ORDER.map((rarity, index) => {
    const budgetMax = preset.budget?.max[index] ?? STANDARD_BUDGET_MAX[index];
    const budgetMin = preset.budget?.min[index] ?? STANDARD_BUDGET_MIN[index];
    const refund = extreme ? DRAWBACK_REFUND[index] : 0;
    const def: ItemDef = {
      id: `${family.familyId}-${rarity}`,
      name: family.name,
      category: "equipment",
      rarity,
      desc: family.desc,
      maxStack: 1,
      slot: preset.slot,
      familyId: family.familyId,
      icon: preset.icon,
      model: {
        budget: {
          min: budgetMin,
          max: budgetMax,
          rolls: BUDGET_ROLLS,
        },
        blockMax: 3 + index,
        // 只有自定义模型值的槽位(武器)才放大词条上限，防具/饰品保持原表。
        affixes: createAffixes(family.affixes, index, extreme, preset.budget ? budgetMax + refund : 0),
        drawbacks: createDrawback(family.drawback, index),
        ...(family.drawback ? { costRefundFlat: DRAWBACK_REFUND[index] } : {}),
        ...(preset.upgradeAdd ? { upgradeAdd: preset.upgradeAdd } : {}),
      },
    };
    assertModelValid(def);
    return def;
  });
}
