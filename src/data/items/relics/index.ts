import { BLESSING_RELIC_DEFS } from "./blessings";
import { CURSE_RELIC_DEFS } from "./curses";

export { BLESSING_RELIC_DEFS } from "./blessings";
export { CURSE_RELIC_DEFS } from "./curses";

export const RELIC_ITEM_DEFS = [...BLESSING_RELIC_DEFS, ...CURSE_RELIC_DEFS];

export const RELIC_ITEM_IDS = RELIC_ITEM_DEFS.map((def) => def.id);
