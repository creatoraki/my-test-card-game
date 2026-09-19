import { BLESSING_RELIC_DEFS } from "./blessings/index";
import { CURSE_RELIC_DEFS } from "./curses";
import { PICNIC_RELIC_DEFS } from "./blessings/picnic";

export { BLESSING_RELIC_DEFS } from "./blessings/index";
export { CURSE_RELIC_DEFS } from "./curses";
export { PICNIC_RELIC_DEFS } from "./blessings/picnic";

// 野餐一次性遗物只登记物品表, 不进入随机祝福遗物池。
export const RELIC_ITEM_DEFS = [...BLESSING_RELIC_DEFS, ...PICNIC_RELIC_DEFS, ...CURSE_RELIC_DEFS];

export const RELIC_ITEM_IDS = RELIC_ITEM_DEFS.map((def) => def.id);
