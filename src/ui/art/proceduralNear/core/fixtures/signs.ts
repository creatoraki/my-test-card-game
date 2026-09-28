import type { NeonTone } from "../../types";
import { NEON_COLORS, rgba, STEEL } from "../base/palette";
import { createRandom } from "../base/random";
import { fillTexture } from "../base/grain";
import { radialGlow } from "../light/glow";
import { rivetLine } from "./rivets";

// 文字类装饰：霓虹招牌、喷漆模板字、破旗帜。文字全部为中文，数字编号只作装饰。

export const FONT = `"Microsoft YaHei", "PingFang SC", "Noto Sans SC", "Source Han Sans SC", sans-serif`;

/** 临街店招。 */
export const SIGN_WORDS = ["老街面馆", "平价药房", "旧货铺", "星海网吧", "阿明理发", "炭火烧烤", "自助洗衣", "典当行", "电器维修", "茶餐厅", "五金杂货", "糖水铺", "照相馆", "深夜食堂", "廉价旅馆", "二手回收"] as const;
/** 竖招牌。 */
export const VERTICAL_WORDS = ["深夜食堂", "廉价旅馆", "电器维修", "老街烧烤", "二手回收", "中医推拿", "平价药房", "麻将馆"] as const;
/** 墙面喷漆标语。 */
export const SLOGANS: readonly (readonly string[])[] = [
  ["禁止", "停车"],
  ["拆"],
  ["收购", "旧电器"],
  ["此处", "禁止", "张贴"],
  ["修不好", "就拆掉"],
  ["别回头"],
];
export const DECO_NUMBERS = ["01", "03", "06", "07", "09", "12", "17", "23"] as const;

let scratch: HTMLCanvasElement | null = null;

function scratchContext(w: number, h: number): CanvasRenderingContext2D {
  if (!scratch) scratch = document.createElement("canvas");
  if (scratch.width < w) scratch.width = Math.ceil(w);
  if (scratch.height < h) scratch.height = Math.ceil(h);
  const ctx = scratch.getContext("2d")!;
  ctx.clearRect(0, 0, scratch.width, scratch.height);
  return ctx;
}

/**
 * 喷漆模板字：先画在临时画布上，再用锈斑 / 颗粒纹理把字迹蚀掉一部分，最后贴回墙面。
 * lines 每项一行；竖排时每行传一个字。
 */
export function stencil(
  ctx: CanvasRenderingContext2D,
  lines: readonly string[],
  cx: number,
  top: number,
  size: number,
  color: string,
  alpha: number,
  shift: number,
): void {
  const lineH = size * 1.12;
  const pad = 6;
  const font = `900 ${size}px ${FONT}`;
  const probe = scratchContext(1, 1);
  probe.font = font;
  const w = Math.max(...lines.map((line) => probe.measureText(line).width)) + pad * 2;
  const h = lines.length * lineH + pad * 2;
  const s = scratchContext(w, h);
  s.font = font;
  s.textAlign = "center";
  s.textBaseline = "top";
  s.fillStyle = color;
  lines.forEach((line, i) => s.fillText(line, w / 2, pad + i * lineH));
  s.globalCompositeOperation = "destination-out";
  fillTexture(s, "rust", 0, 0, w, h, 1, shift);
  fillTexture(s, "grain", 0, 0, w, h, 1, shift * 3);
  s.globalCompositeOperation = "source-over";
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.drawImage(scratch!, 0, 0, w, h, cx - w / 2, top - pad, w, h);
  ctx.restore();
}

