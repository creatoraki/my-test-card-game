import type { BuildingPlacement, LightTone, NeonTone } from "../types";
import { createRandom, type Random } from "../core/base/random";
import { AMBIENT_SHADOW, RIM_HOT, STEEL, STONE, lightCore, lightGlow, rgba } from "../core/base/palette";
import { shadeDown } from "../core/base/shading";
import { wallSurface } from "../core/base/surfaces";
import { radialGlow } from "../core/light/glow";
import { holoBanner } from "../core/light/holo";
import { FONT, VERTICAL_WORDS } from "../core/fixtures/signs";
import { cornerShadow, pilaster, plinth, slabBand, STOREY } from "../facade/storey";
import { curtainWall } from "../facade/windows";
import { glassDoor } from "../facade/storefront";
import { BASE, doorSpot, floorY, skyY, type BuildingSpec } from "./common";

// 写字楼底层：三层以上、上部出画。底层是石材柱廊，柱后退进一面通高玻璃大堂（前台、灯盘、绿植），
// 柱廊上方石材檐板嵌金属立体字；楼上整面玻璃幕墙，两端石材边柱，柱上挂全息竖幅。

const COLONNADE_H = 400;
const PILLAR_W = 70;
const NAMES = ["星环大厦", "远川集团", "新港中心", "穹顶科技", "北辰金融"] as const;

