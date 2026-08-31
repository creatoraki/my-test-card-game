import { CONSUMABLE_ITEM_DEFS } from "./consumables";
import { EQUIPMENT_ITEM_DEFS } from "./equipment";
import { MATERIAL_ITEM_DEFS } from "./materials";
import { BURDEN_ITEM_DEFS } from "./burden";
import { SCRAP_ITEM_DEFS } from "./scrap";
import {
  GENERIC_MODULE_ITEM_DEFS,
  MODULE_CRATE_ITEM_DEFS,
  MODULE_ITEM_DEFS,
} from "./modules";

export { CONSUMABLE_ITEM_DEFS } from "./consumables";
export { EQUIPMENT_ITEM_DEFS } from "./equipment";
export { MATERIAL_ITEM_DEFS } from "./materials";
export { BURDEN_ITEM_DEFS } from "./burden";
export { SCRAP_ITEM_DEFS } from "./scrap";
export {
  GENERIC_MODULE_FAMILY,
  GENERIC_MODULE_ITEM_DEFS,
  MODULE_CRATE_ITEM_DEFS,
  MODULE_ITEM_DEFS,
} from "./modules";

export const DESIGN_ITEM_DEFS = [
  ...MATERIAL_ITEM_DEFS,
  ...SCRAP_ITEM_DEFS,
  ...CONSUMABLE_ITEM_DEFS,
  ...EQUIPMENT_ITEM_DEFS,
  ...BURDEN_ITEM_DEFS,
  ...MODULE_ITEM_DEFS,
  ...GENERIC_MODULE_ITEM_DEFS,
  ...MODULE_CRATE_ITEM_DEFS,
];
