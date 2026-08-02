import { CONSUMABLE_ITEM_DEFS } from "./consumables";
import { EQUIPMENT_ITEM_DEFS } from "./equipment";
import { MATERIAL_ITEM_DEFS } from "./materials";

export { CONSUMABLE_ITEM_DEFS } from "./consumables";
export { EQUIPMENT_ITEM_DEFS } from "./equipment";
export { MATERIAL_ITEM_DEFS } from "./materials";

export const DESIGN_ITEM_DEFS = [
  ...MATERIAL_ITEM_DEFS,
  ...CONSUMABLE_ITEM_DEFS,
  ...EQUIPMENT_ITEM_DEFS,
];
