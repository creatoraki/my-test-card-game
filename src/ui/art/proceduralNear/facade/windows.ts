import type { LightTone } from "../types";
import type { Random } from "../core/base/random";
import { AMBIENT_SHADOW, RIM, RIM_HOT, STEEL, lightCore, lightGlow, rgba, type Ramp } from "../core/base/palette";
import { shadeDown } from "../core/base/shading";
import { dripStains } from "../core/base/surfaces";
import { radialGlow } from "../core/light/glow";

// 住宅窗与玻璃幕墙：每个开口都有深度——窗洞内壁明暗、窗台受光、玻璃斜反光、室内内容与向外溢出的灯光。
// 尺寸按真实比例：住宅窗约 1.5×1.4m（195×180），窗台 0.9m 高。

export type Interior = "curtain" | "blinds" | "plain";

export interface WindowStyle {
  lit: LightTone | null;
  interior: Interior;
  grille: boolean;
  panes: 2 | 3;
}

/** 亮窗约三成；灯色以冷白为主，暖色只占少数。 */
export function pickWindowStyle(r: Random, litChance = 0.3, grilleChance = 0.35): WindowStyle {
  let lit: LightTone | null = null;
  if (r.chance(litChance)) {
    const t = r.next();
    lit = t < 0.42 ? "white" : t < 0.58 ? "cyan" : t < 0.7 ? "pink" : t < 0.8 ? "violet" : "warm";
  }
  return {
    lit,
    interior: r.pick(["curtain", "blinds", "plain", "curtain"] as const),
    grille: r.chance(grilleChance),
    panes: r.chance(0.6) ? 2 : 3,
  };
}

/** 暗玻璃：映着天光的蓝紫渐变 + 两道斜向反光。 */
function darkGlass(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  const g = ctx.createLinearGradient(x, y, x + w * 0.4, y + h);
  g.addColorStop(0, "#28336198");
  g.addColorStop(0.45, "#0b0f22");
  g.addColorStop(1, "#131a36");
  ctx.fillStyle = "#0a0d1c";
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
}

