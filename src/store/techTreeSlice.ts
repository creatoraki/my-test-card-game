import {
  TECH_NODES,
  techLevel,
  techNextCost,
  techNodeCheck,
} from "@/data";
import { consumeItems } from "@/items/inventory";
import type { TownStore } from "./townStore";

export interface TechTreeSlice {
  researchTech: (techId: string) => void;
}

export function createTechTreeSlice(
  set: (partial: Partial<TownStore> | ((state: TownStore) => Partial<TownStore>)) => void,
  get: () => TownStore,
): TechTreeSlice {
  return {
    researchTech: (techId) => {
      const { techTree, loot, storage } = get();
      const node = TECH_NODES.find((entry) => entry.id === techId);
      if (!node) return;

      const level = techLevel(techTree.levels, node.id);
      const cost = techNextCost(node, techTree.levels);
      if (!cost || level >= node.maxLevel || !node.requires.every((id) => techLevel(techTree.levels, id) >= 1)) {
        return;
      }
      if (!techNodeCheck(node, techTree.levels, loot, storage).ok) return;

      const nextStorage = cost.materials.reduce(
        (current, material) => consumeItems(current, material.itemId, material.count),
        storage,
      );
      set({
        loot: loot - cost.loot,
        storage: nextStorage,
        techTree: {
          levels: { ...techTree.levels, [node.id]: level + 1 },
        },
      });
    },
  };
}
