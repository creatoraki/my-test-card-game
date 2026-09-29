import { COMMON_BLESSING_RELIC_DEFS } from "./common";
import { FINE_BLESSING_RELIC_DEFS } from "./fine";
import { RARE_BLESSING_RELIC_DEFS } from "./rare";

// 祝福遗物全集(按稀有度由低到高)。⚠ 这不是随机池 —— 随机池请走 ../pools.ts。
export const BLESSING_RELIC_DEFS = [
  ...COMMON_BLESSING_RELIC_DEFS,
  ...FINE_BLESSING_RELIC_DEFS,
  ...RARE_BLESSING_RELIC_DEFS,
];

export { COMMON_BLESSING_RELIC_DEFS, FINE_BLESSING_RELIC_DEFS, RARE_BLESSING_RELIC_DEFS };
