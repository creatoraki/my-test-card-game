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
}

export const WEAPON_PRESET: EquipSlotPreset = { slot: "weapon", icon: "weapon" };
export const ARMOR_PRESET: EquipSlotPreset = { slot: "armor", icon: "armor" };
export const TRINKET_PRESET: EquipSlotPreset = { slot: "trinket", icon: "trinket" };

const STANDARD_BUDGET_MAX = [15, 20, 25, 30, 35];
const BUDGET_ROLLS = 2; // 取两次预算的较小值，压低满完美度出现率。
const DRAWBACK_COST = [3, 3, 4, 4, 5];
const DRAWBACK_REFUND = [2, 2, 3, 3, 4];

function createAffixes(
  stats: EquipFamily["affixes"],
  index: number,
  extreme: boolean,
) {
  const maxBySlot = stats.length === 2
    ? extreme
      ? [7 + index * 5, 6 + index * 4]
      : [6 + index * 4, 6 + index * 3]
    : extreme
      ? [6 + index * 4, 5 + index * 3, 3 + index * 2]
      : [5 + index * 3, 4 + index * 2, 3 + index];
  maxBySlot[0] += 5;
  const minBySlot = stats.length === 2 ? [3, 2] : [2, 2, 1];
  const weights = [3, 2, 1];
  return stats.map((stat, slot) => ({
    stat,
    min: minBySlot[slot],
    max: maxBySlot[slot],
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
          min: 10 + index * 4,
          max: STANDARD_BUDGET_MAX[index],
          rolls: BUDGET_ROLLS,
        },
        blockMax: 3 + index,
        affixes: createAffixes(family.affixes, index, extreme),
        drawbacks: createDrawback(family.drawback, index),
        ...(family.drawback ? { costRefundFlat: DRAWBACK_REFUND[index] } : {}),
      },
    };
    assertModelValid(def);
    return def;
  });
}