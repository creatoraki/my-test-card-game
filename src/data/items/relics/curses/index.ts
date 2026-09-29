import { COMMON_CURSE_RELIC_DEFS } from "./common";
import { FINE_CURSE_RELIC_DEFS } from "./fine";
import { RARE_CURSE_RELIC_DEFS } from "./rare";

// 诅咒遗物全集(按稀有度由低到高)。诅咒不可回收, 只能在圣水池净化成同稀有度的随机池祝福遗物。
export const CURSE_RELIC_DEFS = [
  ...COMMON_CURSE_RELIC_DEFS,
  ...FINE_CURSE_RELIC_DEFS,
  ...RARE_CURSE_RELIC_DEFS,
];

export { COMMON_CURSE_RELIC_DEFS, FINE_CURSE_RELIC_DEFS, RARE_CURSE_RELIC_DEFS };
