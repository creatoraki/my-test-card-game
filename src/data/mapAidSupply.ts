import type { ItemStack } from "../items/types";
import { makeItemStack } from "./index";
import { difficultyKey, type MapDifficulty } from "./mapDifficulty";

export interface AidSupplyEntry {
  itemId: string;
  count: number;
}

export const DEFAULT_AID_SUPPLY: AidSupplyEntry[] = [
  { itemId: "milk", count: 1 },
  { itemId: "cola", count: 1 },
  { itemId: "medical-kit-c", count: 1 },
];

// 优先按地图 × 难度覆盖；未命中时再按地图覆盖，最后回退默认配额物资。
export const AID_SUPPLY_OVERRIDES: Partial<Record<string, AidSupplyEntry[]>> = {};
export const AID_SUPPLY_MAP_OVERRIDES: Partial<Record<string, AidSupplyEntry[]>> = {
  tutorial: [
    { itemId: "milk", count: 1 },
    { itemId: "bread", count: 1 },
    { itemId: "medical-kit-c", count: 1 },
  ],
};

export function aidSupplyOf(mapId: string, difficulty: MapDifficulty): AidSupplyEntry[] {
  return (
    AID_SUPPLY_OVERRIDES[difficultyKey(mapId, difficulty)] ??
    AID_SUPPLY_MAP_OVERRIDES[mapId] ??
    DEFAULT_AID_SUPPLY
  );
}

export function makeAidSupplyStacks(mapId: string, difficulty: MapDifficulty): ItemStack[] {
  return aidSupplyOf(mapId, difficulty).map(({ itemId, count }) =>
    makeItemStack(itemId, count, { disposable: true }),
  );
}
