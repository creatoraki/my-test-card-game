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

// 按地图 × 难度覆盖默认物资；首版所有配置共用 DEFAULT_AID_SUPPLY。
export const AID_SUPPLY_OVERRIDES: Partial<Record<string, AidSupplyEntry[]>> = {};

export function aidSupplyOf(mapId: string, difficulty: MapDifficulty): AidSupplyEntry[] {
  return AID_SUPPLY_OVERRIDES[difficultyKey(mapId, difficulty)] ?? DEFAULT_AID_SUPPLY;
}

export function makeAidSupplyStacks(mapId: string, difficulty: MapDifficulty): ItemStack[] {
  return aidSupplyOf(mapId, difficulty).map(({ itemId, count }) =>
    makeItemStack(itemId, count, { disposable: true }),
  );
}