/** 大堂：冷白灯盘阵列 + 前台 + 绿植剪影。 */
function lobby(ctx: CanvasRenderingContext2D, r: Random, x: number, y: number, w: number, h: number, tone: LightTone): void {
  const core = lightCore(tone);
  const glow = lightGlow(tone);
  ctx.fillStyle = "#0b0c18";
  ctx.fillRect(x, y, w, h);
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, rgba(core, 0.6));
  g.addColorStop(0.3, rgba(glow, 0.3));
  g.addColorStop(1, rgba(glow, 0.12));
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
  for (let ly = y + 12; ly < y + 70; ly += 22) {
    for (let lx = x + 30; lx < x + w - 50; lx += 110) {
      ctx.fillStyle = rgba(core, 0.85 - (ly - y) / 140);
      ctx.fillRect(lx, ly, 60, 5);
    }
  }
  // 前台。
  const dw = Math.min(360, w * 0.4);
  const dx = x + r.range(0.1, 0.9) * (w - dw);
  ctx.fillStyle = "#101426";
  ctx.fillRect(dx, y + h - 110, dw, 110);
  ctx.fillStyle = rgba(core, 0.8);
  ctx.fillRect(dx, y + h - 110, dw, 4);
  radialGlow(ctx, dx + dw / 2, y + h - 110, dw * 0.6, glow, 0.2);
  // 绿植剪影。
  for (let i = 0; i < 2; i++) {
    const px = x + r.range(20, w - 80);
    ctx.fillStyle = "#0a1416";
    ctx.fillRect(px + 20, y + h - 60, 40, 60);
    ctx.beginPath();
    ctx.ellipse(px + 40, y + h - 110, 50, 60, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** 金属立体字：背光光晕 + 厚度侧面 + 正面冷色金属。 */
function metalLetters(ctx: CanvasRenderingContext2D, text: string, cx: number, cy: number, size: number, tone: NeonTone): void {
  ctx.save();
  ctx.font = `900 ${size}px ${FONT}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = lightGlow(tone);
  ctx.shadowColor = lightGlow(tone);
  ctx.shadowBlur = size * 0.8;
  ctx.globalAlpha = 0.6;
  ctx.fillText(text, cx, cy);
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#05060c";
  ctx.fillText(text, cx + 4, cy + 5);
  const g = ctx.createLinearGradient(0, cy - size / 2, 0, cy + size / 2);
  g.addColorStop(0, "#e8eeff");
  g.addColorStop(0.5, "#8d9bc4");
  g.addColorStop(1, "#4a5578");
  ctx.fillStyle = g;
  ctx.fillText(text, cx, cy);
  ctx.restore();
}

function drawOffice(ctx: CanvasRenderingContext2D, p: BuildingPlacement): void {
  const r = createRandom(p.seed);
  const door = p.lamps.find((lamp) => lamp.door) ?? p.lamps[0];
  const top = Math.max(floorY(p.storeys), skyY(p));
  const fasciaY = floorY(1);
  const colTop = BASE - COLONNADE_H;
  const edge = 64;

  // 楼上：两端石材边柱夹一整面玻璃幕墙。
  curtainWall(ctx, r, p.x + edge, top, p.width - edge * 2, fasciaY, STOREY, r.chance(0.7) ? "white" : "cyan");
  wallSurface(ctx, "stone", p.x, top, edge, fasciaY - top, STONE, p.seed);
  wallSurface(ctx, "stone", p.x + p.width - edge, top, edge, fasciaY - top, STONE, p.seed + 1);

  // 底层：退进的大堂 + 玻璃门。
  lobby(ctx, r, p.x + 20, colTop, p.width - 40, COLONNADE_H, "white");
  ctx.fillStyle = STEEL.dark;
  for (let mx = p.x + 20; mx < p.x + p.width - 20; mx += 160) ctx.fillRect(mx, colTop, 5, COLONNADE_H);
  glassDoor(ctx, r, door.x, 240, COLONNADE_H - 60, "white");
  shadeDown(ctx, p.x, colTop, p.width, 90, 0.7);

  // 石材檐板 + 立体字。
  wallSurface(ctx, "stone", p.x - 10, fasciaY, p.width + 20, colTop - fasciaY, STONE, p.seed + 2, 1.2);
  metalLetters(ctx, r.pick(NAMES), door.x, (fasciaY + colTop) / 2 + 4, Math.min(64, (colTop - fasciaY) * 0.62), p.neon);
  slabBand(ctx, p.x, p.width, fasciaY, STONE, 20, 16);

  // 柱廊：柱子落在两端与门两侧之外，避开门洞。
  const pillars = Math.max(3, Math.round(p.width / 290));
  for (let i = 0; i < pillars; i++) {
    const px = p.x + ((p.width - PILLAR_W) * i) / (pillars - 1);
    if (Math.abs(px + PILLAR_W / 2 - door.x) < 170) continue;
    pilaster(ctx, px, colTop, BASE, PILLAR_W, STONE);
    ctx.fillStyle = rgba(AMBIENT_SHADOW, 0.45);
    ctx.beginPath();
    ctx.ellipse(px + PILLAR_W / 2 + 20, BASE, PILLAR_W, 8, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  if (r.chance(0.6) && top < fasciaY - 300) {
    const bx = r.chance(0.5) ? p.x + 10 : p.x + p.width - edge + 10;
    holoBanner(ctx, bx, Math.max(top + 20, fasciaY - 520), edge - 20, 460, p.neon === "cyan" ? "pink" : "cyan", r.pick(VERTICAL_WORDS));
  }
  plinth(ctx, p.x, p.width, STONE, 26);
  ctx.fillStyle = rgba(RIM_HOT, 0.3);
  ctx.fillRect(p.x + p.width - 1.5, top, 1.5, BASE - top);
  cornerShadow(ctx, p.x, top, BASE, "left", 36);
  cornerShadow(ctx, p.x + p.width, top, BASE, "right", 36);
}

export const officeSpec: BuildingSpec = {
  kind: "office",
  label: "写字楼",
  width: [900, 1300],
  storeys: [3, 4, 5],
  crown: 40,
  weight: 0.8,
  lamps: (x, w, _storeys, rnd) => {
    const door = x + w * rnd.range(0.35, 0.65);
    return [
      doorSpot(door, BASE - COLONNADE_H + 30, rnd.chance(0.6) ? "white" : "cyan", "strip"),
      { x: Math.round(x + w * (door < x + w / 2 ? 0.78 : 0.22)), y: BASE - 220, tone: "white", kind: "lamp", door: false },
    ];
  },
  draw: drawOffice,
};
