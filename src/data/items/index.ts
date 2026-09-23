import { CONSUMABLE_ITEM_DEFS } from "./catalog/consumables";
import { EQUIPMENT_ITEM_DEFS } from "./equipment";
import { MATERIAL_ITEM_DEFS } from "./catalog/materials";
import { BURDEN_ITEM_DEFS } from "./rules/burden";
import { SCRAP_ITEM_DEFS } from "./catalog/scrap";
import { REGIONAL_MATERIAL_DEFS } from "./catalog/regional";
import {
  GENERIC_MODULE_ITEM_DEFS,
  MODULE_CRATE_ITEM_DEFS,
  MODULE_ITEM_DEFS,
} from "./catalog/modules";
import { RELIC_ITEM_DEFS } from "./relics";

export { CONSUMABLE_ITEM_DEFS, NEAR_EXPIRY_FOOD_IDS } from "./catalog/consumables";
export { EQUIPMENT_ITEM_DEFS } from "./equipment";
export { CRYSTAL_ITEM_DEFS, GENERAL_MATERIAL_DEFS, MATERIAL_ITEM_DEFS } from "./catalog/materials";
export { BURDEN_ITEM_DEFS } from "./rules/burden";
export { SCRAP_ITEM_DEFS } from "./catalog/scrap";
export {
  DEFAULT_REGION_ID,
  REGIONAL_MATERIAL_DEFS,
  itemRegionId,
  regionalMaterial,
  regionalTierOf,
} from "./catalog/regional";
export type { RegionalMaterialDef, RegionalTier } from "./catalog/regional";
export {
  GENERIC_MODULE_FAMILY,
  GENERIC_MODULE_ITEM_DEFS,
  MODULE_CRATE_ITEM_DEFS,
  MODULE_ITEM_DEFS,
} from "./catalog/modules";
export { BLESSING_RELIC_DEFS, CURSE_RELIC_DEFS, RELIC_ITEM_DEFS, RELIC_ITEM_IDS } from "./relics";

export const DESIGN_ITEM_DEFS = [
  ...MATERIAL_ITEM_DEFS,
  ...REGIONAL_MATERIAL_DEFS,
  ...SCRAP_ITEM_DEFS,
  ...CONSUMABLE_ITEM_DEFS,
  ...EQUIPMENT_ITEM_DEFS,
  ...BURDEN_ITEM_DEFS,
  ...MODULE_ITEM_DEFS,
  ...GENERIC_MODULE_ITEM_DEFS,
  ...MODULE_CRATE_ITEM_DEFS,
  ...RELIC_ITEM_DEFS,
];
