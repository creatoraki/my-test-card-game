import type { ProcFxPreset } from "@/ui/battle/choreo/animations";
import { seededRange } from "@/ui/battle/fx/shared/fxKit";

// ============================================================================
// 雷殛钉矢(thunder-stake): 紫电箭钉入目标 → 符环展开、电弧乱窜、脉冲环三次加速收束 →
// 符环内塌后引爆, 八道落雷向外劈开。
//
// 坐标: 零尺寸外层钉在目标中心并整体旋转, 负 X = 射手侧。电弧用 SVG 折线,
// 视窗 viewBox 以目标中心为原点, 所以折线点直接写局部坐标。
//
// 时间轴(ms, 未缩放): 组件按 preset.impactMs / impact 等比缩放。
// ============================================================================

export const THUNDER_STAKE_TIMELINE = {
  charge: 0,
  release: 320,
  stick: 440,
  rune: 480,
  collapse: 1110,
  impact: 1200,
  total: 2050,
} as const;

export const STAKE_ORIGIN = -600;
/** 箭尖钉入目标后越过中心的深度(px)。 */
export const STAKE_DEPTH = 22;
export const STAKE_ANGLE = -36;
/** SVG 视窗半边长: 电弧与落雷都画在 ±VIEW 内。 */
export const STAKE_VIEW = 460;

/** 接入战斗时的建议配置: impactMs + floatMs = 1900 < holdMs。 */
export const THUNDER_STAKE = {
  color: "#c3a6ff",
  preset: { impactMs: 1200, floatMs: 700, damageAtImpact: true } satisfies ProcFxPreset,
  holdMs: 2100,
} as const;

/** 三次收束脉冲: 间隔与时长都在缩短, 读出「越压越紧」。 */
export const STAKE_PULSES = [
  { delay: 600, duration: 280 },
  { delay: 820, duration: 210 },
  { delay: 990, duration: 150 },
] as const;

type Point = readonly [number, number];

/** 从 r0 到 r1 沿 angle 方向的折线, 每段垂直抖动 ±jitter。 */
function zigzag(rnd: (min: number, max: number) => number, angle: number, r0: number, r1: number, segments: number, jitter: number) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const points: Point[] = [];
  for (let i = 0; i <= segments; i += 1) {
    const r = r0 + ((r1 - r0) * i) / segments;
    const offset = i === 0 ? 0 : rnd(-jitter, jitter);
    points.push([cos * r - sin * offset, sin * r + cos * offset]);
  }
  return points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
}

const r1 = seededRange(0x3c11);
// 蓄压期的短电弧: 从箭身周围窜出, 每条只亮 60~100ms, 越接近爆点越密。
export const CRACKLES = Array.from({ length: 22 }, (_, index) => {
  const progress = index / 21;
  const angle = r1(0, Math.PI * 2);
  return {
    points: zigzag(r1, angle, r1(8, 26), r1(80, 170), Math.round(r1(4, 7)), 14),
    delay: THUNDER_STAKE_TIMELINE.rune + Math.pow(progress, 0.75) * 620 + r1(-20, 20),
    duration: r1(60, 100),
    width: r1(1.5, 2.6),
  };
});

const r2 = seededRange(0x3c22);
// 爆点落雷: 八向劈开, 主干 + 一条短分叉。
export const BOLTS = Array.from({ length: 8 }, (_, index) => {
  const angle = (index / 8) * Math.PI * 2 + r2(-0.25, 0.25);
  const reach = r2(300, 420);
  const branchAngle = angle + r2(-0.6, 0.6);
  const branchFrom = reach * r2(0.35, 0.55);
  return {
    main: zigzag(r2, angle, 30, reach, 9, 26),
    branch: zigzag(r2, branchAngle, branchFrom, branchFrom + r2(80, 140), 4, 16),
    delay: r2(0, 50),
    width: r2(3, 4.5),
  };
});

// 爆点后残留的余电: 较短, 稀疏地闪几下。
export const AFTER_CRACKLES = Array.from({ length: 6 }, () => {
  const angle = r2(0, Math.PI * 2);
  return {
    points: zigzag(r2, angle, r2(20, 50), r2(110, 190), 5, 12),
    delay: THUNDER_STAKE_TIMELINE.impact + r2(220, 560),
    duration: r2(70, 110),
  };
});

const r3 = seededRange(0x3c33);
export const STAKE_SPARKS = Array.from({ length: 36 }, (_, index) => {
  const angle = (index / 36) * Math.PI * 2 + r3(-0.15, 0.15);
  const distance = r3(140, 360);
  return {
    dx: Math.cos(angle) * distance,
    dy: Math.sin(angle) * distance,
    size: r3(3, 7),
    delay: r3(0, 60),
    duration: r3(340, 520),
  };
});

// 箭身碎片: 沿箭杆(负 X 侧)散开并自转。
export const STAKE_SHARDS = Array.from({ length: 7 }, (_, index) => ({
  x: -20 - index * 26,
  dx: r3(-160, 60),
  dy: r3(-150, 150),
  rotate: r3(-260, 260),
  width: r3(14, 26),
  delay: r3(0, 30),
}));

const r4 = seededRange(0x3c44);
export const STAKE_BEAMS = Array.from({ length: 14 }, (_, index) => ({
  angle: (index / 14) * 360 + r4(-10, 10),
  length: r4(170, 320),
  delay: r4(0, 40),
}));
