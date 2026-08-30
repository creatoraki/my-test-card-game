import type { ItemDef } from "../../../items/types";
import { withBuyValue } from "../pricing";
import { ARMOR_ITEM_DEFS } from "./armor";
import { WEAPON_ITEM_DEFS } from "./weapons";

// 饰品暂时下线，原始定义文件保留以便后续恢复。
const DEFS: ItemDef[] = [...WEAPON_ITEM_DEFS, ...ARMOR_ITEM_DEFS];

export const EQUIPMENT_ITEM_DEFS: ItemDef[] = withBuyValue(
  DEFS.map((def) => ({ ...def, affinityRollable: true })),
);