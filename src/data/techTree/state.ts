import type { ItemStack } from "@/items/types";
import { techCostCheck, type TechCostCheck } from "../techCost";
import { TECH_NODES } from "./nodes";
import type { TechNodeDef, TechNodeState, TechTreeState } from "./types";

export function techLevel(levels: TechTreeState["levels"], id: string): number {
  return Math.max(0, Math.floor(levels[id] ?? 0));
}

export function techNextCost(
  node: TechNodeDef,
  levels: TechTreeState["levels"],
): TechNodeDef["costs"][number] | null {
  const level = techLevel(levels, node.id);
  return level >= node.maxLevel ? null : node.costs[level] ?? null;
}

export function techNodeCheck(
  node: TechNodeDef,
  levels: TechTreeState["levels"],
  loot: number,
  storage: ItemStack[],
): TechCostCheck {
  return techCostCheck(
    techNextCost(node, levels) ?? { loot: 0, materials: [] },
    loot,
    storage,
  );
}

export function techNodeState(
  node: TechNodeDef,
  levels: TechTreeState["levels"],
  loot: number,
  storage: ItemStack[],
): TechNodeState {
  const level = techLevel(levels, node.id);
  if (level >= node.maxLevel) return "maxed";
  if (!node.requires.every((id) => techLevel(levels, id) >= 1)) return "locked";
  return techNodeCheck(node, levels, loot, storage).ok ? "available" : "lacking";
}

export function techNode(id: string): TechNodeDef | undefined {
  return TECH_NODES.find((node) => node.id === id);
}
