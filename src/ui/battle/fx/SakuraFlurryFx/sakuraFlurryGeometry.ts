// ============================================================================
// 绯樱乱刃(sakura-flurry)的几何表与时间轴。
//
// 三拍: 八刀不同角度的快斩在目标身上交错留下刀痕 → 短暂留白、圆心聚光 →
// 一记重横斩落下, 所有刀痕同时迸亮并碎成花瓣状刃屑沿各自法线飞散。
// 刀痕表手写(控制构图, 避免随机出现平行刀), 花瓣由固定种子派生。
// ============================================================================

import { seededRange } from "@/ui/battle/fx/shared/fxKit";

// 爆点 / 飘字 / 演出时长等外部时序在 animations.ts 的 ANIM 表中统一定义。
export const CUT_INTERVAL = 78; // 两刀间隔
export const CUT_SWIPE = 140; // 单刀刀光掠过时长
export const FINAL_SWIPE = 130; // 收束横斩的刀光时长, 结束时刻 = 爆点

export interface Cut {
  angle: number; // deg
  offset: number; // 沿法线的偏移(px)
  length: number;
  reverse: boolean; // true = 反手(从右往左)
}

export const CUTS: readonly Cut[] = [
  { angle: -24, offset: -30, length: 560, reverse: false },
  { angle: 38, offset: 26, length: 520, reverse: true },
  { angle: -68, offset: 12, length: 500, reverse: false },
  { angle: 14, offset: 50, length: 580, reverse: true },
  { angle: 64, offset: -40, length: 520, reverse: false },
  { angle: -44, offset: 44, length: 540, reverse: true },
  { angle: 86, offset: -8, length: 480, reverse: false },
  { angle: -4, offset: -56, length: 600, reverse: true },
];

export const FINAL_CUT: Cut = { angle: -9, offset: 0, length: 1040, reverse: false };

/** 以爆点为 0 的相对时间轴。 */
export const AROUND_IMPACT = {
  gather: { delay: -260, duration: 260 },
  coreBurst: { delay: 0, duration: 280 },
  scarBurst: { delay: 0, duration: 320 },
  finalSplit: { delay: 30, duration: 420 },
  flash: { delay: 0, duration: 380 },
  petals: { delay: 0, duration: 720 },
};

const range = seededRange(0x53414b55); // "SAKU"
const RAD = Math.PI / 180;

/** 刀痕局部坐标(u 沿刀, offset 沿法线) → 目标中心坐标。 */
function place(cut: Cut, u: number) {
  const a = cut.angle * RAD;
  return {
    x: u * Math.cos(a) - cut.offset * Math.sin(a),
    y: u * Math.sin(a) + cut.offset * Math.cos(a),
  };
}

function petalsFor(cut: Cut, count: number, reach: [number, number]) {
  return Array.from({ length: count }, (_, index) => {
    const u = ((index + 0.5) / count - 0.5) * cut.length * 0.8 + range(-20, 20);
    const { x, y } = place(cut, u);
    const side = index % 2 === 0 ? 1 : -1;
    const dir = (cut.angle + side * 90 + range(-35, 35)) * RAD;
    const dist = range(reach[0], reach[1]);
    return {
      x: Math.round(x),
      y: Math.round(y),
      dx: Math.round(Math.cos(dir) * dist),
      dy: Math.round(Math.sin(dir) * dist + range(10, 40)), // 略带下坠
      spin: Math.round(range(180, 540) * side),
      size: Math.round(range(10, 17)),
      tilt: Math.round(range(0, 360)),
      delay: Math.round(range(0, 70)),
    };
  });
}

export const PETALS = [
  ...CUTS.flatMap((cut) => petalsFor(cut, 4, [70, 170])),
  ...petalsFor(FINAL_CUT, 14, [110, 240]),
];
