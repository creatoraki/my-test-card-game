import { CORRIDOR } from "@/explore/corridor/types";

/**
 * 遇敌演出时间表(毫秒，从进入遭遇阶段起算)。着色器、感叹号、压暗层都从这里取值；
 * 总长 = CORRIDOR.encounterMs，到点后以黑影胸口为圆心切入玻璃碎裂。
 */
export const ENCOUNTER_TIMING = {
  /** 头顶感叹号开始淡出。 */
  alertOutMs: 1650,
  /** 地面开始渗出黑泥。 */
  shadowStartMs: 350,
  /** 黑泥向上拉起成人形的起止。 */
  riseStartMs: 700,
  riseEndMs: 1500,
  /** 光眼睁开。 */
  eyesMs: 1500,
  /** 全屏开始压暗。 */
  dimStartMs: 1650,
  totalMs: CORRIDOR.encounterMs,
} as const;
