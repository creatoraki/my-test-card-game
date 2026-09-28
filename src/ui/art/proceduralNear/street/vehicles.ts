import type { StreetPlacement } from "../types";
import { createRandom } from "../core/base/random";
import { CRIMSON, LAMP, NAVY, RIM_HOT, STEEL, TEAL, rgba, type Ramp } from "../core/base/palette";
import { radialGlow } from "../core/light/glow";
import { contactShadow, type StreetSpec } from "./common";

// 停放的车辆（侧视）：摩托（整流罩、油箱、坐垫、排气管、支脚斜撑）与单车（细管车架、辐条、车筐）。

function tire(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number, spokes: boolean): void {
  ctx.strokeStyle = "#06070b";
  ctx.lineWidth = radius * 0.28;
  ctx.beginPath();
  ctx.arc(cx, cy, radius - radius * 0.14, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = rgba("#6f86b8", 0.35);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, radius - 1, Math.PI * 1.1, Math.PI * 1.6);
  ctx.stroke();
  ctx.strokeStyle = STEEL.light;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.68, 0, Math.PI * 2);
  ctx.stroke();
  if (spokes) {
    ctx.lineWidth = 1;
    ctx.strokeStyle = rgba("#9fb0e8", 0.45);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * radius * 0.68, cy + Math.sin(a) * radius * 0.68);
      ctx.stroke();
    }
  } else {
    ctx.fillStyle = STEEL.mid;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = STEEL.hi;
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      ctx.fillRect(cx + Math.cos(a) * radius * 0.25 - 2, cy + Math.sin(a) * radius * 0.25 - 2, 4, 4);
    }
  }
  ctx.fillStyle = STEEL.hi;
  ctx.fillRect(cx - 3, cy - 3, 6, 6);
}

