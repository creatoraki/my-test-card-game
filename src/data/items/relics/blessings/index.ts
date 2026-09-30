import { BLESSING_BOX_RELIC_DEFS } from "./blessingBox";
import { COMMON_BLESSING_RELIC_DEFS } from "./common";
import { FINE_BLESSING_RELIC_DEFS } from "./fine";
import { PICNIC_BLESSING_RELIC_DEFS } from "./picnic";
import { RARE_BLESSING_RELIC_DEFS } from "./rare";

// 祝福遗物全集(按稀有度由低到高, 一次性渠道紧跟在普通档之后)。⚠ 这不是随机池 —— 随机池请走 ../pools.ts。
export const BLESSING_RELIC_DEFS = [
  ...COMMON_BLESSING_RELIC_DEFS,
  ...PICNIC_BLESSING_RELIC_DEFS,
  ...BLESSING_BOX_RELIC_DEFS,
  ...FINE_BLESSING_RELIC_DEFS,
  ...RARE_BLESSING_RELIC_DEFS,
];

export {
  BLESSING_BOX_RELIC_DEFS,
  COMMON_BLESSING_RELIC_DEFS,
  FINE_BLESSING_RELIC_DEFS,
  PICNIC_BLESSING_RELIC_DEFS,
  RARE_BLESSING_RELIC_DEFS,
};
