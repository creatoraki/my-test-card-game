import type { ItemDef, ItemRarity } from "../items/types";
import { CONSUMABLE_ITEM_DEFS, EQUIPMENT_ITEM_DEFS, MATERIAL_ITEM_DEFS } from "./items/index";
import { mapEquipRarities } from "./maps";

export type TradeStockKind =
  | "material-general"
  | "material-regional"
  | "material-monster"
  | "consumable"
  | "food"
  | "equip-weapon";

const FOOD_IDS = ["milk", "bread", "cola", "hamburger", "fried-chicken", "pizza"];
const REGIONAL_IDS = [
  "breaker-ceramic-core",
  "cooling-microcrystal",
  "light-guide-film",
  "packaging-gel",
  "conductive-ink",
  "mag-rail-lining",
];
const GENERAL_IDS = ["logic-cube", "standard-gear", "standard-battery"];

const STOCK_IDS_BY_MAP: Record<string, Partial<Record<TradeStockKind, string[]>>> = {
  "neon-city": {
    "material-general": GENERAL_IDS,
    "material-regional": REGIONAL_IDS,
    "material-monster": MATERIAL_ITEM_DEFS.slice(9).map((def) => def.id),
  },
};

const GENERIC_IDS: Record<TradeStockKind, string[]> = {
  "material-general": GENERAL_IDS,
  "material-regional": REGIONAL_IDS,
  "material-monster": MATERIAL_ITEM_DEFS.slice(9).map((def) => def.id),
  consumable: [],
  food: FOOD_IDS,
  "equip-weapon": [],
};

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

  const ids = STOCK_IDS_BY_MAP[mapId]?.[kind] ?? GENERIC_IDS[kind];
  return defsByIds(ids);
}