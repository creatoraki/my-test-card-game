import type { LightTone } from "../types";
import type { Random } from "../core/base/random";
import { AMBIENT_SHADOW, LED, RIM, STEEL, rgba } from "../core/base/palette";
import { drawPipe, pipeClamp } from "../core/fixtures/pipes";
import { acUnit } from "../core/fixtures/metalwork";
import { ledDots } from "../core/fixtures/techkit";
import { wallLamp } from "../core/light/glow";
import { BASE, M } from "./storey";

// 外墙挂件：落水管、电表箱、成束明线、空调外机组、门牌与壁灯。让立面在中尺度上足够"忙"。

/** 落水管：从檐口一直落到地面，每米一个管卡，底部弯出出水口。 */
export function downpipe(ctx: CanvasRenderingContext2D, x: number, y0: number): void {
  drawPipe(ctx, [[x, y0], [x, BASE - 30], [x + 22, BASE - 8]], 8, STEEL, 0, 18);
  for (let y = y0 + 60; y < BASE - 60; y += M) pipeClamp(ctx, x, y, 8, STEEL);
}

/** 电表箱：铁皮箱 + 观察窗里几块电表 + 顶部引出的一束线。 */
export function meterBox(ctx: CanvasRenderingContext2D, r: Random, x: number, y: number): void {
  const w = 70;
  const h = 96;
  ctx.fillStyle = rgba(AMBIENT_SHADOW, 0.5);
  ctx.fillRect(x + 6, y + 8, w, h);
  const g = ctx.createLinearGradient(x, 0, x + w, 0);
  g.addColorStop(0, STEEL.light);
  g.addColorStop(1, STEEL.dark);
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = "#070a14";
  ctx.fillRect(x + 8, y + 12, w - 16, 44);
  for (let i = 0; i < 2; i++) {
    ctx.fillStyle = "#1c2a3a";
    ctx.fillRect(x + 12 + i * 25, y + 18, 20, 30);
    ctx.fillStyle = rgba(LED.cyan, 0.55);
    ctx.fillRect(x + 14 + i * 25, y + 22, 16, 6);
  }
  ledDots(ctx, r, x + 14, y + 70, 3, 10);
  ctx.fillStyle = STEEL.hi;
  ctx.fillRect(x, y, w, 2);
  ctx.fillRect(x + w - 12, y + 60, 6, 16);
  ctx.strokeStyle = "#05060b";
  ctx.lineWidth = 3;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(x + 18 + i * 14, y);
    ctx.bezierCurveTo(x + 18 + i * 14, y - 40, x + 30 + i * 20, y - 60, x + 30 + i * 22, y - 160);
    ctx.stroke();
  }
}

/** 沿立面水平走的成束明线：几根略微下垂的线在线卡之间起伏。 */
export function wireRun(ctx: CanvasRenderingContext2D, r: Random, x0: number, x1: number, y: number): void {
  const count = r.int(2, 4);
  const span = r.range(120, 200);
  for (let i = 0; i < count; i++) {
    const oy = y + i * 5;
    ctx.strokeStyle = "#05060b";
    ctx.lineWidth = r.range(2, 3.5);
    ctx.beginPath();
    ctx.moveTo(x0, oy);
    for (let x = x0; x < x1; x += span) {
      const nx = Math.min(x1, x + span);
      ctx.quadraticCurveTo((x + nx) / 2, oy + r.range(6, 18), nx, oy);
    }
    ctx.stroke();
  }
  ctx.fillStyle = STEEL.mid;
  for (let x = x0; x <= x1; x += span) ctx.fillRect(x - 3, y - 4, 6, count * 5 + 8);
  ctx.strokeStyle = rgba(RIM, 0.25);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x0, y - 1);
  ctx.lineTo(x1, y - 1);
  ctx.stroke();
}

/** 一组空调外机：竖向或横向排列，各自带挂架与冷凝水渍。 */
export function acStack(ctx: CanvasRenderingContext2D, r: Random, x: number, y: number, count: number, vertical: boolean): void {
  for (let i = 0; i < count; i++) {
    const ax = vertical ? x : x + i * 120;
    const ay = vertical ? y + i * 110 : y;
    acUnit(ctx, ax, ay, r.range(96, 112), r.range(66, 76));
  }
}

/** 门牌：小块蓝底白字的牌子。 */
export function housePlate(ctx: CanvasRenderingContext2D, x: number, y: number, n: number): void {
  ctx.fillStyle = "#16244a";
  ctx.fillRect(x, y, 56, 30);
  ctx.strokeStyle = "#9fb0e8";
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 3, y + 3, 50, 24);
  ctx.fillStyle = "#c9d2e6";
  ctx.font = `900 18px "Microsoft YaHei", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(`${n}号`, x + 28, y + 16);
}

/** 门口壁灯：灯位由规划阶段给出，保证地面反光同源。 */
export function doorLamp(ctx: CanvasRenderingContext2D, x: number, y: number, tone: LightTone): void {
  wallLamp(ctx, x, y, 300, tone);
}
