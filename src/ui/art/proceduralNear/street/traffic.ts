import type { StreetPlacement } from "../types";
import { createRandom } from "../core/base/random";
import { AMBIENT_SHADOW, CRIMSON, LED, RIM_HOT, STEEL, rgba } from "../core/base/palette";
import { fillTexture } from "../core/base/grain";
import { radialGlow } from "../core/light/glow";
import { contactShadow, tube, type StreetSpec } from "./common";

// 交通杂项：路锥（0.7m，反光白环）、水马（1.5m 注水隔离墩，顶部警示灯）、人行道护栏（1m 高，立柱 + 两道横杆 + 反光片）。

const CONE = "#9a5a3c";
const CONE_DARK = "#4a2618";
const PALE = "#aab4cc";

function cone(ctx: CanvasRenderingContext2D, cx: number, g: number, tilt: number): void {
  const h = 91;
  ctx.save();
  ctx.translate(cx, g);
  ctx.rotate(tilt);
  ctx.fillStyle = "#101118";
  ctx.fillRect(-34, -10, 68, 10);
  const body = new Path2D();
  body.moveTo(-26, -10);
  body.lineTo(-6, -h);
  body.lineTo(6, -h);
  body.lineTo(26, -10);
  body.closePath();
  const grad = ctx.createLinearGradient(-26, 0, 26, 0);
  grad.addColorStop(0, CONE);
  grad.addColorStop(0.35, "#c07a54");
  grad.addColorStop(1, CONE_DARK);
  ctx.fillStyle = grad;
  ctx.fill(body);
  ctx.save();
  ctx.clip(body);
  ctx.fillStyle = PALE;
  ctx.fillRect(-30, -h * 0.66, 60, 12);
  ctx.fillRect(-30, -h * 0.4, 60, 10);
  fillTexture(ctx, "grime", -30, -h, 60, h, 0.6, Math.round(cx) % 61, 1);
  ctx.restore();
  ctx.fillStyle = rgba(RIM_HOT, 0.5);
  ctx.fillRect(20, -30, 1.5, 20);
  ctx.restore();
}

function drawCones(ctx: CanvasRenderingContext2D, p: StreetPlacement): void {
  const r = createRandom(p.seed);
  const n = Math.max(1, Math.min(3, Math.floor(p.width / 70)));
  contactShadow(ctx, p.x + p.width / 2, p.ground, p.width * 1.1);
  for (let i = 0; i < n; i++) {
    const cx = p.x + 36 + i * ((p.width - 72) / Math.max(1, n - 1));
    if (r.chance(0.2)) {
      // 倒地的一只：横躺在地上。
      ctx.save();
      ctx.translate(cx, p.ground - 34);
      ctx.rotate(Math.PI / 2 * (r.chance(0.5) ? 1 : -1));
      ctx.translate(-cx, -(p.ground - 34));
      cone(ctx, cx, p.ground - 34 + 45, 0);
      ctx.restore();
      continue;
    }
    cone(ctx, cx, p.ground, r.range(-0.03, 0.03));
  }
}

function barrier(ctx: CanvasRenderingContext2D, x: number, g: number, red: boolean, seed: number): void {
  const w = 190;
  const h = 104;
  const body = new Path2D();
  body.moveTo(x, g);
  body.lineTo(x + 14, g - h + 22);
  body.quadraticCurveTo(x + 20, g - h, x + 44, g - h);
  body.lineTo(x + w - 44, g - h);
  body.quadraticCurveTo(x + w - 20, g - h, x + w - 14, g - h + 22);
  body.lineTo(x + w, g);
  body.closePath();
  const grad = ctx.createLinearGradient(0, g - h, 0, g);
  grad.addColorStop(0, red ? CRIMSON.hi : "#c3cadc");
  grad.addColorStop(0.3, red ? CRIMSON.light : "#8d96ad");
  grad.addColorStop(1, red ? CRIMSON.deep : "#3a4056");
  ctx.fillStyle = grad;
  ctx.fill(body);
  ctx.save();
  ctx.clip(body);
  ctx.fillStyle = rgba(AMBIENT_SHADOW, 0.35);
  ctx.fillRect(x + 40, g - 60, w - 80, 34);
  ctx.fillStyle = rgba(PALE, 0.8);
  ctx.fillRect(x, g - h + 34, w, 8);
  fillTexture(ctx, "grime", x, g - h, w, h, 0.8, seed % 97, 1.3);
  ctx.restore();
  ctx.fillStyle = STEEL.deep;
  ctx.beginPath();
  ctx.ellipse(x + w / 2, g - h, 16, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = rgba(RIM_HOT, 0.4);
  ctx.fillRect(x + 44, g - h, w - 88, 1.5);
}

function drawWaterBarrier(ctx: CanvasRenderingContext2D, p: StreetPlacement): void {
  const r = createRandom(p.seed);
  const n = p.width >= 390 ? 2 : 1;
  contactShadow(ctx, p.x + p.width / 2, p.ground, p.width * 1.1);
  const x0 = p.x + (p.width - n * 190 - (n - 1) * 6) / 2;
  let red = r.chance(0.5);
  for (let i = 0; i < n; i++) {
    barrier(ctx, x0 + i * 196, p.ground, red, p.seed + i * 17);
    red = !red;
  }
  if (r.chance(0.6)) {
    const lx = x0 + 95;
    ctx.fillStyle = STEEL.deep;
    ctx.fillRect(lx - 12, p.ground - 124, 24, 18);
    ctx.fillStyle = LED.amber;
    ctx.fillRect(lx - 8, p.ground - 122, 16, 8);
    radialGlow(ctx, lx, p.ground - 118, 50, LED.amber, 0.4);
  }
}

function drawGuardRail(ctx: CanvasRenderingContext2D, p: StreetPlacement): void {
  const g = p.ground;
  const h = 130;
  const posts = Math.max(2, Math.round(p.width / 156) + 1);
  contactShadow(ctx, p.x + p.width / 2, g, p.width * 1.05, 0.4);
  for (const ry of [g - h + 8, g - h * 0.5]) {
    const grad = ctx.createLinearGradient(0, ry - 7, 0, ry + 7);
    grad.addColorStop(0, "#c3cadc");
    grad.addColorStop(0.4, "#7d879f");
    grad.addColorStop(1, "#2a3044");
    ctx.fillStyle = grad;
    ctx.fillRect(p.x, ry - 7, p.width, 14);
    ctx.fillStyle = rgba("#3b5fae", 0.8);
    ctx.fillRect(p.x, ry + 1, p.width, 3);
  }
  for (let i = 0; i < posts; i++) {
    const px = p.x + ((p.width - 12) * i) / (posts - 1);
    tube(ctx, px, g - h, g, 12, STEEL);
    ctx.fillStyle = STEEL.deep;
    ctx.fillRect(px - 8, g - 8, 28, 8);
    // 立柱顶的反光片。
    ctx.fillStyle = rgba(PALE, 0.9);
    ctx.fillRect(px + 1, g - h - 10, 10, 10);
  }
}

export const conesSpec: StreetSpec = {
  kind: "cones",
  label: "路锥",
  width: [110, 210],
  lamps: () => [],
  draw: drawCones,
};

export const waterBarrierSpec: StreetSpec = {
  kind: "waterBarrier",
  label: "水马",
  width: [200, 400],
  lamps: () => [],
  draw: drawWaterBarrier,
};

export const guardRailSpec: StreetSpec = {
  kind: "guardRail",
  label: "护栏",
  width: [320, 520],
  lamps: () => [],
  draw: drawGuardRail,
};
