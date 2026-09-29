import { withRelicSellValue } from "../rules/pricing";
import { BLESSING_RELIC_DEFS as RAW_BLESSING_RELIC_DEFS } from "./blessings";
import { CURSE_RELIC_DEFS as RAW_CURSE_RELIC_DEFS } from "./curses";

// 全部遗物的物品表(已统一挂好回收价, 规则见 rules/pricing.ts 的 withRelicSellValue)。
export const RELIC_ITEM_DEFS = withRelicSellValue([...RAW_BLESSING_RELIC_DEFS, ...RAW_CURSE_RELIC_DEFS]);

export const RELIC_ITEM_IDS = RELIC_ITEM_DEFS.map((def) => def.id);

export const BLESSING_RELIC_DEFS = RELIC_ITEM_DEFS.filter((def) => def.relic?.polarity === "blessing");

export const CURSE_RELIC_DEFS = RELIC_ITEM_DEFS.filter((def) => def.relic?.polarity === "curse");
