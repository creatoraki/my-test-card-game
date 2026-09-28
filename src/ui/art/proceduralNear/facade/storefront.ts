import type { LightTone } from "../types";
import type { Random } from "../core/base/random";
import { AMBIENT_SHADOW, LED, RIM, RIM_HOT, STEEL, ALLOY, lightCore, lightGlow, rgba, type Ramp } from "../core/base/palette";
import { shadeDown } from "../core/base/shading";
import { fillTexture, rectPath, weatherShape } from "../core/base/grain";
import { radialGlow } from "../core/light/glow";
import { FONT } from "../core/fixtures/signs";
import { BASE } from "./storey";

// 店面：橱窗（货架与商品）、玻璃门、卷帘门（全关 / 半开透光）。底边都落在 BASE 上，门高 ≈ 2.3~2.6m。

const GOODS = ["#3b5fae", "#a0457f", "#2e8c95", "#6c4fae", "#c7c9d9", "#304060", "#8b6a3a", "#b0304e"];

/** 室内：灯光色的后墙 + 顶灯 + 三层货架与商品色块 + 柜台剪影。 */
export function shopInterior(ctx: CanvasRenderingContext2D, r: Random, x: number, y: number, w: number, h: number, tone: LightTone, dim = 1): void {
  const core = lightCore(tone);
  const glow = lightGlow(tone);
  ctx.fillStyle = "#0c0b16";
  ctx.fillRect(x, y, w, h);
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, rgba(core, 0.85 * dim));
  g.addColorStop(0.25, rgba(glow, 0.55 * dim));
  g.addColorStop(1, rgba(glow, 0.22 * dim));
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = rgba(core, 0.95 * dim);
  for (let lx = x + 24; lx < x + w - 30; lx += 90) ctx.fillRect(lx, y + 6, 46, 4);
  const shelves = [0.3, 0.5, 0.7];
  for (const t of shelves) {
    const sy = y + h * t;
    ctx.fillStyle = rgba("#05050b", 0.75);
    ctx.fillRect(x, sy, w, 5);
    let gx = x + r.range(2, 10);
    while (gx < x + w - 8) {
      const gw = r.range(8, 22);
      const gh = r.range(16, h * 0.16);
      if (r.chance(0.82)) {
        ctx.fillStyle = rgba(r.pick(GOODS), 0.85 * dim);
        ctx.fillRect(gx, sy - gh, gw, gh);
        ctx.fillStyle = rgba("#ffffff", 0.25 * dim);
        ctx.fillRect(gx, sy - gh, 2, gh);
      }
      gx += gw + r.range(1, 5);
    }
  }
  ctx.fillStyle = rgba("#05050b", 0.85);
  if (r.chance(0.6)) ctx.fillRect(x + r.range(0, w * 0.5), y + h * 0.78, w * r.range(0.3, 0.5), h * 0.22);
}

