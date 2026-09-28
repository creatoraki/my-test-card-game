import { NEAR_SCENE_GEOMETRY } from "../types";
import { AMBIENT_SHADOW, RIM_HOT, rgba, type Ramp } from "../core/base/palette";
import { shadeDown } from "../core/base/shading";
import { dripStains } from "../core/base/surfaces";
import { fillTexture } from "../core/base/grain";
import { rimEdge } from "../core/light/rim";

// 楼层骨架：楼板腰线、檐口女儿墙、壁柱、勒脚。所有城市建筑都用这套尺子，保证层高一致（一层 = 两倍身高）。

const G = NEAR_SCENE_GEOMETRY;
export const BASE = G.baseY;
export const M = G.meter;
export const STOREY = G.storey;

/** 第 n 层楼板线的 y（0 为地面，可为小数）。 */
export const floorY = (n: number) => Math.round(BASE - n * STOREY);

/** 楼板腰线：挑出墙面的一道混凝土带，顶面受光、底面压暗并向墙面投影。 */
export function slabBand(ctx: CanvasRenderingContext2D, x: number, w: number, y: number, ramp: Ramp, depth = 22, overhang = 10): void {
  const bx = x - overhang;
  const bw = w + overhang * 2;
  const top = y - depth / 2;
  shadeDown(ctx, x, top + depth, w, 54, 0.55);
  const g = ctx.createLinearGradient(0, top, 0, top + depth);
  g.addColorStop(0, ramp.hi);
  g.addColorStop(0.18, ramp.light);
  g.addColorStop(0.55, ramp.mid);
  g.addColorStop(1, ramp.deep);
  ctx.fillStyle = g;
  ctx.fillRect(bx, top, bw, depth);
  ctx.fillStyle = rgba(RIM_HOT, 0.35);
  ctx.fillRect(bx, top, bw, 1.2);
  ctx.fillStyle = ramp.deep;
  ctx.fillRect(bx, top + depth - 2, bw, 2);
  ctx.save();
  ctx.beginPath();
  ctx.rect(bx, top, bw, depth);
  ctx.clip();
  fillTexture(ctx, "grain", bx, top, bw, depth, 0.7, Math.round(x + y) % 211, 1.4);
  ctx.restore();
  dripStains(ctx, x, top + depth, w, 90, Math.round(x * 3 + y), 0.3);
}

/** 檐口 + 女儿墙：roofY 为屋面线，女儿墙高 h；压顶挑出，墙面向下渗出流痕。 */
export function parapet(ctx: CanvasRenderingContext2D, x: number, w: number, roofY: number, h: number, ramp: Ramp, seed: number): void {
  const top = roofY - h;
  const g = ctx.createLinearGradient(0, top, 0, roofY);
  g.addColorStop(0, ramp.light);
  g.addColorStop(0.3, ramp.mid);
  g.addColorStop(1, ramp.dark);
  ctx.fillStyle = g;
  ctx.fillRect(x, top, w, h);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, top, w, h);
  ctx.clip();
  fillTexture(ctx, "grain", x, top, w, h, 0.6, seed % 211, 1.5);
  fillTexture(ctx, "grime", x, top, w, h, 0.5, seed % 97, 2);
  ctx.restore();
  // 压顶：挑出 8px 的金属盖板。
  ctx.fillStyle = ramp.deep;
  ctx.fillRect(x - 8, top - 4, w + 16, 12);
  ctx.fillStyle = ramp.hi;
  ctx.fillRect(x - 8, top - 4, w + 16, 2);
  shadeDown(ctx, x, top + 8, w, 20, 0.45);
  rimEdge(ctx, x - 8, top - 4, w + 16, h + 4, 1.2);
  dripStains(ctx, x, roofY, w, 140, seed, 0.3);
}

/** 壁柱：凸出墙面的竖向柱，左侧受光、右侧背光并在墙上投出窄影。 */
export function pilaster(ctx: CanvasRenderingContext2D, x: number, y0: number, y1: number, w: number, ramp: Ramp): void {
  const h = y1 - y0;
  ctx.fillStyle = rgba(AMBIENT_SHADOW, 0.4);
  ctx.fillRect(x + w, y0, 10, h);
  const g = ctx.createLinearGradient(x, 0, x + w, 0);
  g.addColorStop(0, ramp.hi);
  g.addColorStop(0.12, ramp.light);
  g.addColorStop(0.5, ramp.mid);
  g.addColorStop(0.9, ramp.dark);
  g.addColorStop(1, ramp.deep);
  ctx.fillStyle = g;
  ctx.fillRect(x, y0, w, h);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y0, w, h);
  ctx.clip();
  fillTexture(ctx, "grain", x, y0, w, h, 0.7, Math.round(x) % 173, 1.4);
  fillTexture(ctx, "grime", x, y0, w, h, 0.5, Math.round(x) % 61, 2);
  ctx.restore();
  ctx.fillStyle = rgba(RIM_HOT, 0.3);
  ctx.fillRect(x + w - 1.5, y0, 1.5, h);
}

/** 勒脚：贴地一圈深色石材踢脚，压住楼脚与地面的接缝。 */
export function plinth(ctx: CanvasRenderingContext2D, x: number, w: number, ramp: Ramp, h = 30): void {
  const top = BASE - h;
  const g = ctx.createLinearGradient(0, top, 0, BASE);
  g.addColorStop(0, ramp.light);
  g.addColorStop(0.12, ramp.dark);
  g.addColorStop(1, ramp.deep);
  ctx.fillStyle = g;
  ctx.fillRect(x - 3, top, w + 6, h);
  ctx.fillStyle = ramp.deep;
  for (let sx = x + 90; sx < x + w; sx += 90) ctx.fillRect(sx, top, 2, h);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x - 3, top, w + 6, h);
  ctx.clip();
  fillTexture(ctx, "grime", x - 3, top, w + 6, h, 0.8, Math.round(x) % 89, 1.5);
  ctx.restore();
}

/** 楼角转角的竖向暗缝与背光：让相邻体块读出前后关系。 */
export function cornerShadow(ctx: CanvasRenderingContext2D, x: number, y0: number, y1: number, side: "left" | "right", width = 40): void {
  const g = side === "left" ? ctx.createLinearGradient(x, 0, x + width, 0) : ctx.createLinearGradient(x, 0, x - width, 0);
  g.addColorStop(0, rgba(AMBIENT_SHADOW, 0.55));
  g.addColorStop(1, rgba(AMBIENT_SHADOW, 0));
  ctx.fillStyle = g;
  ctx.fillRect(side === "left" ? x : x - width, y0, width, y1 - y0);
}
