// ============================================================================
// 苍岚剑气(gale-crescent)的几何表与时间轴。
//
// 三拍: 远端起手一闪, 新月形剑气带着风线与残影飞向目标 → 命中贯穿, 目标身上留下一道
// 竖直刀痕, 压力波与风刃碎屑向前方甩出、气旋外卷 → 停顿片刻后刀痕「迟发」裂开,
// 沿刀痕迸出一串横向小裂斩。外层整体倾斜 TILT, 局部坐标中剑气只沿 X 轴飞行。
// ============================================================================

import type { ProcFxPreset } from "@/ui/battle/choreo/animations";
import { seededRange } from "@/ui/battle/fx/shared/fxKit";

export const GALE_CRESCENT = {
  preset: { impactMs: 560, floatMs: 700, damageAtImpact: true } satisfies ProcFxPreset,
  holdMs: 1650,
  color: "#7df5c8",
};

export const TILT = -10;
export const LAUNCH_X = -560; // 起手点(局部 X)
export const CRESCENT_H = 420; // 新月高度
export const WOUND_H = 480; // 竖直刀痕长度

/** 起手拍(与 impactMs 无关, 固定从 0 开始); 飞行拍结束于爆点。 */
export const OPENING = {
  launch: { delay: 0, duration: 180 },
  flyStart: 40,
  ghostLag: [36, 72],
};

/** 以爆点为 0 的相对时间轴。 */
export const AROUND_IMPACT = {
  pierce: { delay: 0, duration: 220 },
  woundOpen: { delay: 0, duration: 140 },
  rupture: { delay: 300, duration: 380 },
  waves: { delay: 0, duration: 440 },
  secondWaveLag: 80,
  shards: { delay: 0, duration: 560 },
  swirls: { delay: 20, duration: 520 },
  cracks: { delay: 300, duration: 300 },
  flash: { delay: 0, duration: 260 },
};

const range = seededRange(0x47414c45); // "GALE"
const RAD = Math.PI / 180;

/** 风线: 伴飞在剑气身后, 相对起飞时刻错拍出发。 */
export const WINDS = Array.from({ length: 12 }, (_, index) => ({
  y: Math.round(((index + 0.5) / 12 - 0.5) * 400 + range(-14, 14)),
  length: Math.round(range(120, 320)),
  delay: Math.round(range(0, 220)),
  from: Math.round(LAUNCH_X - range(40, 140)),
  to: Math.round(range(-120, 20)),
}));

/** 风刃碎屑: 从刀痕上甩向前方(+X), 扇形散开。 */
export const SHARDS = Array.from({ length: 26 }, () => {
  const dir = range(-55, 55) * RAD;
  const dist = range(120, 300);
  return {
    y: Math.round(range(-WOUND_H * 0.42, WOUND_H * 0.42)),
    dir: Math.round(dir / RAD),
    dist: Math.round(dist),
    length: Math.round(range(14, 34)),
    delay: Math.round(range(0, 60)),
  };
});

/** 气旋弧: 三圈半径递增, 旋向交替。 */
export const SWIRLS = [
  { radius: 96, turn: 150, delay: 0 },
  { radius: 150, turn: -130, delay: 40 },
  { radius: 210, turn: 110, delay: 80 },
];

/** 迟发裂斩: 沿竖直刀痕的横向小刀口。 */
export const CRACKS = Array.from({ length: 11 }, (_, index) => ({
  y: Math.round(((index + 0.5) / 11 - 0.5) * WOUND_H * 0.86 + range(-10, 10)),
  length: Math.round(range(80, 170)),
  skew: Math.round(range(-14, 14)),
  delay: Math.round(range(0, 70)),
}));
