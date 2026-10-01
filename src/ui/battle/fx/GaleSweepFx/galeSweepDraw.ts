// ============================================================================
// 青岚横断 —— 爆点前的绘制: 压暗、收拢疾风线、风眼、月牙风刃、风痕。
// 全部以设计 px 作图(组件已把 ctx 缩放到设计坐标); 除压暗外一律 lighter 叠加,
// 风是自发光的高光体, 应「加」在场景上而不是「盖」住场景。
// ============================================================================

import { lineY, type GaleLayout } from "./galeSweepLayout";
import {
  GALE_RGB,
  GALE_TIMELINE as T,
  GATHER_STREAKS,
  easeIn,
  easeOut,
  lerp,
  phase,
} from "./galeSweepTimeline";

const TAU = Math.PI * 2;
const TINT_MAX = 0.34;

/** 画面压暗染青: 蓄势时压下去, 爆点后慢慢褪。 */
export function drawTint(ctx: CanvasRenderingContext2D, L: GaleLayout, t: number): void {
  const a = t < T.impact
    ? TINT_MAX * easeOut(phase(t, 0, 380), 2)
    : TINT_MAX * (1 - easeOut(phase(t, T.impact, T.tintOut - T.impact), 2));
  if (a <= 0.002) return;
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = `rgba(${GALE_RGB.shade}, ${a.toFixed(3)})`;
  ctx.fillRect(0, 0, L.w, L.h);
}

/** 收拢疾风线: 从右侧各处向左掠, 途中被吸向斩线, 预告「这一刀会横着来」。 */
export function drawGather(ctx: CanvasRenderingContext2D, L: GaleLayout, t: number): void {
  if (t > T.launch + 120) return;
  ctx.globalCompositeOperation = "lighter";
  ctx.lineCap = "round";
  for (const s of GATHER_STREAKS) {
    const p = (t - s.t0) / s.dur;
    if (p <= 0 || p >= 1) continue;
    const x = s.u * L.w - s.travel * easeIn(p, 1.4);
    const y = lineY(L, x) + s.dy * (1 - easeIn(p, 1.6) * 0.85);
    const len = s.len * (1 - 0.35 * p);
    const alpha = Math.sin(Math.PI * p) * 0.65;
    const grad = ctx.createLinearGradient(x, y, x + len, y);
    grad.addColorStop(0, `rgba(${GALE_RGB.mist}, ${alpha.toFixed(3)})`);
    grad.addColorStop(1, `rgba(${GALE_RGB.jade}, 0)`);
    ctx.strokeStyle = grad;
    ctx.lineWidth = s.width;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + len, y + s.dy * 0.04);
    ctx.stroke();
  }
}

/** 风眼: 斩线左端越转越快的气旋, 风刃射出瞬间炸成一圈冲击。 */
export function drawEye(ctx: CanvasRenderingContext2D, L: GaleLayout, t: number): void {
  if (t < T.eyeIn || t > T.launch + 160) return;
  const ex = L.eyeX;
  const ey = lineY(L, ex);
  ctx.globalCompositeOperation = "lighter";

  if (t < T.launch) {
    const grow = easeOut(phase(t, T.eyeIn, T.launch - T.eyeIn), 2);
    glow(ctx, ex, ey, 30 + 80 * grow, 0.55 * grow);
    ctx.lineCap = "round";
    for (let k = 0; k < 3; k++) {
      const r = (26 + 48 * grow) * (1 + k * 0.38);
      // 角速度随蓄势加快: 相位对时间取二次, 越接近射出转得越急。
      const start = (t / 1000) ** 2 * 26 * (1 + k * 0.4) + k * 2.1;
      ctx.strokeStyle = `rgba(${k === 0 ? GALE_RGB.white : GALE_RGB.jade}, ${(0.85 * grow).toFixed(3)})`;
      ctx.lineWidth = 3.4 - k * 0.8;
      ctx.beginPath();
      ctx.ellipse(ex, ey, r, r * 0.62, 0, start, start + 1.4);
      ctx.stroke();
    }
    return;
  }

  const q = phase(t, T.launch, 160);
  const r = 60 + 200 * easeOut(q);
  ctx.strokeStyle = `rgba(${GALE_RGB.mist}, ${(0.75 * (1 - q)).toFixed(3)})`;
  ctx.lineWidth = 6 * (1 - q) + 1;
  ctx.beginPath();
  ctx.ellipse(ex, ey, r, r * 0.55, 0, 0, TAU);
  ctx.stroke();
  glow(ctx, ex, ey, 110 * (1 - q * 0.5), 0.6 * (1 - q));
}

/** 风刃当前的横坐标进度(0 = 风眼, 1 = 出画)。 */
function bladeProgress(t: number): number {
  return easeOut(phase(t, T.launch, T.sweepEnd - T.launch), 1.6);
}

