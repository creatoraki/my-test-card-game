// 探索 → 战斗「烧穿」段的画面层: 裂纹停留结束后, 冲击点先被烫红, 随即烧穿,
// 带余烬的火线像纸张燃烧一样向外吞没旧场景, 孔洞里就是战场。
//
// 分工:
//   · 孔洞本身不在这里 —— 它是 ::view-transition-new(root) 的 clip-path, 由 ScreenTransition
//     通过 onClip 逐帧接收本组件算出的多边形。裁切与火线出自同一帧、同一份顶点, 严格贴合。
//   · 本画布带 view-transition-name: battle-burn, 在 swap 的 flushSync 里挂载 ⇒ 它只存在于
//     新状态, 得到自己的一组 VT 伪元素; 新状态伪元素是**实时**画面, rAF 动画照常可见,
//     且排在 root 组之上, 不受 root 的 clip-path 影响 —— 焦痕能画在旧快照上。
//   · 降级模式(opaque, 浏览器没有 View Transition): 旧场景已卸载, 孔外改画深焦色纸面。
//
// 收尾: SPREAD_END_MS 时火线与焦痕早已出屏, 画布清空后停止; 卸载由 ScreenTransition 在
// VT 结束那一帧完成, 此时画布是空的, 没有跳变。

import { useLayoutEffect, useRef } from "react";
import type { TransitionOrigin } from "@/ui/app/shared/transitionOrigin";
import { SPREAD_END_MS, advanceFront, createBurnFront } from "./burnGeometry";
import {
  closedClipPath,
  paintEmberRim,
  paintHotSpot,
  paintInnerShade,
  paintOpaquePaper,
  paintScorch,
  toClipPath,
} from "./burnPainter";
import { burstAtPierce, createParticlePool, emitFromRim, paintParticles, stepParticles } from "./burnParticles";
import s from "./BattleBurnFront.module.css";

export type BurnMode = "vt" | "opaque";

interface Props {
  origin: TransitionOrigin | null;
  mode: BurnMode;
  /** 每帧的孔洞裁切(CSS clip-path 值)。 */
  onClip?: (clip: string) => void;
}

// 火线够粗, 不需要发丝级采样; 全屏画布每帧多层描边, 采样率压一压。
const MAX_PIXEL_RATIO = 1.5;
const PARTICLE_FADE_MS = 260;

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

export function BattleBurnFront({ origin, mode, onClip }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onClipRef = useRef(onClip);
  onClipRef.current = onClip;

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);
    const pixelRatio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    const front = createBurnFront(origin ?? { x: width / 2, y: height / 2 }, width, height);
    const particles = createParticlePool();
    const closedClip = closedClipPath(front.origin);
    const startedAt = performance.now();
    let last = startedAt;
    let pierced = false;
    let animationFrame = 0;

    const draw = (now: number) => {
      const t = now - startedAt;
      const dt = Math.min(50, now - last);
      last = now;
      const stage = advanceFront(front, t);
      context.clearRect(0, 0, width, height);
      if (stage === "done") {
        onClipRef.current?.("none");
        return;
      }

      const burning = stage === "spread";
      if (mode === "opaque") paintOpaquePaper(context, front, burning);
      if (burning) {
        if (!pierced) {
          pierced = true;
          burstAtPierce(particles, front);
        }
        paintScorch(context, front);
        paintInnerShade(context, front);
        paintEmberRim(context, front, t);
        emitFromRim(particles, front, dt);
      }
      paintHotSpot(context, front.origin, t);
      stepParticles(particles, dt);
      paintParticles(context, particles, 1 - clamp01((t - (SPREAD_END_MS - PARTICLE_FADE_MS)) / PARTICLE_FADE_MS));

      onClipRef.current?.(burning ? toClipPath(front.points) : closedClip);
      animationFrame = requestAnimationFrame(draw);
    };

    // 挂载这一帧就先画出烫红的起点, 不留一帧空白给快照。
    draw(startedAt);
    return () => cancelAnimationFrame(animationFrame);
  }, [mode, origin]);

  return <canvas ref={canvasRef} className={s["battle-burn-front"]} aria-hidden />;
}
