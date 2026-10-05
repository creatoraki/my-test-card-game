import type { ItemStack } from "@/items/types";
import { makeItemStack } from "../registry";
import { difficultyKey, type MapDifficulty } from "./mapDifficulty";
import { rngPick } from "@/engine/core/rng";
import { NEAR_EXPIRY_FOOD_IDS } from "../items/catalog/consumables";
import { MAPS } from "./index";
import { MAP_DIFFICULTY_IDS, mapHasDifficulty } from "./mapDifficulty";

export interface AidSupplyEntry {
  itemId: string;
  count: number;
}

export const DEFAULT_AID_SUPPLY: AidSupplyEntry[] = [
  { itemId: "cola", count: 2 },
  { itemId: "medical-kit-c", count: 1 },
  { itemId: "energy-canister", count: 1 },
];

// 优先按地图 × 难度覆盖；未命中时再按地图覆盖，最后回退默认配额物资。
export const AID_SUPPLY_OVERRIDES: Partial<Record<string, AidSupplyEntry[]>> = {};
export const AID_SUPPLY_MAP_OVERRIDES: Partial<Record<string, AidSupplyEntry[]>> = {
  tutorial: [
    { itemId: "bread", count: 2 },
    { itemId: "medical-kit-c", count: 1 },
    { itemId: "energy-canister", count: 1 },
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

// 食品与消耗品各抽一种；净化粒子罐固定配发，不参与抽选。
const RANDOM_CONSUMABLE_POOL = [
  "medical-kit-c",
  "sugar-cube-c",
  "holy-water-c",
  "fruit-juice-c",
];

export function rollAllDailyAidSupplies(): Record<string, ItemStack[]> {
  const rng = { rngState: Math.floor(Math.random() * 0x100000000) >>> 0 };
  const supplies: Record<string, ItemStack[]> = {};
  for (const map of MAPS) {
    const difficulties: readonly MapDifficulty[] = mapHasDifficulty(map.id) ? MAP_DIFFICULTY_IDS : ["normal"];
    for (const difficulty of difficulties) {
      const foodId = rngPick(rng, [...NEAR_EXPIRY_FOOD_IDS]);
      const consumableId = rngPick(rng, RANDOM_CONSUMABLE_POOL);
      supplies[difficultyKey(map.id, difficulty)] = [
        makeItemStack(foodId, 2, { disposable: true }),
        makeItemStack(consumableId, consumableId === "medical-kit-c" ? 1 : 2, { disposable: true }),
        makeItemStack("energy-canister", 1, { disposable: true }),
      ];
    }
  }
  return supplies;
}