/** 月牙风刃: 凸向飞行方向, 身后拖 4 道残影。 */
export function drawBlade(ctx: CanvasRenderingContext2D, L: GaleLayout, t: number): void {
  if (t < T.launch || t > T.sweepEnd + 40) return;
  const p = bladeProgress(t);
  const grow = easeOut(phase(t, T.launch, 70), 2);
  const angle = Math.atan(L.slope);
  ctx.globalCompositeOperation = "lighter";
  for (let k = 4; k >= 0; k--) {
    const pk = Math.max(0, p - k * 0.045);
    const x = lerp(L.eyeX, L.endX, pk);
    const alpha = k === 0 ? 1 : 0.42 * (1 - k / 5);
    crescent(ctx, x, lineY(L, x), angle, L.bladeH * grow * (1 - k * 0.06), alpha, k === 0);
  }
}

function crescent(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  height: number,
  alpha: number,
  main: boolean,
): void {
  if (height < 4) return;
  const h2 = height / 2;
  const w = height * 0.34;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.moveTo(0, -h2);
  ctx.quadraticCurveTo(w * 1.9, 0, 0, h2);
  ctx.quadraticCurveTo(w * 0.85, 0, 0, -h2);
  ctx.closePath();
  const grad = ctx.createLinearGradient(-w * 0.1, 0, w, 0);
  grad.addColorStop(0, `rgba(${GALE_RGB.deep}, 0)`);
  grad.addColorStop(0.45, `rgba(${GALE_RGB.jade}, 0.55)`);
  grad.addColorStop(0.8, `rgba(${GALE_RGB.mist}, 0.9)`);
  grad.addColorStop(1, `rgba(${GALE_RGB.white}, 1)`);
  ctx.fillStyle = grad;
  if (main) {
    ctx.shadowColor = `rgba(${GALE_RGB.jade}, 0.9)`;
    ctx.shadowBlur = 30;
  }
  ctx.fill();
  if (main) {
    // 外缘一条白刃线: 风刃的「锋」。
    ctx.shadowBlur = 0;
    ctx.strokeStyle = `rgba(${GALE_RGB.white}, 0.95)`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, -h2);
    ctx.quadraticCurveTo(w * 1.9, 0, 0, h2);
    ctx.stroke();
  }
  ctx.restore();
}

/** 风痕: 风刃身后的光带 → 静默期收成细亮线 → 爆点上下裂开退散。 */
export function drawTrail(ctx: CanvasRenderingContext2D, L: GaleLayout, t: number): void {
  if (t < T.launch || t > T.impact + 480) return;
  ctx.globalCompositeOperation = "lighter";
  ctx.lineCap = "round";
  const x0 = L.eyeX;

  if (t < T.impact) {
    const head = lerp(L.eyeX, L.endX, bladeProgress(t));
    const settle = phase(t, T.sweepEnd, T.impact - T.sweepEnd);
    const band = lerp(30, 4, easeOut(settle, 2));
    const grad = ctx.createLinearGradient(x0, 0, head, 0);
    grad.addColorStop(0, `rgba(${GALE_RGB.jade}, 0.12)`);
    grad.addColorStop(1, `rgba(${GALE_RGB.jade}, 0.6)`);
    strokeLine(ctx, L, x0, head, 0, band, grad);
    const shimmer = 0.85 + 0.15 * Math.sin(t * 0.35);
    strokeLine(ctx, L, x0, head, 0, 2.6 + settle, `rgba(${GALE_RGB.white}, ${(0.9 * shimmer).toFixed(3)})`);
    return;
  }

  // 爆点: 先一道粗白闪贯穿全线, 再上下两道断续裂线张开。
  const f = phase(t, T.impact, 140);
  if (f < 1) strokeLine(ctx, L, x0, L.endX, 0, 24 * (1 - f) + 1, `rgba(${GALE_RGB.white}, ${(1 - f).toFixed(3)})`);
  const q = phase(t, T.impact, 480);
  const gap = 6 + 52 * easeOut(q);
  const alpha = (0.85 * (1 - q)).toFixed(3);
  const width = 3.2 * (1 - q) + 0.6;
  ctx.setLineDash([90, 18, 46, 12, 130, 22]);
  ctx.lineDashOffset = q * 120;
  strokeLine(ctx, L, x0, L.endX, -gap, width, `rgba(${GALE_RGB.mist}, ${alpha})`);
  ctx.lineDashOffset = -q * 120 + 37;
  strokeLine(ctx, L, x0, L.endX, gap, width, `rgba(${GALE_RGB.jade}, ${alpha})`);
  ctx.setLineDash([]);
  ctx.lineDashOffset = 0;
}

function strokeLine(
  ctx: CanvasRenderingContext2D,
  L: GaleLayout,
  xa: number,
  xb: number,
  dy: number,
  width: number,
  style: string | CanvasGradient,
): void {
  ctx.strokeStyle = style;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(xa, lineY(L, xa) + dy);
  ctx.lineTo(xb, lineY(L, xb) + dy);
  ctx.stroke();
}

/** 径向光晕(白芯 → 翠 → 透明)。爆点侧也复用。 */
export function glow(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, alpha: number): void {
  if (alpha <= 0.002 || r <= 1) return;
  const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
  grad.addColorStop(0, `rgba(${GALE_RGB.white}, ${alpha.toFixed(3)})`);
  grad.addColorStop(0.35, `rgba(${GALE_RGB.jade}, ${(alpha * 0.55).toFixed(3)})`);
  grad.addColorStop(1, `rgba(${GALE_RGB.deep}, 0)`);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
}
