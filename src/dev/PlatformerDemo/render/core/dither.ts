import { pack } from "./pixelBuffer";
import type { Ramp } from "./palette";

// 4×4 Bayer 有序抖动：只在两个色阶交界的一小段区间内交错像素，其余区域保持纯色块。
const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

/** 当前像素的抖动阈值，范围 (0, 1)。 */
export function bayer(x: number, y: number): number {
  return (BAYER4[(y & 3) * 4 + (x & 3)] + 0.5) / 16;
}

export type PackedRamp = readonly number[];

const rampCache = new WeakMap<Ramp, PackedRamp>();

export function packRamp(ramp: Ramp): PackedRamp {
  let packed = rampCache.get(ramp);
  if (!packed) {
    packed = ramp.map((hex) => pack(hex));
    rampCache.set(ramp, packed);
  }
  return packed;
}

/**
 * 按明度 v∈[0,1] 从色阶取色。spread 控制交界处抖动区间占比：
 * 0 为硬切换，1 为整段渐变抖动；默认 0.45 让大部分像素保持纯色。
 */
export function shadeRamp(ramp: PackedRamp, v: number, x: number, y: number, spread = 0.45): number {
  const last = ramp.length - 1;
  const f = Math.max(0, Math.min(1, v)) * last;
  const i = Math.min(last, Math.floor(f));
  if (i === last) return ramp[last];
  const frac = f - i;
  const t = spread <= 0 ? (frac >= 0.5 ? 1 : 0) : Math.max(0, Math.min(1, (frac - 0.5) / spread + 0.5));
  return t > bayer(x, y) ? ramp[i + 1] : ramp[i];
}

/** 两色之间按比例抖动。 */
export function ditherPick(a: number, b: number, t: number, x: number, y: number): number {
  return t > bayer(x, y) ? b : a;
}
