import type { RelicBehavior } from "./types";
import { registerRelicBehaviors } from "../core/hookRegistry";
import { COMMON_RELIC_BEHAVIORS } from "./behaviors/common";
import { FINE_RELIC_BEHAVIORS } from "./behaviors/fine";
import { RARE_RELIC_BEHAVIORS } from "./behaviors/rare";
import { BLESSING_BOX_RELIC_BEHAVIORS } from "./behaviors/blessingBox";
import { MECHANISM_RELIC_BEHAVIORS } from "./behaviors/mechanisms";

// 战斗内遗物行为按稀有度 / 来源登记；普通机制联动遗物另按机制拆分模块。
export const RELIC_BEHAVIORS: Record<string, RelicBehavior> = {
  ...COMMON_RELIC_BEHAVIORS,
  ...MECHANISM_RELIC_BEHAVIORS,
  ...BLESSING_BOX_RELIC_BEHAVIORS,
  ...FINE_RELIC_BEHAVIORS,
  ...RARE_RELIC_BEHAVIORS,
};

// 填入钩子注册表 —— runRelicHook 查的是那张表, 不直接 import 本文件(否则成环)。
registerRelicBehaviors(RELIC_BEHAVIORS);

export type { RelicBehavior, RelicBehaviorContext, StatusApplyInfo } from "./types";
export { runRelicHook } from "./types";
