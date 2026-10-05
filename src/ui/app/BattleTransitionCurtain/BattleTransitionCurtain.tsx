import { useLayoutEffect, useRef } from "react";
import type { TransitionOrigin } from "@/ui/app/shared/transitionOrigin";
import { BATTLE_CRACK_DRAW_MS } from "@/ui/app/shared/transitions";
import { playSfx } from "@/ui/audio";
import { buildFracture } from "./crackGeometry";
import { CRACK_SETTLE_MS, paintCrackFrame, prepareCrackScene } from "./crackPainter";
import s from "./BattleTransitionCurtain.module.css";

interface Props {
  phase: "exit" | "enter";
  origin: TransitionOrigin | null;
}

// ============================================================================
// 探索 → 战斗第一段: 「一点受击的平板玻璃」拟真裂纹。
// 几何生成见 crackGeometry.ts, 逐帧绘制见 crackPainter.ts; 本组件只负责画布尺寸与 rAF 循环。
//
// 时序: 真实断裂是毫秒级瞬发, 这里放慢让人眼能读出"从冲击点炸开", 之后碎片棱边渐渐吃光,
// 网络成型后保持静止, 等同一点烫红烧穿(见 BattleBurnFront)。
// ============================================================================

const MAX_PIXEL_RATIO = 2; // 发丝级裂纹需要比 1.5 更高的采样率, 否则会糊成灰线

function CrackCanvas({ phase, origin }: { phase: Props["phase"]; origin: TransitionOrigin | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useLayoutEffect(() => {
    if (phase !== "exit") return;
    playSfx("shatter");
    // ⓘ 烧穿段的音效原先也在这里(一个 BATTLE_BURN_START_MS 的定时器)。本幕布现在正好在
    //   那一刻被卸载(它不能被烘进 View Transition 的新快照), cleanup 会和定时器抢跑,
    //   于是那一声挪到了 ScreenTransition 的 swap 回调里 —— 时刻完全等价。
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const pixelRatio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);
    const point = origin ?? { x: width / 2, y: height / 2 };
    const context = canvas.getContext("2d");
    if (!context) return;

    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    const scene = prepareCrackScene(context, buildFracture(point, width, height), point);
    let animationFrame = 0;
    const startedAt = performance.now();
    // 网络铺满 + 高光吃透即定格(CRACK_SETTLE_MS 之后每帧都相同, 再画只是白耗);
    // 之后靠 canvas 上残留的最后一帧撑过 hold 段。
    const runMs = Math.min(BATTLE_CRACK_DRAW_MS, CRACK_SETTLE_MS);

    const draw = (now: number) => {
      const elapsed = now - startedAt;
      paintCrackFrame(context, scene, elapsed, width, height);
      if (elapsed < runMs) animationFrame = requestAnimationFrame(draw);
    };

    animationFrame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animationFrame);
  }, [origin, phase]);

  return <canvas ref={canvasRef} className={s["battle-transition-cracks"]} aria-hidden />;
}

export function BattleTransitionCurtain({ phase, origin }: Props) {
  return (
    <div
      className={s["battle-transition-curtain"]}
      // ⓘ 相位原先是 `is-${phase}` 类, 但本文件的 CSS 里**没有任何**规则用到它 ——
      //   Modules 之后 s["is-exit"] 会静默变成 undefined, 与其留个假类名, 不如落成
      //   data 属性: 调试时照样一眼可见, 也不会让人以为它有样式。
      data-phase={phase}
      aria-hidden
    >
      <CrackCanvas phase={phase} origin={origin} />
    </div>
  );
}