/** 霓虹招牌：深色底板 + 螺栓 + 发光字；vertical 时竖排。返回底板尺寸。 */
export function neonSign(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  cy: number,
  size: number,
  tone: NeonTone,
  vertical = false,
): { w: number; h: number } {
  const chars = [...text];
  const font = `900 ${size}px ${FONT}`;
  ctx.save();
  ctx.font = font;
  const w = vertical ? size * 1.5 : ctx.measureText(text).width + size * 0.9;
  const h = vertical ? chars.length * size * 1.12 + size * 0.7 : size * 1.55;
  const x = cx - w / 2;
  const y = cy - h / 2;
  ctx.fillStyle = rgba("#000000", 0.5);
  ctx.fillRect(x + 5, y + 6, w, h);
  ctx.fillStyle = "#0b0c12";
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = STEEL.mid;
  ctx.lineWidth = 3;
  ctx.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3);
  rivetLine(ctx, x + 6, y + 6, x + w - 6, y + 6, w, STEEL);
  rivetLine(ctx, x + 6, y + h - 6, x + w - 6, y + h - 6, w, STEEL);
  radialGlow(ctx, cx, cy, Math.max(w, h) * 0.75, NEON_COLORS[tone].glow, 0.35);

  const { core, glow } = NEON_COLORS[tone];
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const drawText = () => {
    if (!vertical) {
      ctx.fillText(text, cx, cy + size * 0.04);
      return;
    }
    chars.forEach((ch, i) => ctx.fillText(ch, cx, y + size * 0.35 + size * 0.56 + i * size * 1.12));
  };
  ctx.fillStyle = glow;
  ctx.shadowColor = glow;
  ctx.shadowBlur = size * 0.7;
  drawText();
  ctx.shadowBlur = size * 0.25;
  drawText();
  ctx.shadowBlur = 0;
  ctx.fillStyle = core;
  ctx.globalAlpha = 0.9;
  drawText();
  ctx.restore();
  return { w, h };
}

/** 破旗帜：挂杆 + 撕裂下缘 + 灰白徽记。 */
export function tatteredBanner(ctx: CanvasRenderingContext2D, x: number, top: number, w: number, h: number, seed: number): void {
  const rnd = createRandom(seed);
  const path = new Path2D();
  path.moveTo(x, top);
  path.lineTo(x + w, top);
  path.lineTo(x + w, top + h * rnd.range(0.7, 0.85));
  const steps = 7;
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const v = 1 - Math.abs(t - 0.5) * 0.5;
    path.lineTo(x + w * (1 - t), top + h * v * rnd.range(0.82, 1));
  }
  path.lineTo(x, top + h * rnd.range(0.7, 0.85));
  path.closePath();

  ctx.save();
  ctx.fillStyle = rgba("#000000", 0.45);
  ctx.translate(5, 6);
  ctx.fill(path);
  ctx.restore();
  const g = ctx.createLinearGradient(x, 0, x + w, 0);
  g.addColorStop(0, "#1c1c21");
  g.addColorStop(0.3, "#0d0d10");
  g.addColorStop(0.55, "#202026");
  g.addColorStop(0.8, "#0c0c0f");
  g.addColorStop(1, "#18181c");
  ctx.fillStyle = g;
  ctx.fill(path);

  const cx = x + w / 2;
  const cy = top + h * 0.34;
  const s = w * 0.32;
  ctx.fillStyle = rgba("#c9c3b8", 0.82);
  ctx.beginPath();
  ctx.moveTo(cx - s, cy - s * 0.6);
  ctx.lineTo(cx, cy + s * 0.9);
  ctx.lineTo(cx + s, cy - s * 0.6);
  ctx.lineTo(cx + s * 0.35, cy - s * 0.6);
  ctx.lineTo(cx, cy + s * 0.05);
  ctx.lineTo(cx - s * 0.35, cy - s * 0.6);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(cx - s * 0.12, cy - s * 1.05, s * 0.24, s * 0.3);

  ctx.save();
  ctx.clip(path);
  fillTexture(ctx, "grain", x, top, w, h, 1, seed % 997);
  fillTexture(ctx, "grime", x, top, w, h, 0.7, seed % 331);
  ctx.restore();

  ctx.fillStyle = STEEL.deep;
  ctx.fillRect(x - 6, top - 5, w + 12, 7);
  ctx.fillStyle = STEEL.light;
  ctx.fillRect(x - 6, top - 5, w + 12, 2);
}
