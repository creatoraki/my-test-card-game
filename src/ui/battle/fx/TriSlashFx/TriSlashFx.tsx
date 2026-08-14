import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import type { ProcFxPreset } from "@/ui/battle/animations";
import {
  TRI_CONFIG,
  TRI_FX,
  TAU,
  clamp,
  type BladeGroup,
} from "./triSlashGeometry";
import s from "./TriSlashFx.module.css";

// ============================================================================
// 三段斩击(tri-slash)首击特效: 单张 Canvas 2D, rAF 驱动, 不循环。
//
// 与 BladeSlashFx / IaiSlashFx 同级 —— 挂载即播、卸载即停, key={hit.seq} 重挂载即重播。
// 为什么是 Canvas 而不是 CSS: 12 道等长圆弦 + 折线弧长连续推进 + 跨折返点拖尾, 这些
// 几何推进在 CSS 关键帧里无法还原(项目已有 AmbienceLayer / BattleTransitionCurtain 先例)。
//
// 分工边界(与 blade-slash 同款):
//   · 震屏 → 相机 SHOTS.tri(useCameraRig.impact)
//   · 全屏白闪 → AnimPreset.screenFx: "flash"(BattleScreen 的 .battle-flash 层)
//   · 顿帧(hitstop)期间命中特效本身继续播放(既有约定), canvas 不接 data-hitstop。
// ============================================================================

// 画布尺寸: 基准 640(目标中心为原点的几何最远伸出约 ±290px, ±320 留有裕量) ×
// 整体放大倍率 FX_SCALE。放大靠 ctx.scale 放大几何本体, 画布与位图同步扩大,
// 不是 CSS 位图拉伸 —— 位图分辨率仍按 dpr 上浮, 放大后保持锐利。
// FX_SCALE 是唯一的尺寸调参点; 画布 CSS 尺寸经 --tri-size 变量由 TS 下发(同 BladeSlashFx
// 的 --blade-len 模式), 与这里同源, 改倍率不用碰 CSS。
const BASE = 640;
const FX_SCALE = 1.2;
const DESIGN = BASE * FX_SCALE; // 768

// 模板内爆点固定 1.85s(几何表真相), 时间轴按 proc.impactMs 与它的比例整体缩放。
const GEOMETRY_IMPACT_S = TRI_CONFIG.phase3.hitTime; // 1.85

// ── 模块 E: 渲染器(模板 Renderer 直搬, 删掉背景/剪影/全屏白闪/震屏) ──

function drawTraces(ctx: CanvasRenderingContext2D, t: number): void {
  // 残痕(刀划过后短暂滞留的光迹)
  for (const tr of TRI_FX.traces) {
    const age = t - tr.t;
    if (age < 0 || age > tr.ttl) continue;
    const alpha = 1 - age / tr.ttl;
    ctx.save();
    ctx.lineCap = "round";
    ctx.strokeStyle = `rgba(150, 215, 255, ${(alpha * 0.35).toFixed(3)})`;
    ctx.lineWidth = tr.width;
    ctx.beginPath();
    ctx.moveTo(tr.from[0], tr.from[1]);
    ctx.lineTo(tr.to[0], tr.to[1]);
    ctx.stroke();
    ctx.restore();
  }
}

/** 刀光主体: 沿折线路径连续扫过(拖尾跨段保留, V 形折返一气呵成)。 */
function drawBladeOnPath(ctx: CanvasRenderingContext2D, group: BladeGroup, segIdx: number, k: number): void {
  const { points, segLens } = group;
  // 刀尖弧长
  let sTip = 0;
  for (let i = 0; i < segIdx; i++) sTip += segLens[i];
  sTip += segLens[segIdx] * k;
  const tip = TRI_FX.arcPoint(group, sTip);
  const sCore = Math.max(0, sTip - 90);
  const core = TRI_FX.arcPoint(group, sCore);

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // 拖尾路径: 从路径起点沿折线到刀尖(跨折返点连续)
  const tracePath = () => {
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i <= segIdx; i++) {
      ctx.lineTo(points[i][0], points[i][1]);
    }
    ctx.lineTo(tip[0], tip[1]);
  };

  // 外层光晕拖尾
  ctx.save();
  ctx.strokeStyle = "rgba(90, 170, 255, 0.35)";
  ctx.lineWidth = 13;
  ctx.shadowColor = "rgba(120, 200, 255, 0.9)";
  ctx.shadowBlur = 18;
  tracePath();
  ctx.stroke();
  ctx.restore();

  // 中层刀光
  ctx.strokeStyle = "rgba(150, 215, 255, 0.85)";
  ctx.lineWidth = 5.5;
  tracePath();
  ctx.stroke();

  // 亮白刀芯: 从刀尖沿路径往回 90px(含跨段折线顶点)
  ctx.strokeStyle = "rgba(255, 255, 255, 0.95)";
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.moveTo(core[0], core[1]);
  let acc = 0;
  for (let i = 0; i < segIdx; i++) {
    acc += segLens[i];
    if (acc > sCore && acc < sTip) {
      ctx.lineTo(points[i + 1][0], points[i + 1][1]);
    }
  }
  ctx.lineTo(tip[0], tip[1]);
  ctx.stroke();

  // 刀尖亮点
  ctx.shadowColor = "rgba(255, 255, 255, 0.95)";
  ctx.shadowBlur = 14;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(tip[0], tip[1], 3.6, 0, TAU);
  ctx.fill();

  ctx.restore();
}

