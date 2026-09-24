import { PARALLAX, layerWidth, type LayerName } from "../../engine/camera";
import { STAGE_H, STAGE_W, WORLD_W } from "../../engine/level";

// 像素网格：设计画布 1920×1080 按 4 倍像素绘制，低分辨率画布为 480×270。
export const PX = 4;
export const SCREEN_W = STAGE_W / PX;
export const SCREEN_H = STAGE_H / PX;
export const WORLD_PX_W = Math.ceil(WORLD_W / PX);

/** 设计 px → 像素网格坐标（四舍五入到整像素）。 */
export function toPx(value: number): number {
  return Math.round(value / PX);
}

/** 视差图层在像素网格下的宽度。 */
export function layerPxWidth(name: LayerName): number {
  return Math.ceil(layerWidth(PARALLAX[name]) / PX) + 2;
}

/** 镜头先对齐到像素网格，再按视差比例取整，保证所有图层都落在整数像素上。 */
export function cameraPx(camera: number): number {
  return Math.round(camera / PX);
}

export function layerOffset(camPx: number, name: LayerName): number {
  return Math.round(camPx * PARALLAX[name]);
}
