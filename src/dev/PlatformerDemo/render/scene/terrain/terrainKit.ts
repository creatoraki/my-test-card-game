import { packRamp, shadeRamp, type PackedRamp } from "../../core/dither";
import { fbm, hash01 } from "../../core/noise";
import { RAMPS } from "../../core/palette";
import type { PixelBuffer } from "../../core/pixelBuffer";

// 地形共用：世界层色阶、光源登记，以及石砖墙面着色器。

export const T = {
  stone: packRamp(RAMPS.stone),
  moss: packRamp(RAMPS.moss),
  leaf: packRamp(RAMPS.leaf),
  bark: packRamp(RAMPS.bark),
  metal: packRamp(RAMPS.metal),
  brass: packRamp(RAMPS.brass),
  ivory: packRamp(RAMPS.ivory),
  bio: packRamp(RAMPS.bio),
  lamp: packRamp(RAMPS.lamp),
  ink: packRamp(RAMPS.ink),
  pink: packRamp(RAMPS.flowerPink),
  gold: packRamp(RAMPS.flowerGold),
} as const;

/** 世界层元素的描边与边缘光强度。 */
export const WORLD_LINE = { outline: 0.72, rim: 0.4, shade: 0.3 } as const;

/** 静态光源（像素坐标），由光照模块每帧叠加光晕。 */
export interface TerrainLight {
  x: number;
  y: number;
  radius: number;
  color: string;
  strength: number;
  /** 闪烁相位种子，0 表示稳定光源。 */
  flicker: number;
}

export interface BrickStyle {
  ramp: PackedRamp;
  /** 砖块长度与高度（像素）。 */
  len: number;
  rows: number;
  seed: number;
  /** 苔藓侵蚀程度 0~1。 */
  moss: number;
  /** 苔藓侵蚀沿 y 方向的起点（该行以上最容易长苔）。 */
  mossTop: number;
}

/**
 * 石砖着色器：错缝砌筑，每块砖有独立明度与斜角高光；灰缝压暗；表面叠岩石噪声与细裂纹，
 * 上沿按噪声长出苔藓。返回 0 表示透明。
 */
export function brickShade(x: number, y: number, top: number, s: BrickStyle): number {
  const ly = y - top;
  const course = Math.floor(ly / s.rows);
  const off = course % 2 === 0 ? 0 : Math.floor(s.len / 2);
  const bx = Math.floor((x + off) / s.len);
  const lx = (x + off) - bx * s.len;
  const ry = ly - course * s.rows;
  const mortar = ry === s.rows - 1 || lx === 0;
  const mossNoise = fbm(x * 0.14, y * 0.28, s.seed + 5, 3);
  const mossReach = s.moss * (1 - Math.max(0, y - s.mossTop) / 14);
  const mossLine = 1 - mossReach * 0.55;
  if (mossReach > 0 && mossNoise > mossLine) {
    return shadeRamp(T.moss, 0.38 + (mossNoise - mossLine) * 2.4 - ry * 0.03, x, y);
  }
  if (mortar) return s.ramp[1];
  let v = 0.5 + (hash01(bx, course, s.seed) - 0.5) * 0.22;
  if (ry === 0) v += 0.2;
  else if (ry === s.rows - 2) v -= 0.16;
  if (lx === 1) v += 0.1;
  else if (lx === s.len - 1) v -= 0.14;
  v += (fbm(x * 0.35, y * 0.35, s.seed, 2) - 0.5) * 0.28;
  if (hash01(x, y, s.seed + 3) > 0.965) v -= 0.25;
  return shadeRamp(s.ramp, v, x, y);
}

/** 横向金属梁：上沿高光、铆钉、下沿阴影。 */
export function beamShade(x: number, y: number, top: number, h: number, seed: number): number {
  const ly = y - top;
  let v = 0.55 - (ly / h) * 0.35;
  if (ly === 0) v += 0.25;
  if (ly === 2 && x % 12 === 3) return T.brass[5];
  if (ly === h - 1) v -= 0.2;
  v += (hash01(Math.floor(x / 3), ly, seed) - 0.5) * 0.08;
  return shadeRamp(T.metal, v, x, y);
}

/** 断口轮廓：让一排排砖在末端参差地断开，dir 为 -1(左端) 或 1(右端)。 */
export function crumble(x: number, y: number, edge: number, dir: -1 | 1, seed: number): boolean {
  const row = Math.floor(y / 3);
  const bite = Math.round(hash01(row, edge, seed) * 5 + (y % 7 === 0 ? 1 : 0));
  return dir === 1 ? x > edge - bite : x < edge + bite;
}

export function drawBrickWall(buf: PixelBuffer, x0: number, x1: number, top: number, bottom: number, style: BrickStyle) {
  buf.paint(x0, top, x1, bottom - 1, (x, y) => brickShade(x, y, top, style));
}
