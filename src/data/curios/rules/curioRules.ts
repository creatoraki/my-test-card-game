import type { BattleTier } from "@/explore/types";

/** 最终失败率上限：门槛之外永远留一点意外。 */
export const CURIO_FAIL_CAP = 0.95;

/** 交互失败拉响警报后赶来的守卫战档位。 */
export const CURIO_ALARM_TIER: BattleTier = "t1";
