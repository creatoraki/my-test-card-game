import type { ItemDef } from "../../../items/types";
import { withBuyValue } from "../pricing";
import { ARMOR_ITEM_DEFS } from "./armor";
import { TRINKET_ITEM_DEFS } from "./trinkets";
import { WEAPON_ITEM_DEFS } from "./weapons";

const DEFS: ItemDef[] = [...WEAPON_ITEM_DEFS, ...ARMOR_ITEM_DEFS, ...TRINKET_ITEM_DEFS];

export const EQUIPMENT_ITEM_DEFS: ItemDef[] = withBuyValue(
  DEFS.map((def) => ({ ...def, affinityRollable: true })),
);