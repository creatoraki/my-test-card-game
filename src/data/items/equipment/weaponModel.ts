import type { StatBlock } from "../../../engine/types";
import type { ItemDef, ItemRarity } from "../../../items/types";
import { assertModelValid } from "../../../items/equipRoll";
import { RARITY_ORDER } from "../../../items/types";

export interface WeaponFamily {
  familyId: string;
  name: string;
  desc: string;
  affixes: [keyof StatBlock, keyof StatBlock, keyof StatBlock];
  drawbacks?: (keyof StatBlock)[];
}

const STANDARD_BUDGET_MAX = [10, 15, 20, 25, 30];

function splitTotal(total: number, count: number, index: number): number {
  const base = Math.floor(total / count);
  return base + (index < total % count ? 1 : 0);
}

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

function createDrawbacks(stats: WeaponFamily["drawbacks"], index: number) {
  if (!stats?.length) return undefined;
  const totalMin = 2 + index * 2;
  const totalMax = 4 + index * 3;
  return stats.map((stat, drawbackIndex) => ({
    stat,
    min: splitTotal(totalMin, stats.length, drawbackIndex),
    max: splitTotal(totalMax, stats.length, drawbackIndex),
    weight: 1,
  }));
}

export function expandWeaponTiers(family: WeaponFamily): ItemDef[] {
  const extreme = Boolean(family.drawbacks?.length);
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
        drawbacks: createDrawbacks(family.drawbacks, index),
      },
    };
    assertModelValid(def);
    return def;
  });
}