/** 全部刀光: 第一段 V 形折返 + 第二段折返十连斩(统一弧长推进)。 */
function drawSlashes(ctx: CanvasRenderingContext2D, t: number): void {
  const st = TRI_FX.bladeAt(t);
  if (st.active) {
    drawBladeOnPath(ctx, st.group as BladeGroup, st.segIdx, st.k);
    return;
  }
  drawPhase1Fade(ctx, t);
}

/** 第一段光迹延迟淡出: 刀光画完后保留整条 V 形路径, 淡出恰好结束于第二段开始。 */
function drawPhase1Fade(ctx: CanvasRenderingContext2D, t: number): void {
  const f = TRI_FX.phase1Fade;
  if (t < f.start || t >= f.end) return;
  const alpha = 1 - (t - f.start) / (f.end - f.start);
  const pts = f.group.points;
  const last = pts[pts.length - 1];

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const path = () => {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i][0], pts[i][1]);
    }
  };

  // 外层光晕
  ctx.save();
  ctx.strokeStyle = "rgba(90, 170, 255, 0.35)";
  ctx.lineWidth = 13;
  ctx.shadowColor = "rgba(120, 200, 255, 0.9)";
  ctx.shadowBlur = 18;
  path();
  ctx.stroke();
  ctx.restore();

  // 中层刀光
  ctx.strokeStyle = "rgba(150, 215, 255, 0.85)";
  ctx.lineWidth = 5.5;
  path();
  ctx.stroke();

  // 收刀点亮点(随整体一起淡出)
  ctx.shadowColor = "rgba(255, 255, 255, 0.95)";
  ctx.shadowBlur = 14;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(last[0], last[1], 3.6, 0, TAU);
  ctx.fill();

  ctx.restore();
}

/** 第三段: 延迟切痕(伤口迟现, 自中心向两端张开后淡出)。 */
function drawScars(ctx: CanvasRenderingContext2D, t: number): void {
  const age = t - TRI_CONFIG.phase3.hitTime;
  if (age < 0) return;
  const open = clamp(age / TRI_CONFIG.phase3.scarOpenDur, 0, 1);
  let alpha = 1;
  if (age > TRI_CONFIG.phase3.scarFadeFrom) {
    alpha = 1 - (age - TRI_CONFIG.phase3.scarFadeFrom) / TRI_CONFIG.phase3.scarFadeDur;
  }
  if (alpha <= 0) return;

  const scar = TRI_FX.scarSeg;
  const mx = (scar.from[0] + scar.to[0]) / 2;
  const my = (scar.from[1] + scar.to[1]) / 2;
  const dx = scar.to[0] - scar.from[0];
  const dy = scar.to[1] - scar.from[1];
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const nx = -uy;
  const ny = ux;

  ctx.save();
  ctx.lineCap = "round";
  ctx.globalAlpha = alpha;

  // 主切痕: 白芯 + 蓝辉, 自中心向两端张开
  const half = (len / 2) * open;
  const glow = ctx.createLinearGradient(
    mx - ux * half,
    my - uy * half,
    mx + ux * half,
    my + uy * half,
  );
  glow.addColorStop(0, "rgba(120, 200, 255, 0.9)");
  glow.addColorStop(0.5, "rgba(255, 255, 255, 0.98)");
  glow.addColorStop(1, "rgba(120, 200, 255, 0.9)");

  ctx.save();
  ctx.shadowColor = "rgba(150, 220, 255, 0.95)";
  ctx.shadowBlur = 20;
  ctx.strokeStyle = glow;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(mx - ux * half, my - uy * half);
  ctx.lineTo(mx + ux * half, my + uy * half);
  ctx.stroke();
  ctx.restore();

  // 两道次级裂痕: 平行偏移, 稍短
  for (const off of [-9, 9]) {
    const sLen = len * 0.72 * open;
    const cx = mx + nx * off;
    const cy = my + ny * off;
    ctx.strokeStyle = "rgba(160, 220, 255, 0.75)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx - ux * (sLen / 2), cy - uy * (sLen / 2));
    ctx.lineTo(cx + ux * (sLen / 2), cy + uy * (sLen / 2));
    ctx.stroke();
  }

  ctx.restore();
}

