import { NEAR_SCENE_GEOMETRY } from "../types";
import { hash01 } from "../core/base/random";
import { ALLOY, LED, RIM, RIM_HOT, STEEL, rgba } from "../core/base/palette";
import { fillTexture } from "../core/base/grain";
import { hazardBand, rivetLine } from "../core/fixtures/rivets";

// 行走带：固定样式，所有房间一致。深枪铁光面钢板三排由后向前逐渐变宽（透视），拼缝带斜率做出纵深，
// 中排零星嵌着地灯；前沿一条分段青色 LED 引导灯带 + 窄警示条 + 合金前梁。所有纹样按世界绝对坐标取值，可无缝衔接。

export const FLOOR_SEED = 7331;

const G = NEAR_SCENE_GEOMETRY;
/** 甲板前缘（其下为 LED 灯带与警示条）。 */
export const DECK_BOTTOM = G.walkFrontY - 10;
const LED_Y = DECK_BOTTOM;
const LED_H = 4;
const ROWS = [
  { y0: G.baseY + 8, y1: G.baseY + 25 },
  { y0: G.baseY + 25, y1: G.baseY + 47 },
  { y0: G.baseY + 47, y1: DECK_BOTTOM },
];
const PLATE = 128;
const SLANT = 0.24;
const DASH = 36;
const DASH_GAP = 12;

let grid: HTMLCanvasElement | null = null;

/** 细网格纹单元：极淡的亮线 + 暗线，给光面钢板一点加工纹理。 */
function gridSource(): HTMLCanvasElement {
  if (grid) return grid;
  grid = document.createElement("canvas");
  grid.width = 16;
  grid.height = 8;
  const t = grid.getContext("2d")!;
  t.fillStyle = "rgba(0,0,0,0.35)";
  t.fillRect(0, 7, 16, 1);
  t.fillRect(15, 0, 1, 8);
  t.fillStyle = "rgba(170,190,255,0.08)";
  t.fillRect(0, 0, 16, 1);
  return grid;
}

function seam(ctx: CanvasRenderingContext2D, sx: number, y0: number, y1: number): void {
  const a = sx + (y0 - G.baseY) * SLANT;
  const b = sx + (y1 - G.baseY) * SLANT;
  ctx.beginPath();
  ctx.moveTo(a, y0);
  ctx.lineTo(b, y1);
  ctx.strokeStyle = STEEL.deep;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(a + 2, y0);
  ctx.lineTo(b + 2, y1);
  ctx.strokeStyle = rgba(RIM, 0.22);
  ctx.lineWidth = 1;
  ctx.stroke();
}

/** 中排钢板上的嵌入式地灯：暗槽 + 青色灯芯 + 光晕。 */
function floorLight(ctx: CanvasRenderingContext2D, cx: number, y: number): void {
  ctx.fillStyle = "#03050c";
  ctx.fillRect(cx - 16, y - 3, 32, 6);
  ctx.fillStyle = rgba(LED.cyan, 0.85);
  ctx.fillRect(cx - 13, y - 1, 26, 2);
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.translate(cx, y);
  ctx.scale(1, 0.3);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 60);
  g.addColorStop(0, rgba(LED.cyan, 0.32));
  g.addColorStop(1, rgba(LED.cyan, 0));
  ctx.fillStyle = g;
  ctx.fillRect(-60, -60, 120, 120);
  ctx.restore();
}

function plateRow(ctx: CanvasRenderingContext2D, row: (typeof ROWS)[number], index: number, x0: number, x1: number): void {
  const offset = hash01(index, FLOOR_SEED) * PLATE;
  const first = Math.floor((x0 - offset - PLATE) / PLATE);
  const last = Math.ceil((x1 - offset + PLATE) / PLATE);
  const dy0 = (row.y0 - G.baseY) * SLANT;
  const dy1 = (row.y1 - G.baseY) * SLANT;
  for (let k = first; k <= last; k++) {
    const sx = k * PLATE + offset;
    const tint = hash01(k, FLOOR_SEED + index * 31) - 0.5;
    ctx.fillStyle = tint > 0 ? rgba("#9fb4ff", tint * 0.09) : rgba("#000000", -tint * 0.2);
    ctx.beginPath();
    ctx.moveTo(sx + dy0, row.y0);
    ctx.lineTo(sx + PLATE + dy0, row.y0);
    ctx.lineTo(sx + PLATE + dy1, row.y1);
    ctx.lineTo(sx + dy1, row.y1);
    ctx.closePath();
    ctx.fill();
    seam(ctx, sx, row.y0, row.y1);
    if (index === 1 && hash01(k, FLOOR_SEED + 211) < 0.22) floorLight(ctx, sx + PLATE / 2 + (dy0 + dy1) / 2, (row.y0 + row.y1) / 2);
  }
  ctx.fillStyle = STEEL.deep;
  ctx.fillRect(x0, row.y1 - 1, x1 - x0, 2);
  ctx.fillStyle = rgba(RIM, 0.16);
  ctx.fillRect(x0, row.y1 + 1, x1 - x0, 1);
}

