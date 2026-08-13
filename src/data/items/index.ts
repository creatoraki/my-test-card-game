import { CONSUMABLE_ITEM_DEFS } from "./consumables";
import { EQUIPMENT_ITEM_DEFS } from "./equipment";
import { MATERIAL_ITEM_DEFS } from "./materials";
import { BURDEN_ITEM_DEFS } from "./burden";
import { SCRAP_ITEM_DEFS } from "./scrap";

export { CONSUMABLE_ITEM_DEFS } from "./consumables";
export { EQUIPMENT_ITEM_DEFS } from "./equipment";
export { MATERIAL_ITEM_DEFS } from "./materials";
export { BURDEN_ITEM_DEFS } from "./burden";
export { SCRAP_ITEM_DEFS } from "./scrap";

export const DESIGN_ITEM_DEFS = [
  ...MATERIAL_ITEM_DEFS,
  ...SCRAP_ITEM_DEFS,
  ...CONSUMABLE_ITEM_DEFS,
  ...EQUIPMENT_ITEM_DEFS,
  ...BURDEN_ITEM_DEFS,
];
