import type { NeonTone } from "../types";
import type { Random } from "../core/base/random";
import { ALLOY, AMBIENT_SHADOW, STEEL, rgba } from "../core/base/palette";
import { cylinderFill } from "../core/base/shading";
import { acUnit, antenna, dish, railing } from "../core/fixtures/metalwork";
import { drawPipe } from "../core/fixtures/pipes";
import { beacon } from "../core/light/glow";
import { rimCylinder } from "../core/light/rim";
import { holoScreen } from "../core/light/holo";
import { SIGN_WORDS } from "../core/fixtures/signs";

// 屋顶杂件（按真实比例）：1.1m 栏杆、1.5m 水箱、空调外机、2~3m 天线、卫星锅、排气管、广告牌架。
// 屋面在画面外（roofY 太高）时不画。

/** 立式水箱：钢支架 + 圆柱罐 + 箍带 + 爬梯。 */
function waterTank(ctx: CanvasRenderingContext2D, x: number, roofY: number, w: number, h: number): void {
  const legH = 40;
  ctx.fillStyle = STEEL.deep;
  ctx.fillRect(x + 8, roofY - legH, 8, legH);
  ctx.fillRect(x + w - 16, roofY - legH, 8, legH);
  ctx.strokeStyle = STEEL.dark;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x + 12, roofY);
  ctx.lineTo(x + w - 12, roofY - legH);
  ctx.moveTo(x + w - 12, roofY);
  ctx.lineTo(x + 12, roofY - legH);
  ctx.stroke();
  const top = roofY - legH - h;
  ctx.fillStyle = cylinderFill(ctx, x, w, ALLOY);
  ctx.fillRect(x, top, w, h);
  ctx.fillStyle = ALLOY.deep;
  for (const t of [0.25, 0.6, 0.9]) ctx.fillRect(x - 2, top + h * t, w + 4, 5);
  ctx.fillStyle = ALLOY.dark;
  ctx.beginPath();
  ctx.ellipse(x + w / 2, top, w / 2, 12, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = ALLOY.hi;
  ctx.fillRect(x + w * 0.3, top - 10, w * 0.4, 3);
  rimCylinder(ctx, x, top, w, h);
  ctx.strokeStyle = STEEL.light;
  ctx.lineWidth = 2.5;
  const lx = x + w * 0.72;
  ctx.beginPath();
  ctx.moveTo(lx, top);
  ctx.lineTo(lx, roofY);
  ctx.moveTo(lx + 18, top);
  ctx.lineTo(lx + 18, roofY);
  ctx.stroke();
  for (let ry = top + 16; ry < roofY; ry += 18) ctx.fillRect(lx, ry, 18, 2);
}

/** 屋顶广告牌：两根桁架腿撑起一块全息广告。 */
function billboard(ctx: CanvasRenderingContext2D, r: Random, x: number, roofY: number, w: number, tone: NeonTone): void {
  const h = w * 0.42;
  const legH = 60;
  const top = roofY - legH - h;
  ctx.strokeStyle = STEEL.mid;
  ctx.lineWidth = 3;
  for (const lx of [x + w * 0.2, x + w * 0.8]) {
    ctx.fillStyle = STEEL.deep;
    ctx.fillRect(lx - 6, top + h, 12, roofY - top - h);
    for (let yy = top + h; yy < roofY - 10; yy += 20) {
      ctx.beginPath();
      ctx.moveTo(lx - 6, yy);
      ctx.lineTo(lx + 6, yy + 20);
      ctx.stroke();
    }
  }
  holoScreen(ctx, x, top, w, h, tone, r.seed(), [r.pick(SIGN_WORDS)]);
  ctx.fillStyle = rgba(AMBIENT_SHADOW, 0.6);
  ctx.fillRect(x, top + h + 6, w, 6);
}

export function rooftopKit(ctx: CanvasRenderingContext2D, r: Random, x0: number, x1: number, roofY: number, tone: NeonTone): void {
  const w = x1 - x0;
  if (roofY < 40 || w < 80) return;
  if (r.chance(0.25) && w > 420 && roofY > 330) {
    const bw = Math.min(w * 0.6, r.range(300, 420));
    billboard(ctx, r, x0 + r.range(20, w - bw - 20), roofY, bw, tone);
  } else if (r.chance(0.45) && w > 200) {
    const tw = r.range(110, 150);
    waterTank(ctx, x0 + r.range(20, w - tw - 20), roofY, tw, r.range(120, 170));
  }
  const acs = r.int(0, 2);
  for (let i = 0; i < acs; i++) acUnit(ctx, x0 + r.range(12, w - 120), roofY - 84);
  if (r.chance(0.5)) {
    const px = r.range(x0 + 20, x1 - 20);
    drawPipe(ctx, [[px, roofY], [px, roofY - r.range(70, 120)]], r.range(9, 13), STEEL, 0);
  }
  if (r.chance(0.35)) dish(ctx, r.range(x0 + 50, x1 - 50), roofY, r.range(34, 52));
  let tallest = { x: 0, y: roofY, h: 0 };
  const antennas = r.int(0, 2);
  for (let i = 0; i < antennas; i++) {
    const ax = r.range(x0 + 16, x1 - 16);
    const h = r.range(160, 300);
    antenna(ctx, ax, roofY, h);
    if (h > tallest.h) tallest = { x: ax, y: roofY - h, h };
  }
  if (r.chance(0.6)) railing(ctx, x0 + 4, x1 - 4, roofY, 130);
  if (tallest.h > 0) beacon(ctx, tallest.x, tallest.y);
}
