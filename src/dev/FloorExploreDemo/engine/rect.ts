import type { Vec2 } from "../types";

/** 轴对齐矩形(xz 平面)。 */
export interface Rect { x0: number; z0: number; x1: number; z1: number }

export function inRect(rect: Rect, x: number, z: number): boolean {
  return x >= rect.x0 && x <= rect.x1 && z >= rect.z0 && z <= rect.z1;
}

/** 旋转后的 w×d 占地取包围盒, pad 为外扩量(用于把角色半径并进障碍)。 */
export function footprintRect(x: number, z: number, w: number, d: number, rot: number, pad = 0): Rect {
  const c = Math.abs(Math.cos(rot));
  const s = Math.abs(Math.sin(rot));
  const hw = (w * c + d * s) / 2 + pad;
  const hd = (w * s + d * c) / 2 + pad;
  return { x0: x - hw, x1: x + hw, z0: z - hd, z1: z + hd };
}

export function distance(a: Vec2, b: Vec2): number {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

/** 让模型本地 +z 指向 (dx, dz) 的偏航角。 */
export function yawOf(dx: number, dz: number): number {
  return Math.atan2(dx, dz);
}

/** 角度差归一到 (-π, π]。 */
export function angleDelta(from: number, to: number): number {
  let d = (to - from) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export function approachAngle(from: number, to: number, rate: number): number {
  return from + angleDelta(from, to) * Math.min(1, rate);
}
