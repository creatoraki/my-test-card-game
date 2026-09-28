import type { LampSpot, StreetKind, StreetPlacement } from "../types";
import type { Random } from "../core/base/random";
import { AMBIENT_SHADOW, RIM_HOT, rgba, type Ramp } from "../core/base/palette";

// 街道设施的公共约定：尺寸按真实比例（1m ≈ 130px），底边落在 p.ground 上；绘制只用 createRandom(p.seed)。

/** 规划阶段已确定的占位信息。 */
export type SlotInfo = Pick<StreetPlacement, "x" | "width" | "ground" | "seed">;

export interface StreetSpec {
  kind: StreetKind;
  label: string;
  width: readonly [number, number];
  /** 设施自带的光源（路灯、售货机、灯箱）；门口标记恒为 false。p 已含最终种子，需要时可据此决定朝向。 */
  lamps(p: SlotInfo, rnd: Random): LampSpot[];
  draw(ctx: CanvasRenderingContext2D, p: StreetPlacement): void;
}

/** 接地阴影：压扁的径向渐变。 */
export function contactShadow(ctx: CanvasRenderingContext2D, cx: number, ground: number, w: number, alpha = 0.55): void {
  const g = ctx.createRadialGradient(cx, ground, 0, cx, ground, w * 0.6);
  g.addColorStop(0, rgba(AMBIENT_SHADOW, alpha));
  g.addColorStop(1, rgba(AMBIENT_SHADOW, 0));
  ctx.save();
  ctx.translate(cx, ground);
  ctx.scale(1, 0.16);
  ctx.translate(-cx, -ground);
  ctx.fillStyle = g;
  ctx.fillRect(cx - w * 0.6, ground - w * 0.6, w * 1.2, w * 1.2);
  ctx.restore();
}

/** 竖向圆管（立柱、灯杆）：左亮右暗 + 右缘冷色逆光。 */
export function tube(ctx: CanvasRenderingContext2D, x: number, y0: number, y1: number, w: number, ramp: Ramp): void {
  const g = ctx.createLinearGradient(x, 0, x + w, 0);
  g.addColorStop(0, ramp.dark);
  g.addColorStop(0.25, ramp.hi);
  g.addColorStop(0.5, ramp.mid);
  g.addColorStop(0.85, ramp.deep);
  g.addColorStop(1, RIM_HOT);
  ctx.fillStyle = g;
  ctx.fillRect(x, y0, w, y1 - y0);
}

/** 方盒体：顶面受光 + 左亮右暗 + 右缘逆光，用于设施外壳。 */
export function box(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, ramp: Ramp): void {
  const g = ctx.createLinearGradient(x, 0, x + w, 0);
  g.addColorStop(0, ramp.light);
  g.addColorStop(0.2, ramp.mid);
  g.addColorStop(0.8, ramp.dark);
  g.addColorStop(1, ramp.deep);
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
  const v = ctx.createLinearGradient(0, y, 0, y + h);
  v.addColorStop(0, rgba("#b8c8ff", 0.08));
  v.addColorStop(0.3, rgba("#b8c8ff", 0));
  v.addColorStop(1, rgba(AMBIENT_SHADOW, 0.35));
  ctx.fillStyle = v;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = ramp.hi;
  ctx.fillRect(x, y, w, 2);
  ctx.fillStyle = rgba(RIM_HOT, 0.45);
  ctx.fillRect(x + w - 1.5, y, 1.5, h);
}

/** 小字标签（≥18px）：深底浅字的小牌。 */
export function label(ctx: CanvasRenderingContext2D, text: string, cx: number, cy: number, color = "#c9d2e6", bg = "#0c1226"): void {
  ctx.save();
  ctx.font = `900 20px "Microsoft YaHei", "PingFang SC", sans-serif`;
  const w = ctx.measureText(text).width + 14;
  ctx.fillStyle = bg;
  ctx.fillRect(cx - w / 2, cy - 14, w, 28);
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, cx, cy + 1);
  ctx.restore();
}

/** 设施光源的便捷构造。 */
export function lightSpot(x: number, y: number, tone: LampSpot["tone"], kind: LampSpot["kind"] = "lamp"): LampSpot {
  return { x: Math.round(x), y: Math.round(y), tone, kind, door: false };
}
