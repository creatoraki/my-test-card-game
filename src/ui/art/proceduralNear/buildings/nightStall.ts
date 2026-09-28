import type { BuildingPlacement, LightTone } from "../types";
import { createRandom, type Random } from "../core/base/random";
import { AMBIENT_SHADOW, BRICK, NAVY, STEEL, TEAL, lightCore, lightGlow, rgba, type Ramp } from "../core/base/palette";
import { cylinderFill, shadeDown } from "../core/base/shading";
import { fillTexture } from "../core/base/grain";
import { wallSurface } from "../core/base/surfaces";
import { radialGlow } from "../core/light/glow";
import { rimEdge } from "../core/light/rim";
import { cornerShadow } from "../facade/storey";
import { lightBox, posterWall } from "../facade/signage";
import { BASE, bayLayout, doorSpot, floorY, neonOf, type BuildingSpec } from "./common";

// 夜市棚屋：轻钢立柱 + 铁皮棚顶（略下垂的檐口），檐下挂一串灯泡与灯笼；
// 每个开间一个摊位：柜台、锅具与热气、挂牌菜单、塑料门帘，门前几只矮凳。

const COUNTER_H = 130;
const STALLS = ["烤串", "炒粉", "糖水", "关东煮", "煎饼", "凉皮", "麻辣烫", "炸鸡"] as const;

/** 铁皮棚顶的檐口：瓦楞边 + 下垂 + 檐下阴影。 */
function roofEdge(ctx: CanvasRenderingContext2D, x: number, w: number, y: number, seed: number): void {
  shadeDown(ctx, x, y + 10, w, 80, 0.7);
  const path = new Path2D();
  path.moveTo(x - 20, y - 40);
  path.lineTo(x + w + 20, y - 40);
  path.lineTo(x + w + 20, y + 4);
  path.quadraticCurveTo(x + w / 2, y + 16, x - 20, y + 4);
  path.closePath();
  const g = ctx.createLinearGradient(0, y - 40, 0, y + 12);
  g.addColorStop(0, STEEL.hi);
  g.addColorStop(0.15, STEEL.mid);
  g.addColorStop(1, STEEL.deep);
  ctx.fillStyle = g;
  ctx.fill(path);
  ctx.save();
  ctx.clip(path);
  for (let rx = x - 20; rx < x + w + 20; rx += 16) {
    ctx.fillStyle = rgba("#000000", 0.3);
    ctx.fillRect(rx, y - 40, 5, 60);
    ctx.fillStyle = rgba(STEEL.hi, 0.18);
    ctx.fillRect(rx + 5, y - 40, 2, 60);
  }
  fillTexture(ctx, "rust", x - 20, y - 40, w + 40, 60, 0.35, seed % 131, 1.6);
  fillTexture(ctx, "grime", x - 20, y - 40, w + 40, 60, 0.7, seed % 71, 1.6);
  ctx.restore();
  rimEdge(ctx, x - 20, y - 40, w + 40, 44, 1.2);
}

/** 一串灯泡：沿两柱之间的悬链，灯泡按色调交替并各带光晕。 */
function bulbString(ctx: CanvasRenderingContext2D, r: Random, x0: number, x1: number, y: number, tones: readonly LightTone[]): void {
  const sag = 28;
  const at = (t: number) => ({ x: x0 + (x1 - x0) * t, y: y + 4 * sag * t * (1 - t) });
  ctx.strokeStyle = "#05060b";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x0, y);
  ctx.quadraticCurveTo((x0 + x1) / 2, y + sag * 2, x1, y);
  ctx.stroke();
  const n = Math.max(3, Math.round((x1 - x0) / 34));
  for (let i = 1; i < n; i++) {
    const p = at(i / n);
    const tone = r.pick(tones);
    ctx.fillStyle = "#101018";
    ctx.fillRect(p.x - 2, p.y, 4, 6);
    ctx.fillStyle = lightCore(tone);
    ctx.beginPath();
    ctx.arc(p.x, p.y + 11, 5, 0, Math.PI * 2);
    ctx.fill();
    radialGlow(ctx, p.x, p.y + 11, 24, lightGlow(tone), 0.45);
  }
}

