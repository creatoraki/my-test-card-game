import type { StatBlock } from "@/engine/types";
import type { EquipSlot, ItemDef } from "@/items/types";
import { assertModelValid } from "@/items/equipRoll";
import { RARITY_ORDER } from "@/items/types";

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
}

export const WEAPON_PRESET: EquipSlotPreset = { slot: "weapon", icon: "weapon" };
export const ARMOR_PRESET: EquipSlotPreset = { slot: "armor", icon: "armor" };
export const TRINKET_PRESET: EquipSlotPreset = { slot: "trinket", icon: "trinket" };

// ★ 全槽位通用模型值表: 普通 5~10, 之后每阶上限 +10(10/20/30/40/50);
//   升阶投入与每阶上限的步进对齐为 9~10。
const STANDARD_BUDGET_MIN = [5, 14, 21, 28, 35];
const STANDARD_BUDGET_MAX = [10, 20, 30, 40, 50];
const STANDARD_UPGRADE_ADD: readonly [number, number] = [9, 10];
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
  // 高阶模型值超出基础词条容量时按原槽位比例放大词条上限，保证模型值放得下。
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
    const budgetMax = STANDARD_BUDGET_MAX[index];
    const budgetMin = STANDARD_BUDGET_MIN[index];
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
        affixes: createAffixes(family.affixes, index, extreme, budgetMax + refund),
        drawbacks: createDrawback(family.drawback, index),
        ...(family.drawback ? { costRefundFlat: DRAWBACK_REFUND[index] } : {}),
        upgradeAdd: STANDARD_UPGRADE_ADD,
      },
    };
    assertModelValid(def);
    return def;
  });
}
