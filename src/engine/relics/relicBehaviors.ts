import type { RelicBehavior } from "./types";
import { registerRelicBehaviors } from "../core/hookRegistry";
import { TUTORIAL_RELIC_BEHAVIORS } from "./tutorial";
import { BASIC_RELIC_BEHAVIORS } from "./basic";
import { UNCOMMON_RELIC_BEHAVIORS } from "./uncommon";

export const RELIC_BEHAVIORS: Record<string, RelicBehavior> = {
  ...TUTORIAL_RELIC_BEHAVIORS,
  ...BASIC_RELIC_BEHAVIORS,
  ...UNCOMMON_RELIC_BEHAVIORS,
};

// 填入钩子注册表 —— runRelicHook 查的是那张表, 不直接 import 本文件(否则成环)。
registerRelicBehaviors(RELIC_BEHAVIORS);

export type { RelicBehavior, RelicBehaviorContext, StatusApplyInfo } from "./types";
export { runRelicHook } from "./types";
