import { rgba, STEEL, type Ramp } from "../base/palette";
import { cylinderFill } from "../base/shading";
import { rivetLine } from "./rivets";

// 细金属构件：爬梯、栏杆、桁架、格栅、风扇口、天线、雷达盘、空调外机。

const line = (ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number) => {
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
};

/** 竖爬梯：两根立杆 + 横档，带背光阴影。 */
export function ladder(ctx: CanvasRenderingContext2D, x: number, y0: number, y1: number, w = 18, ramp: Ramp = STEEL): void {
  ctx.save();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = rgba("#000000", 0.45);
  line(ctx, x + 3, y0 + 3, x + 3, y1);
  line(ctx, x + w + 3, y0 + 3, x + w + 3, y1);
  ctx.strokeStyle = ramp.light;
  line(ctx, x, y0, x, y1);
  line(ctx, x + w, y0, x + w, y1);
  ctx.lineWidth = 2;
  ctx.strokeStyle = ramp.mid;
  for (let y = y0 + 10; y < y1; y += 12) line(ctx, x, y, x + w, y);
  ctx.restore();
}

/** 栏杆：扶手 + 中杆 + 立柱（默认 1.1m 高，杆径随高度）。 */
export function railing(ctx: CanvasRenderingContext2D, x0: number, x1: number, y: number, h = 140, ramp: Ramp = STEEL): void {
  const k = Math.max(1, h / 40);
  const step = 26 * k;
  ctx.save();
  ctx.strokeStyle = rgba("#000000", 0.4);
  ctx.lineWidth = 2.5 * k;
  line(ctx, x0 + 3, y - h + 4, x1 + 3, y - h + 4);
  ctx.strokeStyle = ramp.light;
  line(ctx, x0, y - h, x1, y - h);
  ctx.strokeStyle = rgba(ramp.hi, 0.6);
  ctx.lineWidth = Math.max(1, k * 0.8);
  line(ctx, x0, y - h - k, x1, y - h - k);
  ctx.lineWidth = 1.5 * k;
  ctx.strokeStyle = ramp.mid;
  line(ctx, x0, y - h / 2, x1, y - h / 2);
  ctx.lineWidth = 2 * k * 0.7;
  for (let x = x0; x <= x1 + 0.5; x += Math.max(14, (x1 - x0) / Math.max(1, Math.round((x1 - x0) / step)))) {
    line(ctx, x, y - h, x, y);
  }
  ctx.restore();
}

/** 横向桁架：上下弦 + 竖杆 + 交叉斜撑。 */
export function truss(ctx: CanvasRenderingContext2D, x0: number, x1: number, y: number, h: number, ramp: Ramp = STEEL): void {
  const cell = h * 1.1;
  ctx.save();
  ctx.strokeStyle = ramp.mid;
  ctx.lineWidth = 2;
  for (let x = x0; x < x1; x += cell) {
    const xe = Math.min(x1, x + cell);
    line(ctx, x, y, xe, y + h);
    line(ctx, x, y + h, xe, y);
    line(ctx, x, y, x, y + h);
  }
  ctx.fillStyle = ramp.deep;
  ctx.fillRect(x0, y - 3, x1 - x0, 7);
  ctx.fillRect(x0, y + h - 3, x1 - x0, 7);
  ctx.fillStyle = ramp.light;
  ctx.fillRect(x0, y - 3, x1 - x0, 2);
  ctx.fillRect(x0, y + h - 3, x1 - x0, 2);
  ctx.restore();
}

/** 网格格栅；glow 为格栅后的内光（炉口 / 机房）。 */
export function grille(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, step: number, ramp: Ramp, glow?: string): void {
  ctx.fillStyle = ramp.deep;
  ctx.fillRect(x, y, w, h);
  if (glow) {
    const g = ctx.createRadialGradient(x + w / 2, y + h * 0.7, 2, x + w / 2, y + h * 0.7, Math.max(w, h) * 0.7);
    g.addColorStop(0, rgba(glow, 0.95));
    g.addColorStop(0.5, rgba(glow, 0.45));
    g.addColorStop(1, rgba(glow, 0.05));
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
  }
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.strokeStyle = ramp.dark;
  ctx.lineWidth = 2;
  for (let gx = x + step; gx < x + w; gx += step) line(ctx, gx, y, gx, y + h);
  for (let gy = y + step; gy < y + h; gy += step) line(ctx, x, gy, x + w, gy);
  ctx.restore();
  ctx.strokeStyle = ramp.light;
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y, w, h);
}