/** 分段 LED 引导灯带：暗槽 + 按世界坐标分段的青色灯条，统一加一层外发光。 */
function guideStrip(ctx: CanvasRenderingContext2D, x0: number, x1: number): void {
  const w = x1 - x0;
  ctx.fillStyle = "#020309";
  ctx.fillRect(x0, LED_Y, w, LED_H);
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const halo = ctx.createLinearGradient(0, LED_Y - 16, 0, LED_Y + LED_H + 16);
  halo.addColorStop(0, rgba(LED.cyan, 0));
  halo.addColorStop(0.5, rgba(LED.cyan, 0.2));
  halo.addColorStop(1, rgba(LED.cyan, 0));
  ctx.fillStyle = halo;
  ctx.fillRect(x0, LED_Y - 16, w, LED_H + 32);
  ctx.restore();
  const period = DASH + DASH_GAP;
  const first = Math.floor(x0 / period) * period;
  ctx.save();
  ctx.shadowColor = LED.cyan;
  ctx.shadowBlur = 8;
  ctx.fillStyle = rgba(LED.cyan, 0.95);
  ctx.beginPath();
  for (let x = first; x < x1 + period; x += period) ctx.rect(x, LED_Y + 1, DASH, LED_H - 2);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = rgba("#ffffff", 0.7);
  ctx.beginPath();
  for (let x = first; x < x1 + period; x += period) ctx.rect(x + 4, LED_Y + 1.5, DASH - 8, 1);
  ctx.fill();
}

export function drawWalkway(ctx: CanvasRenderingContext2D, x0: number, x1: number): void {
  const w = x1 - x0;
  const deck = ctx.createLinearGradient(0, G.baseY, 0, DECK_BOTTOM);
  deck.addColorStop(0, "#080b14");
  deck.addColorStop(0.35, "#111726");
  deck.addColorStop(1, "#1a2236");
  ctx.fillStyle = deck;
  ctx.fillRect(x0, G.baseY, w, DECK_BOTTOM - G.baseY);

  ctx.fillStyle = "#04050b";
  ctx.fillRect(x0, G.baseY, w, 8);
  ctx.fillStyle = rgba(RIM, 0.3);
  ctx.fillRect(x0, G.baseY + 8, w, 1);

  const pattern = ctx.createPattern(gridSource(), "repeat")!;
  ctx.save();
  ctx.fillStyle = pattern;
  ctx.fillRect(x0, ROWS[0].y0, w, DECK_BOTTOM - ROWS[0].y0);
  ctx.restore();
  ROWS.forEach((row, i) => plateRow(ctx, row, i, x0, x1));

  ctx.save();
  ctx.beginPath();
  ctx.rect(x0, G.baseY, w, DECK_BOTTOM - G.baseY);
  ctx.clip();
  fillTexture(ctx, "grain", x0, G.baseY, w, DECK_BOTTOM - G.baseY, 0.55, 0);
  fillTexture(ctx, "grime", x0, G.baseY, w, DECK_BOTTOM - G.baseY, 0.18, 113);
  // 光面钢板的镜面高光带。
  ctx.globalCompositeOperation = "lighter";
  const sheen = ctx.createLinearGradient(0, G.baseY + 20, 0, DECK_BOTTOM);
  sheen.addColorStop(0, rgba(RIM, 0));
  sheen.addColorStop(0.7, rgba(RIM, 0.07));
  sheen.addColorStop(1, rgba(RIM, 0.02));
  ctx.fillStyle = sheen;
  ctx.fillRect(x0, G.baseY + 20, w, DECK_BOTTOM - G.baseY - 20);
  ctx.restore();

  guideStrip(ctx, x0, x1);
  hazardBand(ctx, x0, LED_Y + LED_H, w, G.walkFrontY - LED_Y - LED_H, 12);

  const lip = ctx.createLinearGradient(0, G.walkFrontY, 0, G.lipBottomY);
  lip.addColorStop(0, RIM_HOT);
  lip.addColorStop(0.08, ALLOY.hi);
  lip.addColorStop(0.3, ALLOY.mid);
  lip.addColorStop(1, STEEL.dark);
  ctx.fillStyle = lip;
  ctx.fillRect(x0, G.walkFrontY, w, G.lipBottomY - G.walkFrontY);
  const firstRib = Math.floor(x0 / 96) * 96;
  for (let x = firstRib; x < x1 + 96; x += 96) {
    ctx.fillStyle = STEEL.deep;
    ctx.fillRect(x, G.walkFrontY + 3, 3, G.lipBottomY - G.walkFrontY - 3);
    ctx.fillStyle = rgba(RIM, 0.35);
    ctx.fillRect(x + 3, G.walkFrontY + 3, 1, G.lipBottomY - G.walkFrontY - 3);
    const led = hash01(Math.round(x / 96), FLOOR_SEED + 17) < 0.5 ? LED.cyan : LED.pink;
    ctx.fillStyle = led;
    ctx.fillRect(x + 44, G.walkFrontY + 18, 6, 2);
    ctx.fillStyle = rgba(led, 0.25);
    ctx.fillRect(x + 40, G.walkFrontY + 16, 14, 6);
  }
  const firstRivet = Math.floor(x0 / 48) * 48;
  rivetLine(ctx, firstRivet, G.walkFrontY + 9, firstRivet + Math.ceil((w + 96) / 48) * 48, G.walkFrontY + 9, 48, ALLOY);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x0, G.walkFrontY, w, G.lipBottomY - G.walkFrontY);
  ctx.clip();
  fillTexture(ctx, "grain", x0, G.walkFrontY, w, G.lipBottomY - G.walkFrontY, 0.7, 29);
  ctx.restore();
}
