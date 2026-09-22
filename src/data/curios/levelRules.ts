import type { BattleTier } from "@/explore/types";
import type { CurioLevel } from "./types";

export interface CurioLevelRule {
  /** 奖励数量、回复量、粒子补给的倍率。 */
  reward: number;
  /** 奖励池每升一个品质档的权重乘数(品质档 n 的权重 × gradeBoost^n)。 */
  gradeBoost: number;
  /** 在决策基础失败率上追加的失败率。 */
  failAdd: number;
  /** 扣血、污染等惩罚的倍率。 */
  penalty: number;
  /** 失败引来的守卫战档位。 */
  alarmTier: BattleTier;
}

/** ★ 物件等级唯一平衡旋钮表：奖励与风险同步升级。 */
export const CURIO_LEVEL_RULES: Record<CurioLevel, CurioLevelRule> = {
  1: { reward: 1, gradeBoost: 1, failAdd: 0, penalty: 1, alarmTier: "t1" },
  2: { reward: 1.25, gradeBoost: 1.5, failAdd: 0.03, penalty: 1.2, alarmTier: "t1" },
  3: { reward: 1.5, gradeBoost: 2.2, failAdd: 0.06, penalty: 1.4, alarmTier: "t2" },
  4: { reward: 1.8, gradeBoost: 3.2, failAdd: 0.09, penalty: 1.7, alarmTier: "t3" },
  5: { reward: 2.2, gradeBoost: 4.5, failAdd: 0.12, penalty: 2, alarmTier: "t4" },
};

/** 最终失败率上限：门槛之外永远留一点意外。 */
export const CURIO_FAIL_CAP = 0.95;

export const CURIO_LEVELS: readonly CurioLevel[] = [1, 2, 3, 4, 5];

export function clampCurioLevel(value: number): CurioLevel {
  return Math.max(1, Math.min(5, Math.round(value))) as CurioLevel;
}
