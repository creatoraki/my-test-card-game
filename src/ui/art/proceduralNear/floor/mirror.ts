import { NEAR_SCENE_GEOMETRY } from "../types";
import { DECK_BOTTOM } from "./walkway";

// 湿亮地面倒影：建筑画完后，把本块画布里楼脚那一段竖直翻转、压扁贴进行走带并向前淡出。
// 先以正常混合压一层暗色倒影（光面钢板的镜像），再以叠加混合补一层亮部（霓虹、全息屏在地面上的倒影）。
// 只做竖直翻转、不做横向偏移，所以相邻两块的倒影天然对齐。

const G = NEAR_SCENE_GEOMETRY;
/** 取样的楼脚高度。 */
const SOURCE_H = 170;
const DEST_Y = G.baseY + 9;
const DEST_H = DECK_BOTTOM - DEST_Y;

let scratch: HTMLCanvasElement | null = null;

function scratchContext(w: number): CanvasRenderingContext2D {
  if (!scratch) scratch = document.createElement("canvas");
  if (scratch.width < w) scratch.width = w;
  if (scratch.height !== DEST_H) scratch.height = DEST_H;
  const ctx = scratch.getContext("2d")!;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = "source-over";
  ctx.clearRect(0, 0, scratch.width, scratch.height);
  return ctx;
}

/** 在 walkway 之后调用：ctx 已平移到世界坐标（translate(-x0, 0)）。 */
export function drawMirror(ctx: CanvasRenderingContext2D, x0: number, x1: number): void {
  const w = Math.ceil(x1 - x0);
  const s = scratchContext(w);
  s.save();
  s.translate(0, DEST_H);
  s.scale(1, -DEST_H / SOURCE_H);
  s.drawImage(ctx.canvas, 0, G.baseY - SOURCE_H, w, SOURCE_H, 0, 0, w, SOURCE_H);
  s.restore();
  s.globalCompositeOperation = "destination-in";
  const fade = s.createLinearGradient(0, 0, 0, DEST_H);
  fade.addColorStop(0, "rgba(0,0,0,1)");
  fade.addColorStop(0.55, "rgba(0,0,0,0.4)");
  fade.addColorStop(1, "rgba(0,0,0,0)");
  s.fillStyle = fade;
  s.fillRect(0, 0, w, DEST_H);

  ctx.save();
  ctx.filter = "blur(1.5px)";
  ctx.globalAlpha = 0.3;
  ctx.drawImage(scratch!, 0, 0, w, DEST_H, x0, DEST_Y, w, DEST_H);
  ctx.globalCompositeOperation = "lighter";
  ctx.globalAlpha = 0.45;
  ctx.drawImage(scratch!, 0, 0, w, DEST_H, x0, DEST_Y, w, DEST_H);
  ctx.restore();
}
