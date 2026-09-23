// ============================================================================
// 圆月轮斩(lunar-ring)的几何表与时间轴。
//
// 三拍: 刀尖绕目标画满一整圈金色月轮 → 光点沿半径回流、月轮收紧 →
// 爆点一刀横断, 月轮沿刀痕上下裂成两半飞散, 切向火花呈旋涡甩出。
// 外层整体倾斜 TILT, 所有几何都在局部坐标中布置: 横断沿 X 轴, 裂开沿 Y 轴。
// ============================================================================

import type { ProcFxPreset } from "@/ui/battle/animations";
import { seededRange } from "@/ui/battle/fx/shared/fxKit";

export const LUNAR_RING = {
  preset: { impactMs: 820, floatMs: 700, damageAtImpact: true } satisfies ProcFxPreset,
  holdMs: 1700,
  color: "#ffd27a",
};

export const RING_RADIUS = 230;
export const TILT = -12; // 整体倾斜(deg)
export const START_ANGLE = -140; // 刀尖起笔角(deg), 左上方

/** 起笔拍(与 impactMs 无关, 固定从 0 开始)。 */
export const OPENING = {
  flare: { delay: 0, duration: 180 },
  trace: { delay: 40, duration: 440 },
  ghostTrace: { delay: 95, duration: 440 },
};

/** 以爆点为 0 的相对时间轴, 负数 = 爆点之前。 */
export const AROUND_IMPACT = {
  tighten: { delay: -340, duration: 340 },
  converge: { delay: -380, duration: 300 },
  coreCharge: { delay: -220, duration: 220 },
  coreBurst: { delay: 0, duration: 260 },
  cut: { delay: 0, duration: 320 },
  halves: { delay: 20, duration: 560 },
  shock: { delay: 0, duration: 480 },
  sparks: { delay: 0, duration: 520 },
};

const range = seededRange(0x4c554e41); // "LUNA"

/** 回流光点: 沿各自角度从月轮外沿收向圆心。 */
export const CONVERGE = Array.from({ length: 18 }, (_, index) => ({
  angle: (index / 18) * 360 + range(-8, 8),
  from: RING_RADIUS + range(-12, 26),
  size: Math.round(range(4, 8)),
  delay: Math.round(range(0, 80)),
}));

/** 切向火花: 生在月轮上, 沿顺时针切线甩出并带一点外扩, 读起来像月轮还在转。 */
export const SPARKS = Array.from({ length: 36 }, (_, index) => {
  const theta = ((index / 36) * 360 + range(-5, 5)) * (Math.PI / 180);
  const tangent = range(90, 190);
  const outward = range(18, 70);
  const dx = -Math.sin(theta) * tangent + Math.cos(theta) * outward;
  const dy = Math.cos(theta) * tangent + Math.sin(theta) * outward;
  return {
    x: Math.round(Math.cos(theta) * RING_RADIUS),
    y: Math.round(Math.sin(theta) * RING_RADIUS),
    dir: Math.round((Math.atan2(dy, dx) * 180) / Math.PI),
    dist: Math.round(Math.hypot(dx, dy)),
    length: Math.round(range(10, 22)),
    delay: Math.round(range(0, 50)),
  };
});
