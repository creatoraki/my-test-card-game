import { NEAR_SCENE_GEOMETRY, type NeonTone } from "../types";
import { createRandom, hash01 } from "../core/base/random";
import { ALLOY, FOG_MIST, LED, NEON_COLORS, RIM, STEEL, rgba } from "../core/base/palette";
import { fillTexture } from "../core/base/grain";
import { shadeDown } from "../core/base/shading";
import { rivetLine } from "../core/fixtures/rivets";
import { fanVent, grille, ladder, louver } from "../core/fixtures/metalwork";
import { drawPipe } from "../core/fixtures/pipes";
import { ledDots } from "../core/fixtures/techkit";
import { neonTube, radialGlow, wallLamp } from "../core/light/glow";
import { holoScreen } from "../core/light/holo";
import { FLOOR_SEED } from "./walkway";

// 平台下方结构：固定 256px 模块，由「世界坐标模块序号 + 固定地面种子」哈希决定每段内容，
// 所有房间完全一致且任意宽度无缝。内容为机柜、发光风扇、发光格栅、导管、全息牌；两条长管道按 768px 分段穿过全宽。

const G = NEAR_SCENE_GEOMETRY;
const TOP = G.lipBottomY;
const BOTTOM = G.height;
const MODULE = 256;
const CHUNK = 768;
const LANES = [
  { y: TOP + 58, radius: 9, turn: -1 },
  { y: TOP + 214, radius: 14, turn: 1 },
];

/** 服务器机柜：一格格机位，每格一排状态灯。 */
function serverRack(ctx: CanvasRenderingContext2D, m: number, cx: number, cy: number): void {
  const r = createRandom(m * 7919 + FLOOR_SEED);
  const x = cx - 52;
  const y = cy - 72;
  ctx.fillStyle = "#03050b";
  ctx.fillRect(x - 4, y - 4, 112, 152);
  for (let i = 0; i < 7; i++) {
    const uy = y + i * 20;
    const g = ctx.createLinearGradient(0, uy, 0, uy + 18);
    g.addColorStop(0, ALLOY.mid);
    g.addColorStop(1, STEEL.dark);
    ctx.fillStyle = g;
    ctx.fillRect(x, uy, 104, 18);
    ctx.fillStyle = rgba("#000000", 0.5);
    for (let vx = x + 48; vx < x + 98; vx += 4) ctx.fillRect(vx, uy + 4, 2, 10);
    ledDots(ctx, r, x + 8, uy + 9, r.int(3, 5), 7);
  }
  ctx.fillStyle = rgba(RIM, 0.4);
  ctx.fillRect(x + 103, y, 1.5, 140);
}

function modulePanel(ctx: CanvasRenderingContext2D, m: number): void {
  const x = m * MODULE;
  const px = x + 18;
  const pw = MODULE - 30;
  const py = TOP + 30;
  const ph = BOTTOM - 20 - py;
  const g = ctx.createLinearGradient(0, py, 0, py + ph);
  g.addColorStop(0, "#151b2d");
  g.addColorStop(1, "#070912");
  ctx.fillStyle = g;
  ctx.fillRect(px, py, pw, ph);
  ctx.strokeStyle = STEEL.deep;
  ctx.lineWidth = 3;
  ctx.strokeRect(px, py, pw, ph);
  ctx.fillStyle = rgba(RIM, 0.22);
  ctx.fillRect(px + 2, py + 2, pw - 4, 1);
  rivetLine(ctx, px + 8, py + 8, px + pw - 8, py + 8, 36, STEEL);

  const cx = x + MODULE / 2 + 6;
  const cy = TOP + 122;
  const h = hash01(m, FLOOR_SEED);
  const tone: NeonTone = hash01(m, FLOOR_SEED + 5) < 0.5 ? "cyan" : "pink";
  if (h < 0.18) {
    ctx.fillStyle = STEEL.deep;
    ctx.fillRect(cx - 58, cy - 58, 116, 116);
    fanVent(ctx, cx, cy, 46, STEEL, 7);
    radialGlow(ctx, cx, cy, 56, NEON_COLORS.cyan.glow, 0.4);
  } else if (h < 0.4) {
    serverRack(ctx, m, cx, cy);
  } else if (h < 0.54) {
    const warm = hash01(m, FLOOR_SEED + 9) < 0.25;
    const glow = warm ? "#ff7424" : NEON_COLORS[tone].glow;
    grille(ctx, cx - 62, cy - 36, 124, 72, 10, STEEL, glow);
    radialGlow(ctx, cx, cy, 120, glow, 0.22);
  } else if (h < 0.68) {
    ladder(ctx, cx - 44, TOP + 16, BOTTOM, 22);
    wallLamp(ctx, cx + 36, TOP + 76, 120, "white");
  } else if (h < 0.84) {
    louver(ctx, cx - 60, cy - 42, 96, 84, STEEL);
    neonTube(ctx, cx + 62, TOP + 44, BOTTOM - 44, tone, 3);
  } else {
    holoScreen(ctx, cx - 62, cy - 44, 124, 84, tone === "cyan" ? "violet" : "cyan", m * 131 + FLOOR_SEED, ["维修", "通道"]);
  }
}

