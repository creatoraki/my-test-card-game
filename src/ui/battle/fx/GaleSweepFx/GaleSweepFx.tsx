// ============================================================================
// 青岚横断(gale-sweep) —— 全体攻击的全场级 Canvas 特效。
//
// 与其它 proc 特效的根本区别: 它**不挂在单个目标上**。ScreenFxLayer 每次出牌只挂一份,
// 画布铺满战斗画布, 一道风刃横贯整排敌人, 所有目标在同一个爆点同时落刀痕;
// 各目标的 HitFxLayer 只留空锚点(见 AnimPreset.stage), 只演受击抖动与飘字。
//
// 挂载即播、卸载即停, key 换新即重播; 不循环。分工:
//   · 震屏 / 顿帧 → 相机 SHOTS.gale
//   · 白闪 → 画布内自带(drawFlash), 不走 screenFx
//   · 顿帧期间照常播放(与其它命中特效一致)
// ============================================================================

import { useEffect, useRef } from "react";
import { drawBlade, drawEye, drawGather, drawTint, drawTrail } from "./galeSweepDraw";
import { drawFlash, drawGusts, drawLeaves, drawWounds } from "./galeSweepBurst";
import { createAnchorLookup, measureLayout, type GaleLayout, type GaleTarget } from "./galeSweepLayout";
import { GALE_TIMELINE } from "./galeSweepTimeline";
import s from "./GaleSweepFx.module.css";

export type { GaleTarget } from "./galeSweepLayout";

interface Props {
  targets: GaleTarget[];
  impactMs: number; // = ANIM["gale-sweep"].proc.impactMs, 时间轴按它与表内爆点的比例缩放
  fxRate: number; // 播放倍速(两倍速 = 2), 下限 0.25
}

export function GaleSweepFx({ targets, impactMs, fxRate }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // 目标与倍速只在挂载时取一次: 一次播放内不变, 换一次出牌靠 key 重挂载。
  const initial = useRef({ targets, impactMs, fxRate });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const { targets: list, impactMs: impact, fxRate: rawRate } = initial.current;

    const w = canvas.clientWidth || 1920;
    const h = canvas.clientHeight || 1080;
    const rect = canvas.getBoundingClientRect();
    // 位图分辨率跟着屏幕实际成像走(战斗画布整体被视口缩放), 上限 2 防止 4K 屏过度绘制。
    const screenScale = rect.width > 0 ? rect.width / w : 1;
    const res = Math.min(2, Math.max(0.5, (window.devicePixelRatio || 1) * screenScale));
    canvas.width = Math.round(w * res);
    canvas.height = Math.round(h * res);

    const rate = Math.max(0.25, Number.isFinite(rawRate) && rawRate > 0 ? rawRate : 1);
    const scale = Math.max(1, impact) / GALE_TIMELINE.impact;
    const root = canvas.closest("[data-stage-canvas]") ?? document;
    const lookup = createAnchorLookup(root);
    let layout: GaleLayout | null = null;

    let raf = 0;
    const t0 = performance.now();
    const frame = (now: number) => {
      // t 一律折回表内时间(ms), 绘制函数只认 GALE_TIMELINE。
      const t = ((now - t0) * rate) / scale;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (t >= GALE_TIMELINE.total) return;
      ctx.setTransform(res, 0, 0, res, 0, 0);
      layout = measureLayout(canvas, list, lookup, layout);
      drawTint(ctx, layout, t);
      drawGather(ctx, layout, t);
      drawEye(ctx, layout, t);
      drawTrail(ctx, layout, t);
      drawBlade(ctx, layout, t);
      drawFlash(ctx, layout, t);
      drawWounds(ctx, layout, t);
      drawLeaves(ctx, layout, t);
      drawGusts(ctx, layout, t);
      ctx.globalCompositeOperation = "source-over";
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  return <canvas ref={canvasRef} className={s.canvas} aria-hidden />;
}
