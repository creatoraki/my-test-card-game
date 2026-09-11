// 二连箭(twin-arrow)绘制层 —— 全是 (ctx, …) => void 的纯绘制函数, 吃中心锚点设计坐标。
//
// 造型要点: 弓与箭都是**纯光团**, 没有任何材质与硬边 ——
// 每一层都是半透明色 + globalCompositeOperation: "lighter" 叠加出来的,
// 所以它读起来是「悬在手里的一道光」, 而不是一把有木纹/金属高光的实体弓。
//
// 这一层不持有状态: 粒子的推进在 twinArrowGeometry, 时序在 TwinArrowFx。

import {
  BOW_RADIUS,
  TAU,
  nockOffset,
  type ArrowShot,
  type ImpactBurst,
  type ShockRing,
  type Spark,
} from "./twinArrowGeometry";
import { ARROW_COLORS, BOW_COLORS, IMPACT_COLORS } from "./twinArrowPalette";

/** 三档径向渐变: 配色表里的光团统一用这个形状(中心实 → 中段半透 → 边缘全透)。 */
function radial(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  stops: readonly string[],
): CanvasGradient {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, stops[0]);
  g.addColorStop(0.42, stops[1]);
  g.addColorStop(1, stops[2]);
  return g;
}

/** 纺锤光团: 沿 x 轴拉长的光球 —— 替代原型里的实心三角箭头。 */
function spindle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  stretch: number,
  stops: readonly string[],
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(stretch, 1);
  ctx.fillStyle = radial(ctx, 0, 0, r, stops);
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, TAU);
  ctx.fill();
  ctx.restore();
}

/**
 * 光团弓: 四层同心弧叠加(外辉光 → 金雾 → 主体暖金 → 乳白内芯) + 两端弓梢能量结 +
 * 弓心气场 + 细光丝弓弦。拉弓量 pull 同时调制亮度与辉光半径, 蓄力感全在这里。
 */
