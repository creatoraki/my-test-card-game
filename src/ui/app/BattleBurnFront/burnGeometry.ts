// 烧穿段的火线几何: 以冲击点为圆心的星形多边形, 顶点半径 = 基准半径 × 方向速度 + 细碎抖动。
//
// 形态依据: 纸张燃烧不是匀速的圆 —— 纤维疏密不同, 有的方向烧得快、窜出火舌,
// 有的方向迟滞成凹口。于是每个方向有一个空间连贯的速度系数(周期 fbm, 首尾闭合),
// 再叠一层随时间游走的小幅抖动, 让边缘一直在「啃」而不是整体放大。
// 半径逐顶点单调不减: 烧掉的纸不会长回来。
//
// 时间轴(总长 BATTLE_BURN_MS):
//   0 ─ HEAT_MS          烫红: 只有焦斑, 孔洞半径为 0
//   HEAT_MS ─ SPREAD_END  扩散: 先慢后快地烧满全屏
//   SPREAD_END ─ 结束     火线已全部在屏外, 画布清空

import { BATTLE_BURN_MS } from "@/ui/app/shared/transitions";

export interface Point {
  x: number;
  y: number;
}

export const BURN_VERTICES = 144;
export const HEAT_MS = 240;
export const SPREAD_END_MS = BATTLE_BURN_MS - 100;
/** 孔洞外侧焦痕带的最大宽度(px)。铺满判定要把它一并推出屏外。 */
export const SCORCH_BAND = 70;
/** 细碎抖动的幅度(px)。 */
const JAG_PX = 9;
/** 方向速度系数的振幅: 1 ± SPEED_SPREAD。 */
const SPEED_SPREAD = 0.36;

const randomSigned = () => Math.random() * 2 - 1;
const makeLattice = (size: number) => Array.from({ length: size }, randomSigned);

/** 周期一维值噪声: a ∈ [0,1) 绕一圈, lattice 首尾相接, 返回约 [-1,1]。 */
export function periodicNoise(lattice: number[], a: number): number {
  const size = lattice.length;
  const x = (((a % 1) + 1) % 1) * size;
  const index = Math.floor(x);
  const f = x - index;
  const s = f * f * (3 - 2 * f);
  return lattice[index % size] * (1 - s) + lattice[(index + 1) % size] * s;
}

export interface BurnFront {
  origin: Point;
  width: number;
  height: number;
  /** 每个顶点的单位方向。 */
  dirX: Float32Array;
  dirY: Float32Array;
  /** 方向速度系数(约 0.64~1.36)。 */
  speed: Float32Array;
  /** 当前半径(单调不减)。 */
  radii: Float32Array;
  /** 当前顶点, 每帧原地复用。 */
  points: Point[];
  /** 扩散终点的基准半径: 保证最慢的方向也把焦痕带推出屏外。 */
  reach: number;
  jagLattice: number[];
  emberLattice: number[];
}

export function createBurnFront(origin: Point, width: number, height: number): BurnFront {
  const coarse = makeLattice(4);
  const middle = makeLattice(9);
  const fine = makeLattice(19);
  const dirX = new Float32Array(BURN_VERTICES);
  const dirY = new Float32Array(BURN_VERTICES);
  const speed = new Float32Array(BURN_VERTICES);
  const phase = Math.random();
  let minSpeed = Infinity;
  for (let index = 0; index < BURN_VERTICES; index++) {
    const a = index / BURN_VERTICES;
    const angle = a * Math.PI * 2;
    dirX[index] = Math.cos(angle);
    dirY[index] = Math.sin(angle);
    const fbm =
      periodicNoise(coarse, a + phase) * 0.55 + periodicNoise(middle, a) * 0.3 + periodicNoise(fine, a) * 0.15;
    speed[index] = 1 + fbm * SPEED_SPREAD;
    minSpeed = Math.min(minSpeed, speed[index]);
  }
  const cover = Math.max(
    Math.hypot(origin.x, origin.y),
    Math.hypot(width - origin.x, origin.y),
    Math.hypot(origin.x, height - origin.y),
    Math.hypot(width - origin.x, height - origin.y),
  );
  return {
    origin,
    width,
    height,
    dirX,
    dirY,
    speed,
    radii: new Float32Array(BURN_VERTICES),
    points: Array.from({ length: BURN_VERTICES }, () => ({ x: origin.x, y: origin.y })),
    reach: (cover + SCORCH_BAND + JAG_PX * 2) / minSpeed,
    jagLattice: makeLattice(37),
    emberLattice: makeLattice(29),
  };
}

export type BurnStage = "heat" | "spread" | "done";

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

/** 扩散进度 0~1 → 基准半径占比: 起步慢、越烧越快, 像火势被自己带起来。 */
function spreadEase(u: number): number {
  return 0.22 * u + 0.78 * u ** 2.1;
}

/** 推进到 t(ms), 原地更新 radii / points 并返回当前阶段。 */
export function advanceFront(front: BurnFront, t: number): BurnStage {
  if (t < HEAT_MS) return "heat";
  if (t >= SPREAD_END_MS) return "done";
  const u = clamp01((t - HEAT_MS) / (SPREAD_END_MS - HEAT_MS));
  // 刚烧穿时先有一个几像素的小孔, 否则第一帧的孔洞只是一个点。
  const base = 5 + spreadEase(u) * front.reach;
  // 抖动在孔还很小时收敛, 免得几像素的孔被抖成锯齿星。
  const jagScale = JAG_PX * clamp01(base / 60);
  const drift = t * 0.00009;
  for (let index = 0; index < BURN_VERTICES; index++) {
    const a = index / BURN_VERTICES;
    const target = base * front.speed[index] + periodicNoise(front.jagLattice, a + drift) * jagScale;
    const radius = Math.max(front.radii[index], target);
    front.radii[index] = radius;
    const point = front.points[index];
    point.x = front.origin.x + front.dirX[index] * radius;
    point.y = front.origin.y + front.dirY[index] * radius;
  }
  return "spread";
}

/** 第 index 段火线在 t 时刻的亮度 0~1: 空间上一段亮一段暗, 时间上缓慢游走并轻微闪烁。 */
export function emberGlow(front: BurnFront, index: number, t: number): number {
  const a = index / BURN_VERTICES;
  const slow = periodicNoise(front.emberLattice, a + t * 0.00011);
  const flicker = Math.sin(t * 0.021 + index * 1.7) * 0.18;
  return clamp01(0.55 + slow * 0.5 + flicker);
}