/** 受击粒子: 沿刀口方向两侧喷出, 带重力下坠。 */
function drawParticles(ctx: CanvasRenderingContext2D, t: number): void {
  const hitAge = t - TRI_CONFIG.phase3.hitTime;
  if (hitAge <= 0) return;
  for (const p of TRI_FX.hitParticles) {
    const age = hitAge;
    if (age > p.ttl) continue;
    const a = 1 - age / p.ttl;
    const x = p.x + p.vx * age;
    const y = p.y + p.vy * age + 0.5 * p.gravity * age * age;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = p.white ? "#ffffff" : "rgba(150, 215, 255, 0.9)";
    if (p.white) {
      ctx.shadowColor = "rgba(255, 255, 255, 0.9)";
      ctx.shadowBlur = 8;
    }
    ctx.beginPath();
    ctx.arc(x, y, p.size, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
}

/** 爆闪星芒(折返点闪光 + 受击爆发大星芒)。 */
function drawFlashes(ctx: CanvasRenderingContext2D, t: number): void {
  for (const f of TRI_FX.flashes) {
    const age = t - f.t;
    if (age < 0 || age > f.ttl) continue;
    const k = age / f.ttl;
    const r = f.size * (0.3 + k);
    const alpha = 1 - k;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = "rgba(220, 245, 255, 0.95)";
    ctx.lineWidth = 2.5;
    ctx.shadowColor = "rgba(150, 220, 255, 0.95)";
    ctx.shadowBlur = 16;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU;
      ctx.moveTo(f.x, f.y);
      ctx.lineTo(f.x + Math.cos(a) * r, f.y + Math.sin(a) * r);
    }
    ctx.stroke();

    // 中心光晕
    const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, r * 0.6);
    g.addColorStop(0, "rgba(255, 255, 255, 0.95)");
    g.addColorStop(1, "rgba(120, 200, 255, 0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(f.x, f.y, r * 0.6, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
}

/** 整帧渲染入口(模板 Renderer.render 删去背景/剪影/白闪/震屏后的顺序)。 */
function renderFrame(ctx: CanvasRenderingContext2D, t: number): void {
  ctx.clearRect(-DESIGN / 2, -DESIGN / 2, DESIGN, DESIGN);
  drawTraces(ctx, t);
  drawSlashes(ctx, t);
  drawScars(ctx, t);
  drawParticles(ctx, t);
  drawFlashes(ctx, t);
}

// ── 组件 ──

export function TriSlashFx({ preset }: { preset: ProcFxPreset }) {
  // 系统「减少动态效果」: 整层不挂载(连 rAF 都不起), 而不是挂载后再静止。
  // 检查放在外壳组件里, 内部组件的 hook 才不会变成条件调用(同 AmbienceLayer)。
  if (prefersReducedMotion()) return null;
  return <TriSlashCanvas preset={preset} />;
}

function TriSlashCanvas({ preset }: { preset: ProcFxPreset }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const res = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(DESIGN * res);
    canvas.height = Math.round(DESIGN * res);
    ctx.setTransform(res, 0, 0, res, 0, 0);
    ctx.translate(DESIGN / 2, DESIGN / 2); // 此后一律以「目标中心为原点」的设计 px 作图
    ctx.scale(FX_SCALE, FX_SCALE); // 整体放大: 几何坐标不变, 视觉尺寸 ×FX_SCALE, 画布已同步扩大

    // 播放倍速: 挂载时读一次 .battle-world 下发的 --fx-rate(BladeSlashFx.timing 同一语义),
    // 下限 0.25 与 CSS 侧 max(var(--fx-rate, 1), 0.25) 一致。
    const cssRate = parseFloat(getComputedStyle(canvas).getPropertyValue("--fx-rate"));
    const rate = Math.max(0.25, Number.isFinite(cssRate) && cssRate > 0 ? cssRate : 1);

    // 时间轴锚定 proc.impactMs: 几何表爆点固定 1.85s, 按比例缩放后落在预设的爆点上。
    // 当前预设 impactMs = 1850 ⇒ scale = 1; 以后调节奏只改 animations.ts。
    const impactMs = Math.max(1, preset.impactMs);
    const scale = impactMs / (GEOMETRY_IMPACT_S * 1000);
    const total = TRI_CONFIG.loopTotal * scale;

    let raf = 0;
    const t0 = performance.now();
    const frame = (now: number) => {
      const t = ((now - t0) / 1000) * rate;
      if (t >= total) {
        // 不循环: 演出结束后清屏并停止(模板的循环/重放/按钮属演示脚手架,
        // 战斗里靠 key={hit.seq} 重挂载重播)。
        ctx.clearRect(-DESIGN / 2, -DESIGN / 2, DESIGN, DESIGN);
        return;
      }
      renderFrame(ctx, t / scale);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [preset.impactMs]);

  return (
    <canvas
      ref={canvasRef}
      className={s["tri-canvas"]}
      style={{ ["--tri-size" as string]: `${DESIGN}px` } as CSSProperties}
    />
  );
}

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
