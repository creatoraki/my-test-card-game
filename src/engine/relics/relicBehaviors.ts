import type { RelicBehavior } from "./types";
import { registerRelicBehaviors } from "../core/hookRegistry";
import { COMMON_RELIC_BEHAVIORS } from "./behaviors/common";
import { FINE_RELIC_BEHAVIORS } from "./behaviors/fine";
import { RARE_RELIC_BEHAVIORS } from "./behaviors/rare";
import { BLESSING_BOX_RELIC_BEHAVIORS } from "./behaviors/blessingBox";

// 战斗内遗物行为, 按稀有度(一次性渠道按来源)分文件 —— 与 data/items/relics/<极性>/<稀有度|来源>.ts 一一对应。
export const RELIC_BEHAVIORS: Record<string, RelicBehavior> = {
  ...COMMON_RELIC_BEHAVIORS,
  ...BLESSING_BOX_RELIC_BEHAVIORS,
  ...FINE_RELIC_BEHAVIORS,
  ...RARE_RELIC_BEHAVIORS,
};

// 填入钩子注册表 —— runRelicHook 查的是那张表, 不直接 import 本文件(否则成环)。
registerRelicBehaviors(RELIC_BEHAVIORS);

export type { RelicBehavior, RelicBehaviorContext, StatusApplyInfo } from "./types";
export { runRelicHook } from "./types";