function drawMotorbike(ctx: CanvasRenderingContext2D, p: StreetPlacement): void {
  const r = createRandom(p.seed);
  const g = p.ground;
  const flip = r.chance(0.5) ? -1 : 1;
  const ramp: Ramp = r.pick([NAVY, CRIMSON, TEAL, STEEL]);
  const cx = p.x + p.width / 2;
  ctx.save();
  ctx.translate(cx, 0);
  ctx.scale(flip, 1);
  ctx.translate(-cx, 0);
  const rearX = p.x + 44;
  const frontX = p.x + p.width - 44;
  const wr = 38;
  const wy = g - wr;
  contactShadow(ctx, cx, g, p.width * 1.1);
  // 支脚斜撑。
  ctx.strokeStyle = STEEL.mid;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(cx - 20, g - 50);
  ctx.lineTo(cx - 44, g);
  ctx.stroke();
  // 排气管。
  ctx.strokeStyle = STEEL.hi;
  ctx.lineWidth = 9;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(cx + 10, g - 40);
  ctx.lineTo(rearX + 6, g - 50);
  ctx.stroke();
  ctx.strokeStyle = rgba(RIM_HOT, 0.5);
  ctx.lineWidth = 2;
  ctx.stroke();
  tire(ctx, rearX, wy, wr, false);
  tire(ctx, frontX, wy, wr, false);
  // 前叉。
  ctx.strokeStyle = STEEL.light;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(frontX, wy);
  ctx.lineTo(frontX - 24, g - 128);
  ctx.stroke();
  // 车身：整流罩 + 油箱 + 尾段。
  const body = new Path2D();
  body.moveTo(rearX - 10, g - 86);
  body.lineTo(rearX + 40, g - 96);
  body.lineTo(cx + 30, g - 108);
  body.quadraticCurveTo(frontX - 20, g - 118, frontX - 12, g - 92);
  body.lineTo(frontX - 36, g - 60);
  body.lineTo(cx - 10, g - 44);
  body.lineTo(rearX + 30, g - 62);
  body.closePath();
  const grad = ctx.createLinearGradient(0, g - 118, 0, g - 44);
  grad.addColorStop(0, ramp.hi);
  grad.addColorStop(0.3, ramp.light);
  grad.addColorStop(1, ramp.deep);
  ctx.fillStyle = grad;
  ctx.fill(body);
  ctx.strokeStyle = rgba(RIM_HOT, 0.5);
  ctx.lineWidth = 1.5;
  ctx.stroke(body);
  // 坐垫。
  ctx.fillStyle = "#0b0b12";
  ctx.beginPath();
  ctx.moveTo(rearX + 4, g - 96);
  ctx.quadraticCurveTo(cx - 20, g - 118, cx + 24, g - 108);
  ctx.lineTo(cx + 22, g - 100);
  ctx.lineTo(rearX + 6, g - 88);
  ctx.closePath();
  ctx.fill();
  // 车把 + 后视镜 + 大灯。
  ctx.strokeStyle = STEEL.light;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(frontX - 24, g - 128);
  ctx.lineTo(frontX - 50, g - 136);
  ctx.moveTo(frontX - 30, g - 130);
  ctx.lineTo(frontX - 36, g - 156);
  ctx.stroke();
  ctx.fillStyle = STEEL.dark;
  ctx.fillRect(frontX - 44, g - 162, 16, 8);
  ctx.fillStyle = LAMP.core;
  ctx.beginPath();
  ctx.ellipse(frontX - 14, g - 106, 7, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  if (r.chance(0.3)) radialGlow(ctx, frontX - 14, g - 106, 40, LAMP.glow, 0.4);
  ctx.restore();
}

function drawBicycle(ctx: CanvasRenderingContext2D, p: StreetPlacement): void {
  const r = createRandom(p.seed);
  const g = p.ground;
  const cx = p.x + p.width / 2;
  const flip = r.chance(0.5) ? -1 : 1;
  const color = r.pick(["#3a5a9a", "#6a3a78", "#2a6a70", "#8d9bb8"]);
  ctx.save();
  ctx.translate(cx, 0);
  ctx.scale(flip, 1);
  ctx.translate(-cx, 0);
  const wr = 44;
  const rearX = p.x + 50;
  const frontX = p.x + p.width - 50;
  const wy = g - wr;
  contactShadow(ctx, cx, g, p.width);
  tire(ctx, rearX, wy, wr, true);
  tire(ctx, frontX, wy, wr, true);
  const crank = { x: cx - 8, y: wy + 4 };
  const seat = { x: rearX + 34, y: g - 120 };
  const head = { x: frontX - 22, y: g - 118 };
  ctx.strokeStyle = color;
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(rearX, wy);
  ctx.lineTo(crank.x, crank.y);
  ctx.lineTo(seat.x, seat.y);
  ctx.lineTo(rearX, wy);
  ctx.moveTo(crank.x, crank.y);
  ctx.lineTo(head.x, head.y);
  ctx.lineTo(seat.x + 4, seat.y + 6);
  ctx.moveTo(head.x, head.y);
  ctx.lineTo(frontX, wy);
  ctx.stroke();
  ctx.strokeStyle = rgba(RIM_HOT, 0.45);
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.fillStyle = "#0b0b12";
  ctx.fillRect(seat.x - 16, seat.y - 10, 32, 8);
  ctx.strokeStyle = STEEL.light;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(head.x, head.y);
  ctx.lineTo(head.x + 4, head.y - 18);
  ctx.lineTo(head.x - 16, head.y - 22);
  ctx.stroke();
  ctx.fillStyle = STEEL.mid;
  ctx.beginPath();
  ctx.arc(crank.x, crank.y, 10, 0, Math.PI * 2);
  ctx.fill();
  if (r.chance(0.5)) {
    // 车筐。
    ctx.strokeStyle = STEEL.light;
    ctx.lineWidth = 2;
    ctx.strokeRect(head.x + 6, head.y - 30, 40, 30);
    for (let bx = head.x + 12; bx < head.x + 46; bx += 8) {
      ctx.beginPath();
      ctx.moveTo(bx, head.y - 30);
      ctx.lineTo(bx, head.y);
      ctx.stroke();
    }
  }
  ctx.restore();
}

export const motorbikeSpec: StreetSpec = {
  kind: "motorbike",
  label: "摩托车",
  width: [250, 270],
  lamps: () => [],
  draw: drawMotorbike,
};

export const bicycleSpec: StreetSpec = {
  kind: "bicycle",
  label: "单车",
  width: [220, 236],
  lamps: () => [],
  draw: drawBicycle,
};
