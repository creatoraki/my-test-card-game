import { NEAR_SCENE_GEOMETRY } from "../types";
import { AMBIENT_SHADOW, FOG_MIST, FOG_TINT, RIM, rgba } from "../core/base/palette";
import { fillTexture } from "../core/base/grain";

// 全局大气：source-atop 只作用在已画出的像素上，天空保持透明，远景照常透出。
// 颜色取自远景：高处靛蓝紫空气透视、楼脚一层蓝紫薄雾。

const G = NEAR_SCENE_GEOMETRY;

/** 后排雾化：整体压成与远景同色的蓝紫剪影，越靠近地面雾越浓。 */
export function fogBackRow(ctx: CanvasRenderingContext2D, x0: number, x1: number): void {
  ctx.save();
  ctx.globalCompositeOperation = "source-atop";
  ctx.fillStyle = rgba(FOG_TINT, 0.68);
  ctx.fillRect(x0, 0, x1 - x0, G.baseY);
  const mist = ctx.createLinearGradient(0, 0, 0, G.baseY);
  mist.addColorStop(0, rgba(FOG_MIST, 0.1));
  mist.addColorStop(1, rgba(FOG_MIST, 0.55));
  ctx.fillStyle = mist;
  ctx.fillRect(x0, 0, x1 - x0, G.baseY);
  ctx.restore();
}

/** 前排统一处理：轻微脏污、贴地压暗、楼脚蓝紫薄雾、高处空气透视。 */
export function weatherFront(ctx: CanvasRenderingContext2D, x0: number, x1: number): void {
  const w = x1 - x0;
  ctx.save();
  ctx.globalCompositeOperation = "source-atop";
  fillTexture(ctx, "grime", x0, 0, w, G.baseY, 0.16, 0, 2);
  const ao = ctx.createLinearGradient(0, G.baseY - 140, 0, G.baseY);
  ao.addColorStop(0, rgba(AMBIENT_SHADOW, 0));
  ao.addColorStop(1, rgba(AMBIENT_SHADOW, 0.4));
  ctx.fillStyle = ao;
  ctx.fillRect(x0, G.baseY - 140, w, 140);
  const mist = ctx.createLinearGradient(0, G.baseY - 200, 0, G.baseY);
  mist.addColorStop(0, rgba(FOG_MIST, 0));
  mist.addColorStop(1, rgba(FOG_MIST, 0.2));
  ctx.fillStyle = mist;
  ctx.fillRect(x0, G.baseY - 200, w, 200);
  const air = ctx.createLinearGradient(0, 0, 0, 320);
  air.addColorStop(0, rgba(FOG_TINT, 0.4));
  air.addColorStop(1, rgba(FOG_TINT, 0));
  ctx.fillStyle = air;
  ctx.fillRect(x0, 0, w, 320);
  ctx.restore();
}

/** 前景设施：离镜头最近、背对城市光，整体压暗偏冷，只留轮廓逆光，读出前后层次。 */
export function weatherFore(ctx: CanvasRenderingContext2D, x0: number, x1: number): void {
  const w = x1 - x0;
  ctx.save();
  ctx.globalCompositeOperation = "source-atop";
  const g = ctx.createLinearGradient(0, 0, 0, G.foreBaseY);
  g.addColorStop(0, rgba(AMBIENT_SHADOW, 0.25));
  g.addColorStop(1, rgba(AMBIENT_SHADOW, 0.5));
  ctx.fillStyle = g;
  ctx.fillRect(x0, 0, w, G.height);
  ctx.fillStyle = rgba(RIM, 0.06);
  ctx.fillRect(x0, 0, w, G.height);
  ctx.restore();
}

/** 前景设施在唇边上的接地影子（画在设施之前）。 */
export function foreGround(ctx: CanvasRenderingContext2D, x: number, w: number): void {
  const g = ctx.createLinearGradient(0, G.foreBaseY - 6, 0, G.foreBaseY + 20);
  g.addColorStop(0, rgba(AMBIENT_SHADOW, 0));
  g.addColorStop(0.4, rgba(AMBIENT_SHADOW, 0.55));
  g.addColorStop(1, rgba(AMBIENT_SHADOW, 0));
  ctx.fillStyle = g;
  ctx.fillRect(x - 20, G.foreBaseY - 6, w + 40, 26);
}
