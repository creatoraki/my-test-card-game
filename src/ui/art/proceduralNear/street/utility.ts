import type { StreetPlacement } from "../types";
import { createRandom } from "../core/base/random";
import { CRIMSON, HAZARD, NAVY, RIM_HOT, STEEL, TEAL, rgba } from "../core/base/palette";
import { cylinderFill } from "../core/base/shading";
import { fillTexture } from "../core/base/grain";
import { louver } from "../core/fixtures/metalwork";
import { ledDots } from "../core/fixtures/techkit";
import { graffiti, posterWall } from "../facade/signage";
import { box, contactShadow, label, type StreetSpec } from "./common";

// 市政设施：配电箱（百叶、警示牌、小广告、涂鸦）、消防栓（暗红铸铁 + 出水口 + 链条）、邮筒（墨绿圆顶 + 投信口）。

function drawUtilityBox(ctx: CanvasRenderingContext2D, p: StreetPlacement): void {
  const r = createRandom(p.seed);
  const g = p.ground;
  const w = p.width;
  const h = 190;
  const y = g - h;
  contactShadow(ctx, p.x + w / 2, g, w * 1.3);
  ctx.fillStyle = STEEL.deep;
  ctx.fillRect(p.x - 6, g - 16, w + 12, 16);
  box(ctx, p.x, y, w, h - 16, r.chance(0.5) ? NAVY : STEEL);
  // 两扇柜门缝 + 把手。
  ctx.fillStyle = STEEL.deep;
  ctx.fillRect(p.x + w / 2 - 1.5, y + 10, 3, h - 36);
  ctx.fillStyle = STEEL.hi;
  ctx.fillRect(p.x + w / 2 - 12, y + h * 0.45, 5, 22);
  ctx.fillRect(p.x + w / 2 + 7, y + h * 0.45, 5, 22);
  louver(ctx, p.x + 12, y + 16, w / 2 - 26, 40, STEEL);
  louver(ctx, p.x + w / 2 + 14, y + h - 76, w / 2 - 26, 40, STEEL);
  // 警示牌：黄底黑框三角 + 闪电。
  const tx = p.x + w * 0.75;
  const ty = y + 30;
  ctx.fillStyle = HAZARD.yellow;
  ctx.beginPath();
  ctx.moveTo(tx, ty - 18);
  ctx.lineTo(tx + 20, ty + 16);
  ctx.lineTo(tx - 20, ty + 16);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = HAZARD.black;
  ctx.beginPath();
  ctx.moveTo(tx + 3, ty - 8);
  ctx.lineTo(tx - 6, ty + 5);
  ctx.lineTo(tx, ty + 5);
  ctx.lineTo(tx - 3, ty + 13);
  ctx.lineTo(tx + 6, ty + 1);
  ctx.lineTo(tx, ty + 1);
  ctx.closePath();
  ctx.fill();
  label(ctx, "高压危险", p.x + w / 2, y + h - 40, "#f0e0a0", "#2a2410");
  if (r.chance(0.6)) posterWall(ctx, r, p.x + 10, y + 70, w * 0.45, 60);
  if (r.chance(0.4)) graffiti(ctx, r, p.x + 6, y + 40, w - 12, h - 70);
  ledDots(ctx, r, p.x + 14, y + 8, 3, 9);
  ctx.save();
  ctx.beginPath();
  ctx.rect(p.x, y, w, h - 16);
  ctx.clip();
  fillTexture(ctx, "grime", p.x, y, w, h, 0.7, p.seed % 97, 1.4);
  fillTexture(ctx, "rust", p.x, y, w, h, 0.12, p.seed % 53, 1.4);
  ctx.restore();
}

