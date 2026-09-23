import type { ProcFxPreset } from "@/ui/battle/choreo/animations";
import { seededRange } from "@/ui/battle/fx/shared/fxKit";

// ============================================================================
// 流星箭雨(meteor-rain): 地面法阵锁区 → 十四支光箭从天而降逐支钉地 →
// 光柱收束 → 巨箭坠击, 钉地的箭同时引爆。
//
// 坐标: 外层不旋转, 原点 = 目标中心。「地面」是一张以 GROUND_Y 为中心、
// 纵向压扁 GROUND_SQUASH 的平面: 地面坐标 (gx, gz) → 屏幕 (gx, GROUND_Y + gz * GROUND_SQUASH)。
// 波纹、法阵画在地面层里(由 CSS 统一压扁), 箭与火花画在屏幕层里。
//
// 时间轴(ms, 未缩放): 组件按 preset.impactMs / impact 等比缩放。
// ============================================================================

export const METEOR_RAIN_TIMELINE = {
  sigil: 0,
  rainStart: 240,
  rainEnd: 980,
  beacon: 880,
  finalFall: 1150,
  impact: 1300,
  total: 2150,
} as const;

export const GROUND_Y = 90;
export const GROUND_SQUASH = 0.36;
/** 光箭下落的起点距离(沿箭身反方向, px)。 */
export const FALL_DISTANCE = 760;
export const RAIN_FALL_MS = 170;

/** 接入战斗时的建议配置: impactMs + floatMs = 2000 < holdMs。 */
export const METEOR_RAIN = {
  color: "#8ef5d2",
  preset: { impactMs: 1300, floatMs: 700, damageAtImpact: true } satisfies ProcFxPreset,
  holdMs: 2250,
} as const;

const toScreen = (gx: number, gz: number) => ({ x: gx, y: GROUND_Y + gz * GROUND_SQUASH });

const r1 = seededRange(0x7e11);
const RAIN_COUNT = 14;
export const RAIN_ARROWS = Array.from({ length: RAIN_COUNT }, (_, index) => {
  // 在椭圆落区内取点, 中心留给巨箭。
  let gx = 0;
  let gz = 0;
  do {
    const angle = r1(0, Math.PI * 2);
    const radius = Math.sqrt(r1(0.12, 1));
    gx = Math.cos(angle) * radius * 250;
    gz = Math.sin(angle) * radius * 210;
  } while (Math.hypot(gx / 250, gz / 210) < 0.3);
  const span = METEOR_RAIN_TIMELINE.rainEnd - METEOR_RAIN_TIMELINE.rainStart;
  const start = METEOR_RAIN_TIMELINE.rainStart + (index / (RAIN_COUNT - 1)) * span + r1(-30, 30);
  const land = start + RAIN_FALL_MS;
  // 距中心越远, 爆点连锁越晚: 引爆像从中心向外推开。
  const detonate = Math.hypot(gx, gz) * 0.28;
  return {
    gx,
    gz,
    ...toScreen(gx, gz),
    tilt: r1(-22, -12),
    length: r1(120, 170),
    start,
    land,
    detonate,
    sparks: Array.from({ length: 4 }, () => ({
      dx: r1(-60, 60),
      dy: r1(-90, -30),
      size: r1(3, 5),
    })),
  };
});

export const METEOR_TARGET = toScreen(0, 0);

const r2 = seededRange(0x7e22);
export const METEOR_BEAMS = Array.from({ length: 16 }, (_, index) => ({
  angle: 180 + (index / 15) * 180 + r2(-6, 6),
  length: r2(180, 340),
  delay: r2(0, 50),
}));

const r3 = seededRange(0x7e33);
// 巨箭坠地的碎光: 向上半圆抛出, 远端带一点下坠。
export const METEOR_SPARKS = Array.from({ length: 32 }, () => {
  const angle = r3(195, 345) * (Math.PI / 180);
  const distance = r3(120, 330);
  return {
    dx: Math.cos(angle) * distance,
    dy: Math.sin(angle) * distance * 0.8,
    size: r3(3, 7),
    delay: r3(0, 60),
    duration: r3(380, 560),
  };
});

const r4 = seededRange(0x7e44);
export const RAIN_MOTES = Array.from({ length: 18 }, () => ({
  x: r4(-300, 300),
  y: r4(-60, 60),
  rise: r4(120, 260),
  size: r4(3, 6),
  delay: r4(60, 420),
}));
