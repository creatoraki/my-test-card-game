import type { StreetPlacement } from "../types";
import { createRandom } from "../core/base/random";
import { ALLOY, AMBIENT_SHADOW, AWNING_PAIRS, LED, NAVY, NEON_COLORS, RIM, STEEL, TEAL, lightCore, lightGlow, rgba } from "../core/base/palette";
import { shadeDown } from "../core/base/shading";
import { radialGlow } from "../core/light/glow";
import { holoScreen } from "../core/light/holo";
import { posterWall } from "../facade/signage";
import { box, contactShadow, label, lightSpot, tube, type StreetSpec } from "./common";

// 街边服务：信息亭（带全息屏的导览立柱）、电话亭（玻璃亭 + 顶部灯牌 + 挂壁电话）、报刊亭（撑起的卷帘、杂志架、顶部灯牌）。

function drawInfoKiosk(ctx: CanvasRenderingContext2D, p: StreetPlacement): void {
  const r = createRandom(p.seed);
  const g = p.ground;
  const w = p.width;
  const h = 270;
  contactShadow(ctx, p.x + w / 2, g, w * 1.6);
  box(ctx, p.x, g - h, w, h, NAVY);
  ctx.fillStyle = NAVY.deep;
  ctx.fillRect(p.x - 6, g - 20, w + 12, 20);
  const tone = r.chance(0.6) ? "cyan" : "violet";
  holoScreen(ctx, p.x + 10, g - h + 20, w - 20, 150, tone, r.seed(), ["导览"]);
  // 地图面板：细网格 + 你在这里的红点。
  ctx.fillStyle = "#0b1428";
  ctx.fillRect(p.x + 10, g - 96, w - 20, 60);
  ctx.strokeStyle = rgba("#6f86b8", 0.4);
  ctx.lineWidth = 1;
  for (let gx = p.x + 18; gx < p.x + w - 10; gx += 14) {
    ctx.beginPath();
    ctx.moveTo(gx, g - 96);
    ctx.lineTo(gx, g - 36);
    ctx.stroke();
  }
  ctx.fillStyle = LED.red;
  ctx.fillRect(p.x + w * 0.55, g - 70, 5, 5);
  radialGlow(ctx, p.x + w * 0.55 + 2, g - 68, 12, LED.red, 0.6);
}

function drawPhoneBooth(ctx: CanvasRenderingContext2D, p: StreetPlacement): void {
  const r = createRandom(p.seed);
  const g = p.ground;
  const w = p.width;
  const h = 300;
  contactShadow(ctx, p.x + w / 2, g, w * 1.3);
  // 背板与挂壁电话。
  ctx.fillStyle = TEAL.dark;
  ctx.fillRect(p.x + 8, g - h + 36, w - 16, h - 44);
  box(ctx, p.x + w / 2 - 22, g - 200, 44, 70, STEEL);
  ctx.fillStyle = STEEL.deep;
  ctx.fillRect(p.x + w / 2 - 30, g - 210, 12, 46);
  ctx.strokeStyle = "#05060b";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(p.x + w / 2 - 24, g - 166);
  ctx.bezierCurveTo(p.x + w / 2 - 40, g - 130, p.x + w / 2 - 10, g - 120, p.x + w / 2, g - 132);
  ctx.stroke();
  ctx.fillStyle = LED.green;
  ctx.fillRect(p.x + w / 2 + 6, g - 190, 8, 4);
  if (r.chance(0.5)) posterWall(ctx, r, p.x + 12, g - 120, w - 24, 90);
  // 玻璃前脸 + 框。
  ctx.fillStyle = rgba("#9fb6ff", 0.12);
  ctx.fillRect(p.x + 8, g - h + 36, w - 16, h - 44);
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const s = ctx.createLinearGradient(p.x, g - h, p.x + w, g);
  s.addColorStop(0.35, rgba(RIM, 0));
  s.addColorStop(0.45, rgba(RIM, 0.2));
  s.addColorStop(0.5, rgba(RIM, 0));
  ctx.fillStyle = s;
  ctx.fillRect(p.x + 8, g - h + 36, w - 16, h - 44);
  ctx.restore();
  tube(ctx, p.x, g - h, g, 9, STEEL);
  tube(ctx, p.x + w - 9, g - h, g, 9, STEEL);
  ctx.fillStyle = STEEL.dark;
  ctx.fillRect(p.x, g - h * 0.45, w, 6);
  ctx.fillRect(p.x, g - 10, w, 10);
  // 顶部灯牌。
  const { core, glow } = NEON_COLORS.cyan;
  box(ctx, p.x - 4, g - h - 6, w + 8, 44, TEAL);
  ctx.fillStyle = rgba(core, 0.85);
  ctx.fillRect(p.x + 6, g - h + 2, w - 12, 26);
  label(ctx, "电话", p.x + w / 2, g - h + 15, "#07222a", rgba(core, 0));
  radialGlow(ctx, p.x + w / 2, g - h + 14, 90, glow, 0.3);
}