/** 横向百叶：一条条向下倾的叶片。 */
export function louver(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, ramp: Ramp): void {
  ctx.fillStyle = ramp.deep;
  ctx.fillRect(x, y, w, h);
  for (let ly = y + 3; ly < y + h - 2; ly += 7) {
    ctx.fillStyle = ramp.mid;
    ctx.fillRect(x + 2, ly, w - 4, 3);
    ctx.fillStyle = rgba(ramp.hi, 0.4);
    ctx.fillRect(x + 2, ly, w - 4, 1);
  }
  ctx.strokeStyle = ramp.light;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);
}

/** 圆形风扇口：外框 + 扇叶 + 同心护网。 */
export function fanVent(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, ramp: Ramp, blades = 5): void {
  ctx.save();
  ctx.fillStyle = ramp.deep;
  ctx.beginPath();
  ctx.arc(cx, cy, r + 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#07080a";
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = ramp.mid;
  for (let i = 0; i < blades; i++) {
    const a = (i / blades) * Math.PI * 2 + 0.3;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r * 0.88, a, a + 0.62);
    ctx.closePath();
    ctx.fill();
  }
  ctx.strokeStyle = ramp.light;
  ctx.lineWidth = 1.5;
  for (let rr = r * 0.3; rr < r; rr += r * 0.22) {
    ctx.beginPath();
    ctx.arc(cx, cy, rr, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = ramp.hi;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.14, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = ramp.hi;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, r + 5, Math.PI * 1.05, Math.PI * 1.6);
  ctx.stroke();
  ctx.restore();
}

/** 细天线：主杆 + 若干横档，顶端可带红色航标灯（发光由 glow 模块负责）。 */
export function antenna(ctx: CanvasRenderingContext2D, x: number, base: number, h: number, ramp: Ramp = STEEL): void {
  ctx.save();
  ctx.strokeStyle = ramp.light;
  const k = Math.max(1, h / 100);
  ctx.lineWidth = 2.5 * k;
  line(ctx, x, base, x, base - h);
  ctx.lineWidth = 1.5 * k;
  for (let i = 1; i <= 3; i++) {
    const y = base - h * (0.35 + i * 0.15);
    const half = (10 - i * 2) * k;
    line(ctx, x - half, y, x + half, y);
  }
  ctx.restore();
}

/** 雷达 / 卫星锅：碗面 + 支架。 */
export function dish(ctx: CanvasRenderingContext2D, x: number, base: number, r: number, ramp: Ramp = STEEL): void {
  ctx.save();
  ctx.strokeStyle = ramp.mid;
  ctx.lineWidth = 3;
  line(ctx, x, base, x + r * 0.2, base - r * 0.9);
  ctx.translate(x + r * 0.2, base - r * 1.1);
  ctx.rotate(-0.55);
  const g = ctx.createLinearGradient(-r, 0, r, 0);
  g.addColorStop(0, ramp.hi);
  g.addColorStop(1, ramp.dark);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(0, 0, r, r * 0.42, 0, 0, Math.PI);
  ctx.fill();
  ctx.strokeStyle = ramp.light;
  ctx.lineWidth = 2;
  line(ctx, 0, 0, 0, -r * 0.5);
  ctx.restore();
}

/** 空调外机：铁盒 + 风扇 + 散热格 + 挂架（默认 0.8m × 0.55m）。 */
export function acUnit(ctx: CanvasRenderingContext2D, x: number, y: number, w = 104, h = 72, ramp: Ramp = STEEL): void {
  ctx.fillStyle = rgba("#000000", 0.45);
  ctx.fillRect(x + 6, y + 8, w, h);
  ctx.fillStyle = cylinderFill(ctx, x, w, ramp);
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = ramp.light;
  ctx.fillRect(x, y, w, 2.5);
  const r = Math.min(h, w * 0.55) * 0.38;
  fanVent(ctx, x + r + 10, y + h / 2, r, ramp, 4);
  ctx.fillStyle = ramp.deep;
  for (let lx = x + r * 2 + 22; lx < x + w - 7; lx += 6) ctx.fillRect(lx, y + 9, 2.5, h - 18);
  rivetLine(ctx, x + 5, y + h - 5, x + w - 5, y + h - 5, w, ramp);
  // L 形挂架与冷凝水渍。
  ctx.fillStyle = ramp.deep;
  ctx.fillRect(x + 8, y + h, 6, 12);
  ctx.fillRect(x + w - 14, y + h, 6, 12);
  ctx.fillRect(x + 4, y + h + 10, w - 8, 4);
  ctx.fillStyle = rgba("#000000", 0.25);
  ctx.fillRect(x + w * 0.7, y + h + 14, 3, 40);
}
