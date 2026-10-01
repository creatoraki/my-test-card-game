// ============================================================================
// 青岚横断 —— 爆点及之后的绘制: 全屏白闪、各目标刀痕、落叶风屑、余韵疾风。
// ★ 所有目标的刀痕都锚在同一个 impact, 这是「一刀横断整排」而不是「n 次单体」的关键。
// ============================================================================

import { lineY, type GaleLayout } from "./galeSweepLayout";
import { glow } from "./galeSweepDraw";
import {
  BURST_SHARDS,
  GALE_RGB,
  GALE_TIMELINE as T,
  GUSTS,
  LEAVES,
  clamp01,
  easeOut,
  lerp,
  phase,
} from "./galeSweepTimeline";

const TAU = Math.PI * 2;
const LEAF_TONES = [GALE_RGB.jade, GALE_RGB.mist, GALE_RGB.deep] as const;

/** 爆点白闪: 170ms 内平方衰减, 青白色。 */
export function drawFlash(ctx: CanvasRenderingContext2D, L: GaleLayout, t: number): void {
  if (t < T.impact) return;
  const f = phase(t, T.impact, 170);
  if (f >= 1) return;
  ctx.globalCompositeOperation = "lighter";
  ctx.fillStyle = `rgba(${GALE_RGB.mist}, ${(0.36 * (1 - f) ** 2).toFixed(3)})`;
  ctx.fillRect(0, 0, L.w, L.h);
}

/** 每个命中目标: 沿斩线的刀痕 + 爆光 + 拉扁冲击环 + 碎风片。 */
export function drawWounds(ctx: CanvasRenderingContext2D, L: GaleLayout, t: number): void {
  const q = t - T.impact;
  if (q < 0 || q > 620) return;
  ctx.globalCompositeOperation = "lighter";
  const base = Math.atan(L.slope);
  L.points.forEach((point, index) => {
    if (point.missed) return;
    // 刀痕角度按目标序号轻微错开, 整排不至于像复制粘贴。
    const angle = base + (index % 2 === 0 ? 0.05 : -0.1);
    cut(ctx, point.x, point.y, angle, q);
    glow(ctx, point.x, point.y, 40 + 130 * easeOut(clamp01(q / 220)), 0.75 * (1 - clamp01(q / 260)) ** 2);
    ring(ctx, point.x, point.y, angle, q);
    shards(ctx, point.x, point.y, index, q);
  });
}

function cut(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, q: number): void {
  const alpha = 1 - clamp01(q / 360);
  if (alpha <= 0) return;
  const half = (260 + 120 * easeOut(clamp01(q / 220))) / 2;
  const width = 12 * (1 - easeOut(clamp01(q / 260))) + 0.8;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  const grad = ctx.createLinearGradient(-half, 0, half, 0);
  grad.addColorStop(0, `rgba(${GALE_RGB.jade}, 0)`);
  grad.addColorStop(0.3, `rgba(${GALE_RGB.jade}, ${(alpha * 0.8).toFixed(3)})`);
  grad.addColorStop(0.5, `rgba(${GALE_RGB.white}, ${alpha.toFixed(3)})`);
  grad.addColorStop(0.7, `rgba(${GALE_RGB.jade}, ${(alpha * 0.8).toFixed(3)})`);
  grad.addColorStop(1, `rgba(${GALE_RGB.jade}, 0)`);
  ctx.fillStyle = grad;
  // 两端收尖的梭形刀痕。
  ctx.beginPath();
  ctx.moveTo(-half, 0);
  ctx.quadraticCurveTo(0, -width, half, 0);
  ctx.quadraticCurveTo(0, width, -half, 0);
  ctx.fill();
  ctx.restore();
}

function ring(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, q: number): void {
  const e = clamp01(q / 320);
  if (e >= 1) return;
  const k = easeOut(e);
  ctx.strokeStyle = `rgba(${GALE_RGB.mist}, ${(0.7 * (1 - e)).toFixed(3)})`;
  ctx.lineWidth = 3.5 * (1 - e) + 0.8;
  ctx.beginPath();
  ctx.ellipse(x, y, 30 + 250 * k, 10 + 80 * k, angle, 0, TAU);
  ctx.stroke();
}

function shards(ctx: CanvasRenderingContext2D, x: number, y: number, index: number, q: number): void {
  for (const shard of BURST_SHARDS) {
    const s = q / shard.life;
    if (s >= 1) continue;
    const angle = shard.angle + index * 0.9;
    const dist = shard.speed * (q / 1000) * (1 - 0.45 * s);
    const px = x + Math.cos(angle) * dist;
    const py = y + Math.sin(angle) * dist;
    const len = shard.size * 2.2 * (1 - s * 0.5);
    const half = shard.size * 0.28;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(angle);
    ctx.fillStyle = `rgba(${shard.white ? GALE_RGB.white : GALE_RGB.jade}, ${(1 - s).toFixed(3)})`;
    ctx.beginPath();
    ctx.moveTo(len, 0);
    ctx.lineTo(0, -half);
    ctx.lineTo(-len * 0.6, 0);
    ctx.lineTo(0, half);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

/** 落叶 / 风屑: 爆点后沿整条斩线被吹向右侧, 边飘边摆边转。 */
export function drawLeaves(ctx: CanvasRenderingContext2D, L: GaleLayout, t: number): void {
  if (t < T.impact) return;
  ctx.globalCompositeOperation = "lighter";
  const right = Math.min(L.endX, L.w);
  for (const leaf of LEAVES) {
    const q = t - T.impact - leaf.delay;
    if (q <= 0) continue;
    const life = T.total - T.impact - leaf.delay;
    const s = q / life;
    if (s >= 1) continue;
    const sec = q / 1000;
    const x0 = lerp(L.eyeX, right, leaf.u);
    const x = x0 + leaf.vx * sec;
    const y = lineY(L, x0) + leaf.dy + leaf.vy * sec + Math.sin(sec * leaf.freq) * leaf.wobble;
    const alpha = Math.min(1, q / 80) * (1 - s) ** 1.2 * 0.9;
    ctx.fillStyle = `rgba(${LEAF_TONES[leaf.tone]}, ${alpha.toFixed(3)})`;
    ctx.beginPath();
    ctx.ellipse(x, y, leaf.size, leaf.size * 0.38, leaf.spin * sec, 0, TAU);
    ctx.fill();
  }
}

/** 余韵疾风: 爆点后几道长风线顺风横掠, 交代「风还在吹」。 */
export function drawGusts(ctx: CanvasRenderingContext2D, L: GaleLayout, t: number): void {
  if (t < T.impact) return;
  ctx.globalCompositeOperation = "lighter";
  ctx.lineCap = "round";
  for (const gust of GUSTS) {
    const p = (t - T.impact - gust.t0) / gust.dur;
    if (p <= 0 || p >= 1) continue;
    const head = lerp(-L.w * 0.1, L.w * 1.15, easeOut(p, 2));
    const tail = head - gust.len;
    const alpha = Math.sin(Math.PI * p) * 0.45;
    const grad = ctx.createLinearGradient(tail, 0, head, 0);
    grad.addColorStop(0, `rgba(${GALE_RGB.jade}, 0)`);
    grad.addColorStop(1, `rgba(${GALE_RGB.mist}, ${alpha.toFixed(3)})`);
    ctx.strokeStyle = grad;
    ctx.lineWidth = gust.width;
    ctx.beginPath();
    ctx.moveTo(tail, lineY(L, tail) + gust.dy);
    ctx.lineTo(head, lineY(L, head) + gust.dy);
    ctx.stroke();
  }
}