function drawHydrant(ctx: CanvasRenderingContext2D, p: StreetPlacement): void {
  const g = p.ground;
  const w = 46;
  const cx = p.x + p.width / 2;
  const x = cx - w / 2;
  const h = 98;
  contactShadow(ctx, cx, g, 90);
  ctx.fillStyle = CRIMSON.deep;
  ctx.fillRect(x - 10, g - 12, w + 20, 12);
  ctx.fillStyle = cylinderFill(ctx, x, w, CRIMSON);
  ctx.fillRect(x, g - h, w, h - 12);
  // 顶盖。
  ctx.beginPath();
  ctx.ellipse(cx, g - h, w / 2 + 4, 14, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = CRIMSON.hi;
  ctx.fillRect(cx - 5, g - h - 20, 10, 8);
  // 两侧出水口 + 前盖。
  for (const dir of [-1, 1]) {
    ctx.fillStyle = cylinderFill(ctx, cx + dir * (w / 2) - (dir < 0 ? 18 : 0), 18, CRIMSON);
    ctx.fillRect(cx + dir * (w / 2) - (dir < 0 ? 18 : 0), g - 66, 18, 22);
    ctx.fillStyle = CRIMSON.deep;
    ctx.fillRect(cx + dir * (w / 2 + 18) - (dir < 0 ? 4 : 0), g - 68, 4, 26);
  }
  ctx.fillStyle = CRIMSON.dark;
  ctx.beginPath();
  ctx.arc(cx, g - 54, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = CRIMSON.hi;
  ctx.fillRect(cx - 3, g - 57, 6, 6);
  ctx.strokeStyle = STEEL.light;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx - w / 2 - 14, g - 44);
  ctx.quadraticCurveTo(cx - w / 2 - 6, g - 30, cx - 10, g - 44);
  ctx.stroke();
  ctx.fillStyle = CRIMSON.light;
  ctx.fillRect(x, g - h * 0.72, w, 5);
  ctx.fillStyle = rgba(RIM_HOT, 0.5);
  ctx.fillRect(x + w - 2, g - h, 1.5, h - 12);
}

function drawMailbox(ctx: CanvasRenderingContext2D, p: StreetPlacement): void {
  const g = p.ground;
  const w = 76;
  const cx = p.x + p.width / 2;
  const x = cx - w / 2;
  const h = 163;
  contactShadow(ctx, cx, g, 110);
  ctx.fillStyle = STEEL.deep;
  ctx.fillRect(x + 8, g - 30, 10, 30);
  ctx.fillRect(x + w - 18, g - 30, 10, 30);
  const body = new Path2D();
  body.moveTo(x, g - 30);
  body.lineTo(x, g - h + w / 2);
  body.arc(cx, g - h + w / 2, w / 2, Math.PI, 0);
  body.lineTo(x + w, g - 30);
  body.closePath();
  ctx.fillStyle = cylinderFill(ctx, x, w, TEAL);
  ctx.fill(body);
  ctx.fillStyle = TEAL.deep;
  ctx.fillRect(x + 12, g - h + 50, w - 24, 8);
  ctx.fillStyle = "#020404";
  ctx.fillRect(x + 16, g - h + 52, w - 32, 4);
  label(ctx, "邮政", cx, g - h + 92, "#d8f0e8", "#0a2a26");
  ctx.fillStyle = TEAL.dark;
  ctx.fillRect(x + 10, g - 70, w - 20, 30);
  ctx.fillStyle = TEAL.hi;
  ctx.fillRect(cx - 8, g - 60, 16, 4);
  ctx.save();
  ctx.clip(body);
  fillTexture(ctx, "grime", x, g - h, w, h, 0.6, p.seed % 97, 1.3);
  ctx.restore();
  ctx.fillStyle = rgba(RIM_HOT, 0.45);
  ctx.fillRect(x + w - 2, g - h + w / 2, 1.5, h - w / 2 - 30);
}

export const utilityBoxSpec: StreetSpec = {
  kind: "utilityBox",
  label: "配电箱",
  width: [150, 180],
  lamps: () => [],
  draw: drawUtilityBox,
};

export const hydrantSpec: StreetSpec = {
  kind: "hydrant",
  label: "消防栓",
  width: [110, 110],
  lamps: () => [],
  draw: drawHydrant,
};

export const mailboxSpec: StreetSpec = {
  kind: "mailbox",
  label: "邮筒",
  width: [100, 100],
  lamps: () => [],
  draw: drawMailbox,
};