export function drawGlowBow(
  ctx: CanvasRenderingContext2D,
  options: {
    origin: { x: number; y: number };
    aimAngle: number;
    pull: number;
    /** 还有箭没离弦时才画蓄力球与待发箭。 */
    charging: boolean;
    /** 存在感包络(0–1): 弓凝聚出来 / 打完散掉, 不做硬切。 */
    alpha?: number;
    radius?: number;
  },
): void {
  const { origin, aimAngle, pull, charging } = options;
  const a = options.alpha ?? 1;
  if (a <= 0) return;
  const R = options.radius ?? BOW_RADIUS;
  const tipX = -R * 0.092;
  const tipY = R * 0.912;
  const nockX = nockOffset(R, pull);

  ctx.save();
  ctx.translate(origin.x, origin.y);
  ctx.rotate(aimAngle);
  ctx.globalCompositeOperation = "lighter";
  ctx.lineCap = "round";

  // 弓心气场: 整把弓浮在一团柔光里, 拉满时最亮。
  ctx.globalAlpha = (0.3 + pull * 0.7) * a;
  ctx.fillStyle = radial(ctx, -R * 0.1, 0, R * 1.5, BOW_COLORS.aura);
  ctx.beginPath();
  ctx.arc(-R * 0.1, 0, R * 1.5, 0, TAU);
  ctx.fill();
  ctx.globalAlpha = 1;

  // 四层弓臂。全部半透明 —— 叠加处自然变亮, 边缘自然发散, 没有一条实边。
  const arm = (width: number, color: string, blur: number, spread: number) => {
    ctx.shadowColor = BOW_COLORS.glow;
    ctx.shadowBlur = blur;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.arc(-R * 0.5, 0, R, -spread, spread);
    ctx.stroke();
  };
  ctx.globalAlpha = a;
  arm(R * 0.62, BOW_COLORS.bloom, 46 + pull * 40, 1.12);
  arm(R * 0.36, BOW_COLORS.haze, 30 + pull * 34, 1.15);
  arm(R * 0.15, BOW_COLORS.core, 16 + pull * 22, 1.15);
  arm(R * 0.05, BOW_COLORS.inner, 10 + pull * 14, 1.08);
  ctx.shadowBlur = 0;

  // 弓梢能量结: 光弓没有弓梢木件, 用两枚光点交代「弓弦挂在哪」。
  ctx.globalAlpha = (0.55 + pull * 0.45) * a;
  for (const y of [-tipY, tipY]) {
    ctx.fillStyle = radial(ctx, tipX, y, R * 0.2, BOW_COLORS.tipKnot);
    ctx.beginPath();
    ctx.arc(tipX, y, R * 0.2, 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // 弓弦: 细光丝。
  ctx.globalAlpha = a;
  ctx.strokeStyle = BOW_COLORS.string;
  ctx.lineWidth = Math.max(1.2, R * 0.022);
  ctx.beginPath();
  ctx.moveTo(tipX, -tipY);
  ctx.lineTo(nockX, 0);
  ctx.lineTo(tipX, tipY);
  ctx.stroke();

  // 蓄力球 + 待发箭: 拉过一半且还有箭时才出现。
  if (charging && pull > 0.35) {
    ctx.globalAlpha = Math.min(1, (pull - 0.35) / 0.45) * a;
    ctx.fillStyle = radial(ctx, nockX, 0, R * 1.15, BOW_COLORS.charge);
    ctx.beginPath();
    ctx.arc(nockX, 0, R * 1.15, 0, TAU);
    ctx.fill();
    drawNockedArrow(ctx, nockX, R);
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}

/** 待发箭(弓局部坐标, 沿 +x 指向目标): 渐变箭杆 + 纺锤光团箭头, 无实心三角。 */
function drawNockedArrow(ctx: CanvasRenderingContext2D, nockX: number, R: number): void {
  const headX = nockX + R * 1.55;

  const shaft = ctx.createLinearGradient(nockX, 0, headX, 0);
  shaft.addColorStop(0, ARROW_COLORS.shaft[0]);
  shaft.addColorStop(0.6, ARROW_COLORS.shaft[1]);
  shaft.addColorStop(1, ARROW_COLORS.shaft[2]);
  ctx.strokeStyle = shaft;
  ctx.lineWidth = Math.max(2, R * 0.05);
  ctx.shadowColor = ARROW_COLORS.glow;
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.moveTo(nockX, 0);
  ctx.lineTo(headX, 0);
  ctx.stroke();
  ctx.shadowBlur = 0;

  spindle(ctx, headX, 0, R * 0.24, 2.1, ARROW_COLORS.body);
  ctx.fillStyle = ARROW_COLORS.white;
  ctx.beginPath();
  ctx.arc(headX, 0, Math.max(1.6, R * 0.028), 0, TAU);
  ctx.fill();
}

/** 飞行中的箭: 长拖尾 + 渐变箭杆 + 纺锤光团箭体 + 白芯。 */
export function drawFlyingArrows(ctx: CanvasRenderingContext2D, arrows: ArrowShot[]): void {
  for (const a of arrows) {
    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.rotate(a.ang);
    ctx.globalCompositeOperation = "lighter";
    ctx.lineCap = "round";

    // 拖尾
    const len = 210;
    const trail = ctx.createLinearGradient(-len, 0, 0, 0);
    trail.addColorStop(0, ARROW_COLORS.trail[0]);
    trail.addColorStop(0.55, ARROW_COLORS.trail[1]);
    trail.addColorStop(1, ARROW_COLORS.trail[2]);
    ctx.strokeStyle = trail;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(-len, 0);
    ctx.lineTo(0, 0);
    ctx.stroke();

    // 箭杆
    const shaft = ctx.createLinearGradient(-46, 0, 12, 0);
    shaft.addColorStop(0, ARROW_COLORS.shaft[0]);
    shaft.addColorStop(0.6, ARROW_COLORS.shaft[1]);
    shaft.addColorStop(1, ARROW_COLORS.shaft[2]);
    ctx.strokeStyle = shaft;
    ctx.lineWidth = 4.5;
    ctx.shadowColor = ARROW_COLORS.glow;
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.moveTo(-46, 0);
    ctx.lineTo(12, 0);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // 箭体光团 + 白芯
    spindle(ctx, 4, 0, 25, 2.5, ARROW_COLORS.body);
    ctx.shadowColor = ARROW_COLORS.white;
    ctx.shadowBlur = 16;
    ctx.fillStyle = ARROW_COLORS.white;
    ctx.beginPath();
    ctx.arc(8, 0, 4.2, 0, TAU);
    ctx.fill();

    ctx.restore();
  }
}

/** 命中光爆: 原型里这层画在怪物身上, 现在独立成光层, 不依赖目标形状。 */
export function drawImpactBursts(ctx: CanvasRenderingContext2D, bursts: ImpactBurst[]): void {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const b of bursts) {
    const p = b.t / b.life;
    const r = 96 + p * 275;
    ctx.globalAlpha = (1 - p) * (1 - p);
    ctx.fillStyle = radial(ctx, b.x, b.y, r, IMPACT_COLORS.burst);
    ctx.beginPath();
    ctx.arc(b.x, b.y, r, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

/** 冲击环: 外圈暖白金 + 内圈纯白, 越扩越细越淡。 */
export function drawShockRings(ctx: CanvasRenderingContext2D, rings: ShockRing[]): void {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const r of rings) {
    const p = r.t / r.life;
    const rad = 14 + p * r.max;
    const alpha = (1 - p) * (1 - p);

    ctx.strokeStyle = IMPACT_COLORS.ringOuter(alpha);
    ctx.lineWidth = 15 * (1 - p) + 1.2;
    ctx.beginPath();
    ctx.arc(r.x, r.y, rad, 0, TAU);
    ctx.stroke();

    ctx.strokeStyle = IMPACT_COLORS.ringInner(alpha * 0.85);
    ctx.lineWidth = 5.4 * (1 - p) + 0.8;
    ctx.beginPath();
    ctx.arc(r.x, r.y, rad * 0.68, 0, TAU);
    ctx.stroke();
  }
  ctx.restore();
}

/** 火花: 一条速度方向的短划 + 一个圆头, 原型同款。 */
export function drawSparks(ctx: CanvasRenderingContext2D, sparks: Spark[]): void {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.lineCap = "round";
  for (const p of sparks) {
    const alpha = Math.max(0, p.life / p.maxLife);
    const color = IMPACT_COLORS.spark(p.hue, alpha);

    ctx.strokeStyle = color;
    ctx.lineWidth = p.size * (0.5 + alpha * 0.6);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x - p.vx * 0.022, p.y - p.vy * 0.022);
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * (0.35 + alpha * 0.55), 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}
