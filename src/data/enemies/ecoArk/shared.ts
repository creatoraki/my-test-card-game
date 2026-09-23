import type { BoonEntry } from "@/explore/types";
import type { DropEntry } from "@/items/types";

/** 方舟回收通用维护零件，不混入废弃楼层的专属地区材料。 */
export function arkDrops(tier: "minion" | "elite" | "boss", material: string): DropEntry[] {
  const elite = tier === "elite";
  const boss = tier === "boss";
  return [
    { kind: "item", itemId: boss ? "red-crystal" : elite ? "blue-crystal" : "green-crystal", chance: boss ? 1 : elite ? 0.6 : 0.2 },
    { kind: "item", itemId: material, chance: boss ? 1 : elite ? 0.5 : 0.3 },
    { kind: "item", itemId: boss ? "gold-coin" : "copper-coin", chance: boss ? 0.6 : 0.4 },
    { kind: "item", itemId: "module-crate-t1", chance: boss ? 0.2 : elite ? 0.08 : 0.03 },
  ];
}

export const ARK_MINION_BOONS: BoonEntry[] = [
  { kind: "healDew", chance: 0.3 }, { kind: "equipCrate", chance: 0.12 },
  { kind: "moduleCrate", chance: 0.05 }, { kind: "cardOffer", chance: 0.4 },
];
export const ARK_ELITE_BOONS: BoonEntry[] = [
  { kind: "healDew", chance: 0.5 }, { kind: "equipCrate", chance: 0.25 },
  { kind: "moduleCrate", chance: 0.15 }, { kind: "cardOffer", chance: 0.65 },
];