/** 圆灯笼：椭圆灯体 + 竖骨 + 上下端盖 + 流苏。 */
function lantern(ctx: CanvasRenderingContext2D, x: number, y: number, tone: LightTone): void {
  const glow = lightGlow(tone);
  ctx.strokeStyle = "#05060b";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y - 30);
  ctx.lineTo(x, y);
  ctx.stroke();
  radialGlow(ctx, x, y + 34, 90, glow, 0.35);
  const g = ctx.createRadialGradient(x - 8, y + 26, 4, x, y + 34, 36);
  g.addColorStop(0, lightCore(tone));
  g.addColorStop(0.5, glow);
  g.addColorStop(1, rgba(glow, 0.55));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(x, y + 34, 30, 30, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = rgba("#000000", 0.35);
  ctx.lineWidth = 1.5;
  for (const k of [-0.6, -0.2, 0.2, 0.6]) {
    ctx.beginPath();
    ctx.ellipse(x, y + 34, 30 * Math.abs(k), 30, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = "#15101a";
  ctx.fillRect(x - 14, y + 2, 28, 6);
  ctx.fillRect(x - 14, y + 60, 28, 6);
  ctx.fillStyle = rgba(glow, 0.8);
  ctx.fillRect(x - 2, y + 66, 4, 26);
}

/** 摊位柜台：面板 + 台面 + 锅与热气。 */
function counter(ctx: CanvasRenderingContext2D, r: Random, x: number, w: number, ramp: Ramp, tone: LightTone): void {
  const y = BASE - COUNTER_H;
  const g = ctx.createLinearGradient(0, y, 0, BASE);
  g.addColorStop(0, ramp.light);
  g.addColorStop(0.2, ramp.mid);
  g.addColorStop(1, ramp.deep);
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, COUNTER_H);
  ctx.fillStyle = ramp.deep;
  for (let px = x + 60; px < x + w - 20; px += 60) ctx.fillRect(px, y + 14, 2, COUNTER_H - 14);
  ctx.fillStyle = STEEL.light;
  ctx.fillRect(x - 8, y - 10, w + 16, 12);
  ctx.fillStyle = STEEL.hi;
  ctx.fillRect(x - 8, y - 10, w + 16, 2);
  rimEdge(ctx, x, y, w, COUNTER_H, 0.8);
  const pots = r.int(1, 3);
  for (let i = 0; i < pots; i++) {
    const pw = r.range(60, 90);
    const px = x + r.range(10, w - pw - 10);
    const ph = r.range(36, 56);
    ctx.fillStyle = cylinderFill(ctx, px, pw, STEEL);
    ctx.fillRect(px, y - 10 - ph, pw, ph);
    ctx.fillStyle = STEEL.deep;
    ctx.fillRect(px - 4, y - 10 - ph, pw + 8, 5);
    // 热气：一团淡淡的冷白雾。
    const steam = ctx.createRadialGradient(px + pw / 2, y - ph - 60, 4, px + pw / 2, y - ph - 60, 70);
    steam.addColorStop(0, rgba("#dfe6ff", 0.16));
    steam.addColorStop(1, rgba("#dfe6ff", 0));
    ctx.fillStyle = steam;
    ctx.fillRect(px - 60, y - ph - 140, pw + 120, 140);
  }
  radialGlow(ctx, x + w / 2, y - 40, w * 0.55, lightGlow(tone), 0.14);
}

/** 塑料门帘：半透明竖条，下缘参差。 */
function stripCurtain(ctx: CanvasRenderingContext2D, r: Random, x: number, y: number, w: number, h: number): void {
  for (let sx = x; sx < x + w; sx += 22) {
    const sh = h - r.range(0, 30);
    ctx.fillStyle = rgba("#a8c4ff", 0.1);
    ctx.fillRect(sx, y, 20, sh);
    ctx.fillStyle = rgba("#e0ecff", 0.22);
    ctx.fillRect(sx + 2, y, 2, sh);
  }
}

/** 矮塑料凳。 */
function stool(ctx: CanvasRenderingContext2D, x: number, color: string): void {
  ctx.fillStyle = rgba(AMBIENT_SHADOW, 0.5);
  ctx.beginPath();
  ctx.ellipse(x + 26, BASE, 34, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, BASE - 58);
  ctx.lineTo(x + 52, BASE - 58);
  ctx.lineTo(x + 46, BASE);
  ctx.lineTo(x + 6, BASE);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = rgba("#ffffff", 0.2);
  ctx.fillRect(x, BASE - 58, 52, 4);
  ctx.fillStyle = rgba("#000000", 0.45);
  ctx.fillRect(x + 14, BASE - 40, 24, 40);
}

function drawNightStall(ctx: CanvasRenderingContext2D, p: BuildingPlacement): void {
  const r = createRandom(p.seed);
  const roofY = floorY(p.storeys);
  const bays = bayLayout(p.x, p.width, 340);
  wallSurface(ctx, "brick", p.x, roofY, p.width, BASE - roofY, BRICK, p.seed, 0.6);
  shadeDown(ctx, p.x, roofY, p.width, 160, 0.6);

  bays.forEach((bay, i) => {
    const lamp = p.lamps[i] ?? p.lamps[0];
    const bx = bay.x0 + 22;
    const bw = bay.x1 - bay.x0 - 44;
    radialGlow(ctx, lamp.x, roofY + 120, bw * 0.8, lightGlow(lamp.tone), 0.2);
    // 背墙货架。
    ctx.fillStyle = rgba("#05050b", 0.6);
    ctx.fillRect(bx + 10, roofY + 150, bw - 20, 6);
    for (let gx = bx + 14; gx < bx + bw - 20; gx += r.range(14, 26)) {
      ctx.fillStyle = rgba(r.pick(["#6f86b8", "#b35a8c", "#3a8f95", "#c9ccdf"]), 0.55);
      ctx.fillRect(gx, roofY + 118, 9, 32);
    }
    if (r.chance(0.3)) stripCurtain(ctx, r, bx, roofY + 40, bw, BASE - COUNTER_H - roofY - 50);
    else if (r.chance(0.35)) posterWall(ctx, r, bx + bw * 0.6, roofY + 170, bw * 0.35, 120);
    counter(ctx, r, bx, bw, r.pick([NAVY, TEAL, STEEL]), lamp.tone);
    lightBox(ctx, lamp.x - bw * 0.3, roofY + 36, bw * 0.6, 58, r.pick(STALLS), neonOf(lamp.tone), r.chance(0.6), r.seed());
    const stools = r.int(0, 2);
    for (let k = 0; k < stools; k++) stool(ctx, bx + r.range(0, bw - 60), r.pick(["#2e4a8a", "#6a3a78", "#2a6a70", "#7a2c46"]));
  });

  // 立柱。
  for (let i = 0; i <= bays.length; i++) {
    const px = i === 0 ? p.x + 4 : i === bays.length ? p.x + p.width - 20 : bays[i].x0 - 8;
    ctx.fillStyle = rgba(AMBIENT_SHADOW, 0.45);
    ctx.fillRect(px + 16, roofY, 10, BASE - roofY);
    const g = ctx.createLinearGradient(px, 0, px + 16, 0);
    g.addColorStop(0, STEEL.hi);
    g.addColorStop(0.3, STEEL.mid);
    g.addColorStop(1, STEEL.deep);
    ctx.fillStyle = g;
    ctx.fillRect(px, roofY, 16, BASE - roofY);
  }
  roofEdge(ctx, p.x, p.width, roofY, p.seed);
  const tones: LightTone[] = ["pink", "cyan", "white", "violet", "white", r.chance(0.5) ? "warm" : "pink"];
  for (let i = 0; i < bays.length; i++) bulbString(ctx, r, bays[i].x0, bays[i].x1, roofY + 14, tones);
  for (const bay of bays) if (r.chance(0.45)) lantern(ctx, bay.x0 + 30, roofY + 30, r.chance(0.2) ? "warm" : r.pick(["pink", "violet"] as const));
  cornerShadow(ctx, p.x, roofY, BASE, "left", 24);
  cornerShadow(ctx, p.x + p.width, roofY, BASE, "right", 24);
}

export const nightStallSpec: BuildingSpec = {
  kind: "nightStall",
  label: "夜市棚屋",
  width: [720, 1040],
  storeys: [0.85],
  crown: 50,
  weight: 0.8,
  lamps: (x, w, storeys, rnd, neon) =>
    bayLayout(x, w, 340).map((bay) => {
      const tone: LightTone = rnd.chance(0.25) ? "warm" : rnd.chance(0.5) ? neon : "white";
      return doorSpot((bay.x0 + bay.x1) / 2, floorY(storeys) + 40, tone, "strip");
    }),
  draw: drawNightStall,
};