/** 玻璃上的反光与贴纸。 */
function glassFace(ctx: CanvasRenderingContext2D, r: Random, x: number, y: number, w: number, h: number): void {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.globalCompositeOperation = "lighter";
  const s = ctx.createLinearGradient(x, y, x + w * 0.8, y + h);
  s.addColorStop(0, rgba(RIM, 0.05));
  s.addColorStop(0.32, rgba(RIM, 0));
  s.addColorStop(0.4, rgba(RIM, 0.16));
  s.addColorStop(0.45, rgba(RIM, 0.02));
  s.addColorStop(0.52, rgba(RIM, 0.09));
  s.addColorStop(0.6, rgba(RIM, 0));
  ctx.fillStyle = s;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
  const stickers = r.int(0, 3);
  for (let i = 0; i < stickers; i++) {
    const sw = r.range(40, 90);
    const sh = r.range(40, 70);
    const sx = x + r.range(10, Math.max(11, w - sw - 10));
    const sy = y + r.range(h * 0.35, h * 0.7);
    ctx.fillStyle = rgba(r.pick(["#d9dcef", "#ff5ad2", "#5ff0ff", "#ffb347"]), 0.6);
    ctx.fillRect(sx, sy, sw, sh);
    ctx.fillStyle = rgba("#101020", 0.8);
    ctx.font = `900 ${Math.round(sh * 0.4)}px ${FONT}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(r.pick(["特价", "营业", "折扣", "新品", "招工"]), sx + sw / 2, sy + sh / 2);
  }
}

/** 橱窗：金属框 + 室内 + 玻璃反光 + 底部踢脚板。 */
export function shopWindow(ctx: CanvasRenderingContext2D, r: Random, x: number, y: number, w: number, h: number, tone: LightTone, ramp: Ramp = ALLOY): void {
  const kick = 40;
  shopInterior(ctx, r, x, y, w, h - kick, tone);
  glassFace(ctx, r, x, y, w, h - kick);
  shadeDown(ctx, x, y, w, 30, 0.6);
  ctx.fillStyle = ramp.dark;
  ctx.fillRect(x, y + h - kick, w, kick);
  ctx.fillStyle = ramp.light;
  ctx.fillRect(x, y + h - kick, w, 2);
  ctx.fillStyle = STEEL.deep;
  ctx.fillRect(x - 6, y - 6, w + 12, 7);
  ctx.fillRect(x - 6, y - 6, 7, h + 6);
  ctx.fillRect(x + w - 1, y - 6, 7, h + 6);
  ctx.fillStyle = rgba(RIM_HOT, 0.3);
  ctx.fillRect(x + w + 4, y - 6, 1.5, h + 6);
  // 室内光在门前地面与框上的溢光。
  radialGlow(ctx, x + w / 2, y + h * 0.5, w * 0.6, lightGlow(tone), 0.12);
}

/** 双扇玻璃门：门框、门内灯光、推杆与门禁读卡器。 */
export function glassDoor(ctx: CanvasRenderingContext2D, r: Random, cx: number, w: number, h: number, tone: LightTone): void {
  const x = Math.round(cx - w / 2);
  const y = BASE - h;
  shopInterior(ctx, r, x, y, w, h, tone, 0.8);
  glassFace(ctx, r, x, y, w, h);
  shadeDown(ctx, x, y, w, 40, 0.55);
  ctx.fillStyle = STEEL.dark;
  ctx.fillRect(x - 8, y - 8, w + 16, 10);
  ctx.fillRect(x - 8, y, 8, h);
  ctx.fillRect(x + w, y, 8, h);
  ctx.fillRect(cx - 3, y, 6, h);
  ctx.fillStyle = ALLOY.hi;
  ctx.fillRect(cx - 18, y + h * 0.48, 4, 70);
  ctx.fillRect(cx + 14, y + h * 0.48, 4, 70);
  ctx.fillStyle = rgba(RIM_HOT, 0.35);
  ctx.fillRect(x - 8, y - 8, w + 16, 1.2);
  ctx.fillStyle = STEEL.deep;
  ctx.fillRect(x + w + 14, y + h * 0.45, 16, 24);
  ctx.fillStyle = LED.green;
  ctx.fillRect(x + w + 19, y + h * 0.45 + 5, 5, 3);
  radialGlow(ctx, x + w + 21, y + h * 0.45 + 6, 14, LED.green, 0.45);
  radialGlow(ctx, cx, BASE - 10, w * 0.7, lightGlow(tone), 0.18);
}

/** 卷帘门：顶部卷轴箱 + 横向叶片 + 底梁锁扣；open > 0 时底部拉起一段，露出室内灯光。 */
export function rollerShutter(
  ctx: CanvasRenderingContext2D,
  r: Random,
  x: number,
  w: number,
  h: number,
  tone: LightTone,
  open: number,
  ramp: Ramp = ALLOY,
): void {
  const y = BASE - h;
  const gap = Math.round(h * open);
  const slatBottom = BASE - gap;
  if (gap > 0) {
    shopInterior(ctx, r, x, slatBottom, w, gap, tone, 0.9);
    radialGlow(ctx, x + w / 2, BASE - gap * 0.3, w * 0.5, lightGlow(tone), 0.22);
  }
  for (let sy = y + 30; sy < slatBottom; sy += 12) {
    const g = ctx.createLinearGradient(0, sy, 0, sy + 12);
    g.addColorStop(0, ramp.light);
    g.addColorStop(0.35, ramp.mid);
    g.addColorStop(0.8, ramp.dark);
    g.addColorStop(1, ramp.deep);
    ctx.fillStyle = g;
    ctx.fillRect(x, sy, w, Math.min(12, slatBottom - sy));
  }
  weatherShape(ctx, rectPath(x, y + 30, w, slatBottom - y - 30), x, y + 30, w, slatBottom - y - 30, Math.round(x) % 401, 0.06, 1.6);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y + 30, w, slatBottom - y - 30);
  ctx.clip();
  fillTexture(ctx, "grime", x, y, w, h, 0.6, Math.round(x) % 173, 1.8);
  ctx.restore();
  // 底梁 + 两个锁扣。
  ctx.fillStyle = STEEL.dark;
  ctx.fillRect(x, slatBottom - 14, w, 14);
  ctx.fillStyle = STEEL.hi;
  ctx.fillRect(x, slatBottom - 14, w, 2);
  ctx.fillStyle = ALLOY.hi;
  ctx.fillRect(x + w * 0.2, slatBottom - 11, 18, 8);
  ctx.fillRect(x + w * 0.8 - 18, slatBottom - 11, 18, 8);
  // 卷轴箱与两侧导轨。
  ctx.fillStyle = STEEL.mid;
  ctx.fillRect(x - 10, y, w + 20, 32);
  ctx.fillStyle = STEEL.hi;
  ctx.fillRect(x - 10, y, w + 20, 2);
  ctx.fillStyle = STEEL.deep;
  ctx.fillRect(x - 10, y + 30, w + 20, 3);
  ctx.fillRect(x - 10, y + 32, 10, BASE - y - 32);
  ctx.fillRect(x + w, y + 32, 10, BASE - y - 32);
  ctx.fillStyle = rgba(RIM_HOT, 0.3);
  ctx.fillRect(x + w + 8, y + 32, 1.5, BASE - y - 32);
  shadeDown(ctx, x, y + 33, w, 36, 0.5);
}

/** 门前踏步：一级浅台阶，门洞底部的深色门槛。 */
export function doorStep(ctx: CanvasRenderingContext2D, cx: number, w: number, ramp: Ramp): void {
  const x = cx - w / 2 - 16;
  ctx.fillStyle = ramp.mid;
  ctx.fillRect(x, BASE - 12, w + 32, 12);
  ctx.fillStyle = ramp.hi;
  ctx.fillRect(x, BASE - 12, w + 32, 2);
  ctx.fillStyle = rgba(AMBIENT_SHADOW, 0.5);
  ctx.fillRect(x, BASE - 3, w + 32, 3);
}