function drawNewsstand(ctx: CanvasRenderingContext2D, p: StreetPlacement): void {
  const r = createRandom(p.seed);
  const g = p.ground;
  const w = p.width;
  const h = 300;
  const [a, b] = r.pick(AWNING_PAIRS);
  const tone = r.chance(0.3) ? "warm" : "white";
  contactShadow(ctx, p.x + w / 2, g, w * 1.2);
  box(ctx, p.x, g - h, w, h, r.chance(0.5) ? TEAL : NAVY);
  // 撑开的窗口：室内灯光 + 杂志架。
  const ox = p.x + 20;
  const oy = g - h + 70;
  const ow = w - 40;
  const oh = 140;
  ctx.fillStyle = "#0c0b14";
  ctx.fillRect(ox, oy, ow, oh);
  const light = ctx.createLinearGradient(0, oy, 0, oy + oh);
  light.addColorStop(0, rgba(lightCore(tone), 0.7));
  light.addColorStop(1, rgba(lightGlow(tone), 0.25));
  ctx.fillStyle = light;
  ctx.fillRect(ox, oy, ow, oh);
  const covers = ["#c9ccdf", "#b35a8c", "#4d6fb0", "#3a8f95", "#d0b070", "#8d7fb8", "#e8e8f0"];
  for (let row = 0; row < 3; row++) {
    for (let mx = ox + 6; mx < ox + ow - 30; mx += r.range(30, 40)) {
      const mh = r.range(34, 40);
      ctx.fillStyle = r.pick(covers);
      ctx.fillRect(mx, oy + 8 + row * 44, 26, mh);
      ctx.fillStyle = rgba("#101020", 0.6);
      ctx.fillRect(mx + 3, oy + 12 + row * 44, 20, 6);
    }
  }
  shadeDown(ctx, ox, oy, ow, 30, 0.6);
  // 前伸的柜台与撑起的卷帘板。
  box(ctx, p.x - 10, oy + oh, w + 20, 20, ALLOY);
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(p.x - 20, oy - 10);
  ctx.lineTo(p.x + w + 20, oy - 10);
  ctx.lineTo(p.x + w + 40, oy + 40);
  ctx.lineTo(p.x - 40, oy + 40);
  ctx.closePath();
  ctx.clip();
  for (let sx = p.x - 40, i = 0; sx < p.x + w + 40; sx += 34, i++) {
    ctx.fillStyle = i % 2 ? a : b;
    ctx.fillRect(sx, oy - 10, 34, 50);
  }
  ctx.fillStyle = rgba(AMBIENT_SHADOW, 0.35);
  ctx.fillRect(p.x - 40, oy - 10, w + 80, 50);
  ctx.restore();
  radialGlow(ctx, p.x + w / 2, oy + oh * 0.5, w * 0.6, lightGlow(tone), 0.16);
  // 顶部灯牌。
  box(ctx, p.x + 20, g - h - 40, w - 40, 40, STEEL);
  ctx.fillStyle = rgba(NEON_COLORS.pink.core, 0.85);
  ctx.fillRect(p.x + 26, g - h - 34, w - 52, 28);
  label(ctx, "报刊 杂志", p.x + w / 2, g - h - 20, "#2a0a20", rgba(NEON_COLORS.pink.core, 0));
  radialGlow(ctx, p.x + w / 2, g - h - 20, w * 0.5, NEON_COLORS.pink.glow, 0.25);
  if (r.chance(0.6)) posterWall(ctx, r, p.x + 16, oy + oh + 30, w - 32, g - oy - oh - 50);
}

export const infoKioskSpec: StreetSpec = {
  kind: "infoKiosk",
  label: "信息亭",
  width: [96, 112],
  lamps: (p) => [lightSpot(p.x + p.width / 2, p.ground - 180, "cyan", "strip")],
  draw: drawInfoKiosk,
};

export const phoneBoothSpec: StreetSpec = {
  kind: "phoneBooth",
  label: "电话亭",
  width: [128, 140],
  lamps: (p) => [lightSpot(p.x + p.width / 2, p.ground - 290, "cyan", "strip")],
  draw: drawPhoneBooth,
};

export const newsstandSpec: StreetSpec = {
  kind: "newsstand",
  label: "报刊亭",
  width: [280, 340],
  lamps: (p) => [lightSpot(p.x + p.width / 2, p.ground - 200, "white")],
  draw: drawNewsstand,
};