function column(ctx: CanvasRenderingContext2D, m: number): void {
  const x = m * MODULE;
  const g = ctx.createLinearGradient(x - 11, 0, x + 11, 0);
  g.addColorStop(0, STEEL.dark);
  g.addColorStop(0.3, ALLOY.light);
  g.addColorStop(0.8, STEEL.deep);
  g.addColorStop(1, RIM);
  ctx.fillStyle = g;
  ctx.fillRect(x - 11, TOP, 22, BOTTOM - TOP);
  ctx.fillStyle = STEEL.deep;
  ctx.fillRect(x - 15, TOP, 4, BOTTOM - TOP);
  ctx.fillRect(x + 11, TOP, 4, BOTTOM - TOP);
  rivetLine(ctx, x, TOP + 24, x, BOTTOM - 10, 30, STEEL);
  const led = hash01(m, FLOOR_SEED + 3) < 0.7 ? LED.cyan : LED.red;
  ctx.fillStyle = led;
  ctx.fillRect(x - 2, TOP + 36, 4, 4);
  radialGlow(ctx, x, TOP + 38, 14, led, 0.5);
}

/** 横管上的发光接缝：一道竖向短光条。 */
function pipeSeamGlow(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number): void {
  ctx.save();
  ctx.fillStyle = LED.cyan;
  ctx.shadowColor = LED.cyan;
  ctx.shadowBlur = 8;
  ctx.fillRect(x - 1.5, y - radius + 1, 3, radius * 2 - 2);
  ctx.restore();
}

function pipeChunk(ctx: CanvasRenderingContext2D, c: number, lane: number): void {
  const { y, radius, turn } = LANES[lane];
  const h = hash01(c, FLOOR_SEED + 101 + lane * 7);
  if (h < 0.2) return;
  const xs = c * CHUNK + 30 + h * 70;
  const xe = (c + 1) * CHUNK - 34;
  const bend = 42 * turn;
  const points: [number, number][] = h < 0.65
    ? [[xs, y + bend], [xs, y], [xe, y], [xe, y + bend]]
    : [[xs, y], [xe, y]];
  drawPipe(ctx, points, radius, h < 0.4 ? ALLOY : STEEL, 190);
  for (let sx = xs + 150; sx < xe - 120; sx += 220) pipeSeamGlow(ctx, sx, y, radius);
}

export function drawUnderbelly(ctx: CanvasRenderingContext2D, x0: number, x1: number): void {
  const w = x1 - x0;
  const wall = ctx.createLinearGradient(0, TOP, 0, BOTTOM);
  wall.addColorStop(0, "#10152a");
  wall.addColorStop(0.5, "#0a0d1a");
  wall.addColorStop(1, "#030409");
  ctx.fillStyle = wall;
  ctx.fillRect(x0, TOP, w, BOTTOM - TOP);

  const firstModule = Math.floor(x0 / MODULE) - 1;
  const lastModule = Math.floor(x1 / MODULE) + 1;
  for (let m = firstModule; m <= lastModule; m++) modulePanel(ctx, m);
  for (let m = firstModule; m <= lastModule; m++) column(ctx, m);
  const firstChunk = Math.floor(x0 / CHUNK) - 1;
  const lastChunk = Math.floor(x1 / CHUNK) + 1;
  for (let lane = 0; lane < LANES.length; lane++) {
    for (let c = firstChunk; c <= lastChunk; c++) pipeChunk(ctx, c, lane);
  }

  const brace = ctx.createLinearGradient(0, TOP, 0, TOP + 18);
  brace.addColorStop(0, ALLOY.mid);
  brace.addColorStop(1, STEEL.deep);
  ctx.fillStyle = brace;
  ctx.fillRect(x0, TOP, w, 18);
  shadeDown(ctx, x0, TOP + 18, w, 60, 0.7);

  ctx.save();
  ctx.beginPath();
  ctx.rect(x0, TOP, w, BOTTOM - TOP);
  ctx.clip();
  fillTexture(ctx, "grain", x0, TOP, w, BOTTOM - TOP, 0.7, 5);
  fillTexture(ctx, "rust", x0, TOP, w, BOTTOM - TOP, 0.08, 83);
  fillTexture(ctx, "grime", x0, TOP, w, BOTTOM - TOP, 0.35, 149);
  ctx.restore();

  // 底部先一层蓝紫雾（与远景底部的雾同色），再压入黑暗。
  const mist = ctx.createLinearGradient(0, BOTTOM - 200, 0, BOTTOM - 70);
  mist.addColorStop(0, rgba(FOG_MIST, 0));
  mist.addColorStop(1, rgba(FOG_MIST, 0.22));
  ctx.fillStyle = mist;
  ctx.fillRect(x0, BOTTOM - 200, w, 200);
  const fade = ctx.createLinearGradient(0, BOTTOM - 110, 0, BOTTOM);
  fade.addColorStop(0, "rgba(0,0,0,0)");
  fade.addColorStop(1, "rgba(0,0,0,0.88)");
  ctx.fillStyle = fade;
  ctx.fillRect(x0, BOTTOM - 110, w, 110);
}
