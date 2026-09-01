import type { ItemDef, ItemRarity } from "../items/types";
import {
  CONSUMABLE_ITEM_DEFS,
  CRYSTAL_ITEM_DEFS,
  EQUIPMENT_ITEM_DEFS,
  GENERAL_MATERIAL_DEFS,
  MATERIAL_ITEM_DEFS,
} from "./items/index";
import { mapEquipRarities } from "./maps";

export type TradeStockKind =
  | "material-general"
  | "crystal"
  | "consumable"
  | "food"
  | "equip-weapon";

const FOOD_IDS = ["milk", "bread", "cola", "hamburger", "fried-chicken", "pizza"];

const ALL_DEFS = [...MATERIAL_ITEM_DEFS, ...CONSUMABLE_ITEM_DEFS, ...EQUIPMENT_ITEM_DEFS];
const DEF_BY_ID = new Map(ALL_DEFS.map((def) => [def.id, def]));
const CONSUMABLE_FAMILIES = new Set(["sugar-cube", "medical-kit", "holy-water", "fruit-juice"]);
const COMMON_RARITIES = new Set<ItemRarity>(["common", "fine"]);

function defsByIds(ids: string[]): ItemDef[] {
  return ids.map((id) => DEF_BY_ID.get(id)).filter((def): def is ItemDef => Boolean(def));
}

export function tradeStockDefs(kind: TradeStockKind, mapId: string): ItemDef[] {
  if (kind === "consumable") {
    return CONSUMABLE_ITEM_DEFS.filter(
      (def) => def.familyId && CONSUMABLE_FAMILIES.has(def.familyId) && COMMON_RARITIES.has(def.rarity),
    );
  }
  if (kind === "food") return defsByIds(FOOD_IDS);
  if (kind === "equip-weapon") {
    const allowedRarities = mapEquipRarities(mapId);
    return EQUIPMENT_ITEM_DEFS.filter((def) => def.slot === "weapon" && allowedRarities.includes(def.rarity));
  }
  // 材料只剩两类, 全地图共用同一份清单 —— 通用材料跨地图产出, 水晶按敌人档位产出,
  // 两者都不再有地区专属池, 所以这里不需要按 mapId 分表。
  if (kind === "crystal") return CRYSTAL_ITEM_DEFS;
  return GENERAL_MATERIAL_DEFS;
}
