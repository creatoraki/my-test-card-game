import type { StatBlock } from "../../../engine/types";
import type { ItemDef, ItemRarity } from "../../../items/types";
import { assertModelValid } from "../../../items/equipRoll";
import { RARITY_ORDER } from "../../../items/types";

export interface WeaponFamily {
  familyId: string;
  name: string;
  desc: string;
  affixes: [keyof StatBlock, keyof StatBlock, keyof StatBlock];
  drawback?: keyof StatBlock;
}

const STANDARD_BUDGET_MAX = [10, 15, 20, 25, 30];
const DRAWBACK_COST = [3, 3, 4, 4, 5];
const DRAWBACK_REFUND = [2, 2, 3, 3, 4];

function createAffixes(
  stats: WeaponFamily["affixes"],
  index: number,
  extreme: boolean,
) {
  const maxBySlot = extreme
    ? [6 + index * 4, 5 + index * 3, 3 + index * 2]
    : [5 + index * 3, 4 + index * 2, 3 + index];
  const minBySlot = [2, 2, 1];
  const weights = [3, 2, 1];
  return stats.map((stat, slot) => ({
    stat,
    min: minBySlot[slot],
    max: maxBySlot[slot],
    weight: weights[slot],
  }));
}

function createDrawback(stat: WeaponFamily["drawback"], index: number) {
  if (!stat) return undefined;
  const cost = DRAWBACK_COST[index];
  return [{ stat, min: cost, max: cost, weight: 1 }];
}

export function expandWeaponTiers(family: WeaponFamily): ItemDef[] {
  const extreme = Boolean(family.drawback);
  return RARITY_ORDER.map((rarity, index) => {
    const def: ItemDef = {
      id: `${family.familyId}-${rarity}`,
      name: family.name,
      category: "equipment",
      rarity,
      desc: family.desc,
      maxStack: 1,
      slot: "weapon",
      familyId: family.familyId,
      icon: "weapon",
      model: {
        budget: {
          min: 5 + index * 4,
          max: STANDARD_BUDGET_MAX[index],
        },
        blockMax: 2 + index,
        affixes: createAffixes(family.affixes, index, extreme),
        drawbacks: createDrawback(family.drawback, index),
        ...(family.drawback ? { costRefundFlat: DRAWBACK_REFUND[index] } : {}),
      },
    };
    assertModelValid(def);
    return def;
  });
}