function glassSheen(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, strength: number): void {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.globalCompositeOperation = "lighter";
  const s = ctx.createLinearGradient(x, y, x + w, y + h * 0.7);
  s.addColorStop(0, rgba(RIM, 0));
  s.addColorStop(0.3, rgba(RIM, 0));
  s.addColorStop(0.36, rgba(RIM, 0.22 * strength));
  s.addColorStop(0.42, rgba(RIM, 0.04 * strength));
  s.addColorStop(0.5, rgba(RIM, 0.12 * strength));
  s.addColorStop(0.56, rgba(RIM, 0));
  ctx.fillStyle = s;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

/** 亮着的室内：顶亮底暗的灯光色 + 窗帘 / 百叶 / 家具剪影。 */
function litRoom(ctx: CanvasRenderingContext2D, r: Random, x: number, y: number, w: number, h: number, tone: LightTone, interior: Interior): void {
  const core = lightCore(tone);
  const glow = lightGlow(tone);
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, rgba(core, 0.9));
  g.addColorStop(0.35, rgba(glow, 0.75));
  g.addColorStop(1, rgba(glow, 0.4));
  ctx.fillStyle = "#0d0c18";
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
  // 家具剪影：柜子、盆栽，偶尔一个人影。
  ctx.fillStyle = rgba("#07060e", 0.7);
  if (r.chance(0.6)) {
    const cw = w * r.range(0.25, 0.4);
    const cx = x + r.range(0, w - cw);
    ctx.fillRect(cx, y + h * 0.55, cw, h * 0.45);
  }
  if (r.chance(0.35)) {
    const px = x + r.range(0.2, 0.8) * w;
    const py = y + h * 0.45;
    ctx.beginPath();
    ctx.arc(px, py, h * 0.07, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(px, py + h * 0.3, h * 0.13, h * 0.22, 0, Math.PI, 0);
    ctx.lineTo(px + h * 0.13, y + h);
    ctx.lineTo(px - h * 0.13, y + h);
    ctx.closePath();
    ctx.fill();
  }
  if (interior === "curtain") {
    for (const side of [0, 1]) {
      const cw = w * r.range(0.18, 0.34);
      const cx = side ? x + w - cw : x;
      ctx.fillStyle = rgba("#1a1628", 0.78);
      ctx.fillRect(cx, y, cw, h);
      for (let fx = cx + 5; fx < cx + cw - 3; fx += 11) {
        ctx.fillStyle = rgba(core, 0.16);
        ctx.fillRect(fx, y, 3, h);
        ctx.fillStyle = rgba("#000000", 0.3);
        ctx.fillRect(fx + 5, y, 3, h);
      }
    }
    ctx.fillStyle = rgba("#000000", 0.6);
    ctx.fillRect(x, y + 3, w, 4);
  } else if (interior === "blinds") {
    const down = h * r.range(0.3, 0.75);
    for (let by = y; by < y + down; by += 8) {
      ctx.fillStyle = rgba("#141220", 0.72);
      ctx.fillRect(x, by, w, 5);
      ctx.fillStyle = rgba(core, 0.22);
      ctx.fillRect(x, by, w, 1);
    }
  } else {
    ctx.fillStyle = rgba(core, 0.95);
    ctx.fillRect(x + w * 0.4, y + 4, w * 0.2, 3);
  }
}

/** 窗洞内壁：顶部深影、左侧受光、右侧背光。 */
function reveal(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  shadeDown(ctx, x, y, w, 26, 0.75);
  ctx.fillStyle = rgba("#9fb0e8", 0.08);
  ctx.fillRect(x, y, 6, h);
  ctx.fillStyle = rgba(AMBIENT_SHADOW, 0.5);
  ctx.fillRect(x + w - 7, y, 7, h);
}

/** 窗框：外框 + 竖梃 + 上亮子横档。 */
function frame(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, panes: number, ramp: Ramp): void {
  const t = 6;
  ctx.fillStyle = ramp.dark;
  ctx.fillRect(x, y, w, t);
  ctx.fillRect(x, y + h - t, w, t);
  ctx.fillRect(x, y, t, h);
  ctx.fillRect(x + w - t, y, t, h);
  const transom = y + h * 0.28;
  ctx.fillRect(x, transom - 2, w, 5);
  for (let i = 1; i < panes; i++) ctx.fillRect(x + (w * i) / panes - 2.5, transom, 5, y + h - transom);
  ctx.fillStyle = rgba(ramp.hi, 0.55);
  ctx.fillRect(x, y, w, 1.2);
  ctx.fillRect(x, transom - 2, w, 1);
  for (let i = 1; i < panes; i++) ctx.fillRect(x + (w * i) / panes - 2.5, transom, 1, y + h - transom);
}

/** 窗台：挑出的石板，顶面受光，下面挂流痕。 */
function sill(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, ramp: Ramp, seed: number): void {
  ctx.fillStyle = rgba(AMBIENT_SHADOW, 0.45);
  ctx.fillRect(x - 10, y + 10, w + 20, 14);
  ctx.fillStyle = ramp.mid;
  ctx.fillRect(x - 12, y, w + 24, 11);
  ctx.fillStyle = ramp.hi;
  ctx.fillRect(x - 12, y, w + 24, 2);
  ctx.fillStyle = ramp.deep;
  ctx.fillRect(x - 12, y + 9, w + 24, 2);
  dripStains(ctx, x - 6, y + 11, w + 12, 120, seed, 0.32);
}

/** 防盗网：凸出墙面的铁笼，竖杆 + 横档 + 底部托架，托架上放花盆杂物。 */
function grille(ctx: CanvasRenderingContext2D, r: Random, x: number, y: number, w: number, h: number): void {
  const gx = x - 14;
  const gw = w + 28;
  const gy = y - 10;
  const gh = h + 18;
  ctx.save();
  ctx.strokeStyle = rgba("#000000", 0.45);
  ctx.lineWidth = 3;
  for (let bx = gx; bx <= gx + gw; bx += 16) {
    ctx.beginPath();
    ctx.moveTo(bx + 6, gy + 6);
    ctx.lineTo(bx + 6, gy + gh + 6);
    ctx.stroke();
  }
  ctx.strokeStyle = STEEL.light;
  ctx.lineWidth = 2.5;
  for (let bx = gx; bx <= gx + gw; bx += 16) {
    ctx.beginPath();
    ctx.moveTo(bx, gy);
    ctx.lineTo(bx, gy + gh);
    ctx.stroke();
  }
  ctx.fillStyle = STEEL.mid;
  for (const hy of [gy, gy + gh * 0.33, gy + gh * 0.66]) ctx.fillRect(gx - 2, hy - 2, gw + 4, 4);
  ctx.fillStyle = STEEL.dark;
  ctx.fillRect(gx - 4, gy + gh - 6, gw + 8, 10);
  ctx.fillStyle = rgba(RIM_HOT, 0.35);
  ctx.fillRect(gx - 4, gy + gh - 6, gw + 8, 1.2);
  ctx.restore();
  const items = r.int(0, 3);
  for (let i = 0; i < items; i++) {
    const px = gx + r.range(10, gw - 40);
    const pw = r.range(20, 34);
    const ph = r.range(18, 30);
    ctx.fillStyle = r.pick(["#241c2c", "#1a2230", "#2b1d20"]);
    ctx.fillRect(px, gy + gh - 6 - ph, pw, ph);
    ctx.fillStyle = rgba("#6f86b8", 0.25);
    ctx.fillRect(px, gy + gh - 6 - ph, pw, 1.5);
    if (r.chance(0.6)) {
      ctx.fillStyle = "#0f1a1c";
      ctx.beginPath();
      ctx.ellipse(px + pw / 2, gy + gh - 6 - ph - 10, pw * 0.7, 14, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/** 住宅窗（x, y 为玻璃区左上角）。 */
export function residentialWindow(
  ctx: CanvasRenderingContext2D,
  r: Random,
  x: number,
  y: number,
  w: number,
  h: number,
  style: WindowStyle,
  ramp: Ramp,
  seed: number,
): void {
  ctx.fillStyle = ramp.deep;
  ctx.fillRect(x - 8, y - 8, w + 16, h + 12);
  ctx.fillStyle = rgba(ramp.hi, 0.3);
  ctx.fillRect(x - 8, y - 8, w + 16, 1.5);
  if (style.lit) litRoom(ctx, r, x, y, w, h, style.lit, style.interior);
  else {
    darkGlass(ctx, x, y, w, h);
    if (style.interior === "curtain") {
      ctx.fillStyle = rgba("#1c1a2c", 0.5);
      ctx.fillRect(x, y, w * 0.3, h);
    }
  }
  glassSheen(ctx, x, y, w, h, style.lit ? 0.5 : 1);
  reveal(ctx, x, y, w, h);
  frame(ctx, x, y, w, h, style.panes, STEEL);
  sill(ctx, x, y + h, w, ramp, seed);
  if (style.lit) {
    radialGlow(ctx, x + w / 2, y + h * 0.5, Math.max(w, h) * 1.1, lightGlow(style.lit), 0.14);
    ctx.fillStyle = rgba(lightGlow(style.lit), 0.35);
    ctx.fillRect(x - 12, y + h, w + 24, 2);
  }
  if (style.grille) grille(ctx, r, x, y, w, h);
}

/** 晾衣杆：两根挑出的铁架 + 一根横杆，挂几件衣物。 */
export function laundry(ctx: CanvasRenderingContext2D, r: Random, x0: number, x1: number, y: number): void {
  ctx.strokeStyle = STEEL.light;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x0, y);
  ctx.lineTo(x1, y);
  ctx.stroke();
  ctx.fillStyle = STEEL.deep;
  ctx.fillRect(x0 - 3, y - 20, 6, 24);
  ctx.fillRect(x1 - 3, y - 20, 6, 24);
  const colors = ["#2d3c66", "#5b4a7a", "#1f2a3a", "#6d6f86", "#3b2040", "#224a4e"];
  let x = x0 + r.range(8, 30);
  while (x < x1 - 30) {
    const w = r.range(28, 70);
    const h = r.range(40, 110);
    if (x + w > x1 - 6) break;
    const c = r.pick(colors);
    ctx.fillStyle = rgba("#000000", 0.35);
    ctx.fillRect(x + 6, y + 6, w, h);
    const g = ctx.createLinearGradient(x, 0, x + w, 0);
    g.addColorStop(0, c);
    g.addColorStop(0.5, rgba("#9fb0e8", 0.12));
    g.addColorStop(1, rgba("#000000", 0.3));
    ctx.fillStyle = c;
    ctx.fillRect(x, y + 2, w, h);
    ctx.fillStyle = g;
    ctx.fillRect(x, y + 2, w, h);
    if (r.chance(0.5)) {
      // 袖子。
      ctx.fillStyle = c;
      ctx.fillRect(x - 10, y + 2, 10, h * 0.4);
      ctx.fillRect(x + w, y + 2, 10, h * 0.4);
    }
    ctx.fillStyle = rgba("#000000", 0.3);
    for (let fx = x + 8; fx < x + w; fx += 14) ctx.fillRect(fx, y + 4, 2, h - 4);
    x += w + r.range(10, 40);
  }
}

/**
 * 阳台：地面为 floor，宽 w。后面一樘落地推拉门，前面 1.1m 的实心栏板或铁栏杆，
 * 半数挂晾衣杆，栏板顶上偶尔摆盆栽。
 */
export function balcony(ctx: CanvasRenderingContext2D, r: Random, cx: number, floor: number, w: number, style: WindowStyle, ramp: Ramp, seed: number): void {
  const x = cx - w / 2;
  residentialWindow(ctx, r, x + 30, floor - 330, w - 60, 320, { ...style, grille: false }, ramp, seed);
  if (r.chance(0.5)) laundry(ctx, r, x + 16, x + w - 16, floor - 350);
  const railH = 143;
  const top = floor - railH;
  ctx.fillStyle = rgba(AMBIENT_SHADOW, 0.5);
  ctx.fillRect(x - 14, floor, w + 28, 40);
  if (r.chance(0.55)) {
    const g = ctx.createLinearGradient(0, top, 0, floor);
    g.addColorStop(0, ramp.light);
    g.addColorStop(0.15, ramp.mid);
    g.addColorStop(1, ramp.dark);
    ctx.fillStyle = g;
    ctx.fillRect(x - 14, top, w + 28, railH);
    ctx.fillStyle = ramp.hi;
    ctx.fillRect(x - 18, top - 8, w + 36, 10);
    ctx.fillStyle = rgba(RIM_HOT, 0.4);
    ctx.fillRect(x - 18, top - 8, w + 36, 1.2);
    dripStains(ctx, x - 14, top + 4, w + 28, railH, seed + 5, 0.4);
  } else {
    ctx.strokeStyle = STEEL.light;
    ctx.lineWidth = 3;
    for (let bx = x - 14; bx <= x + w + 14; bx += 15) {
      ctx.beginPath();
      ctx.moveTo(bx, top);
      ctx.lineTo(bx, floor);
      ctx.stroke();
    }
    ctx.fillStyle = STEEL.mid;
    ctx.fillRect(x - 18, top - 6, w + 36, 8);
    ctx.fillStyle = rgba(RIM_HOT, 0.4);
    ctx.fillRect(x - 18, top - 6, w + 36, 1.2);
  }
  // 阳台板。
  ctx.fillStyle = ramp.mid;
  ctx.fillRect(x - 22, floor - 4, w + 44, 20);
  ctx.fillStyle = ramp.hi;
  ctx.fillRect(x - 22, floor - 4, w + 44, 2);
  ctx.fillStyle = ramp.deep;
  ctx.fillRect(x - 22, floor + 14, w + 44, 3);
  if (r.chance(0.4)) {
    const px = x + r.range(10, w - 50);
    ctx.fillStyle = "#1c1824";
    ctx.fillRect(px, top - 40, 36, 34);
    ctx.fillStyle = "#0e1a1c";
    ctx.beginPath();
    ctx.ellipse(px + 18, top - 52, 30, 20, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** 玻璃幕墙：1.5m 一道竖梃，每层一条不透明窗槛墙；亮格里是办公室的灯盘与隔断剪影。 */
export function curtainWall(ctx: CanvasRenderingContext2D, r: Random, x: number, y0: number, w: number, y1: number, storeyH: number, tone: LightTone): void {
  const cell = 195;
  const cols = Math.max(1, Math.round(w / cell));
  const cw = w / cols;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y0, w, y1 - y0);
  ctx.clip();
  darkGlass(ctx, x, y0, w, y1 - y0);
  for (let fy = y1; fy > y0 - storeyH; fy -= storeyH) {
    const glassTop = fy - storeyH + 70;
    const glassBottom = fy - 60;
    for (let c = 0; c < cols; c++) {
      const cx = x + c * cw;
      if (!r.chance(0.32)) continue;
      const core = lightCore(tone);
      const glow = lightGlow(tone);
      const g = ctx.createLinearGradient(0, glassTop, 0, glassBottom);
      g.addColorStop(0, rgba(core, 0.75));
      g.addColorStop(0.3, rgba(glow, 0.42));
      g.addColorStop(1, rgba(glow, 0.18));
      ctx.fillStyle = g;
      ctx.fillRect(cx, glassTop, cw, glassBottom - glassTop);
      ctx.fillStyle = rgba(core, 0.9);
      for (let lx = cx + 20; lx < cx + cw - 40; lx += 70) ctx.fillRect(lx, glassTop + 8, 40, 4);
      ctx.fillStyle = rgba("#06060e", 0.55);
      ctx.fillRect(cx, glassBottom - 70, cw, 70);
      if (r.chance(0.4)) ctx.fillRect(cx + r.range(10, cw - 40), glassBottom - 120, 26, 50);
    }
    // 窗槛墙：遮住楼板与吊顶的一条深色铝板。
    ctx.fillStyle = "#0b0e1c";
    ctx.fillRect(x, fy - 60, w, 130);
    ctx.fillStyle = rgba(RIM_HOT, 0.2);
    ctx.fillRect(x, fy - 60, w, 1.5);
    ctx.fillStyle = rgba(AMBIENT_SHADOW, 0.6);
    ctx.fillRect(x, fy + 68, w, 4);
  }
  glassSheen(ctx, x, y0, w, y1 - y0, 1);
  ctx.fillStyle = STEEL.dark;
  for (let c = 0; c <= cols; c++) ctx.fillRect(x + c * cw - 4, y0, 8, y1 - y0);
  ctx.fillStyle = rgba(RIM_HOT, 0.28);
  for (let c = 0; c <= cols; c++) ctx.fillRect(x + c * cw + 3, y0, 1.2, y1 - y0);
  ctx.restore();
}
