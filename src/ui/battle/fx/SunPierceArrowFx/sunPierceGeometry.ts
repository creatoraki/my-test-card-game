import type { ProcFxPreset } from "@/ui/battle/choreo/animations";
import { seededRange } from "@/ui/battle/fx/shared/fxKit";

// ============================================================================
// 贯日矢(sun-pierce): 单发蓄力狙击。几何全部在「目标中心 + 外层旋转后的 X 轴」局部坐标里,
// 负 X = 射手侧(左下), 正 X = 贯穿后的出口方向(右上)。
//
// 时间轴(ms, 未缩放): 组件按 preset.impactMs / impact 等比缩放整条时间轴。
//   0    瞄准线展开 + 锁定圈收拢
//   180  弓位蓄光, 光尘回流
//   640  放箭: 枪口焰 + 音障环沿途炸开
//   760  贯穿爆点: 闪核 / 星芒 / 贯穿锥 / 放射光束 / 前向火花
//   1500 余烬散尽
// ============================================================================

export const SUN_PIERCE_TIMELINE = {
  aim: 0,
  charge: 180,
  release: 640,
  impact: 760,
  total: 1500,
} as const;

/** 弓位(局部 X): 箭从这里出发, 120ms 飞抵目标中心。 */
export const SUN_PIERCE_ORIGIN = -640;
/** 贯穿后继续飞出的距离(局部 X)。 */
export const SUN_PIERCE_EXIT = 820;
/** 外层旋转角: 从左下斜向右上射入。 */
export const SUN_PIERCE_ANGLE = -24;

/** 接入战斗时的建议配置: impactMs + floatMs = 1460 < holdMs。 */
export const SUN_PIERCE = {
  color: "#ffd98a",
  preset: { impactMs: 760, floatMs: 700, damageAtImpact: true } satisfies ProcFxPreset,
  holdMs: 1600,
} as const;

const flight = SUN_PIERCE_TIMELINE.impact - SUN_PIERCE_TIMELINE.release;

// 音障环: 箭头经过的瞬间炸开, delay 由位置反推, 与箭的线性飞行严格同步。
export const SONIC_RINGS = [-470, -300, -140].map((x, index) => ({
  x,
  delay: SUN_PIERCE_TIMELINE.release + ((x - SUN_PIERCE_ORIGIN) / -SUN_PIERCE_ORIGIN) * flight,
  scale: 1.3 + index * 0.35,
}));

const r1 = seededRange(0x5a11);
export const CHARGE_MOTES = Array.from({ length: 14 }, (_, index) => {
  const angle = (index / 14) * Math.PI * 2 + r1(-0.2, 0.2);
  const radius = r1(70, 150);
  return {
    dx: Math.cos(angle) * radius,
    dy: Math.sin(angle) * radius,
    size: r1(4, 7),
    delay: SUN_PIERCE_TIMELINE.charge + r1(0, 220),
  };
});

const r2 = seededRange(0x5a22);
export const PIERCE_BEAMS = Array.from({ length: 18 }, (_, index) => ({
  angle: (index / 18) * 360 + r2(-8, 8),
  length: r2(150, 300),
  delay: r2(0, 40),
}));

const r3 = seededRange(0x5a33);
// 前向火花占多数(贯穿后的喷溅), 少量反溅向射手侧。
export const PIERCE_SPARKS = Array.from({ length: 30 }, (_, index) => {
  const forward = index < 22;
  const angle = forward ? r3(-38, 38) : r3(150, 210);
  const distance = forward ? r3(170, 400) : r3(70, 170);
  const rad = (angle * Math.PI) / 180;
  return {
    dx: Math.cos(rad) * distance,
    dy: Math.sin(rad) * distance,
    size: r3(3, 7),
    delay: r3(0, 50),
    duration: forward ? r3(320, 460) : r3(260, 360),
  };
});

const r4 = seededRange(0x5a44);
export const PIERCE_EMBERS = Array.from({ length: 12 }, () => {
  const rad = r4(0, Math.PI * 2);
  const distance = r4(30, 90);
  return {
    x: r4(-40, 60),
    y: r4(-24, 24),
    dx: Math.cos(rad) * distance,
    dy: Math.sin(rad) * distance,
    size: r4(3, 6),
    delay: r4(90, 260),
  };
});
