import { STAGE_W, WORLD_W } from "./level";

/** 各图层相对镜头的移动比例：越远越慢，前景比世界层更快以制造纵深。 */
export const PARALLAX = {
  sky: 0,
  dome: 0.08,
  tower: 0.25,
  island: 0.55,
  world: 1,
  foreground: 1.25,
} as const;

export type LayerName = keyof typeof PARALLAX;

/** 让图层恰好覆盖镜头全程所需的宽度。 */
export function layerWidth(factor: number): number {
  return Math.ceil(STAGE_W + (WORLD_W - STAGE_W) * factor);
}

const LOOK_AHEAD = 160;

export function cameraTarget(playerX: number, facing: 1 | -1): number {
  return Math.max(0, Math.min(WORLD_W - STAGE_W, playerX - STAGE_W / 2 + facing * LOOK_AHEAD));
}

export function followCamera(camera: number, target: number, dt: number): number {
  return camera + (target - camera) * (1 - Math.exp(-dt * 5));
}
