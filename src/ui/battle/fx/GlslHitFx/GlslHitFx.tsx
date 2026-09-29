// ============================================================================
// GLSL 命中特效(斩击/重击/射击/火焰/雷电/毒素) —— 取代原 emoji 首击特效的基础档位。
//
// 全部挂在共享 WebGL 宿主(ui/common/fx/GlslSprite)上: 整局一个上下文、每种程序只编译一次,
// 群攻同屏多目标也只是多几次 drawImage。时间轴约定:
//   · 宿主的 uPhase 从注册时刻 0 起积分 = 挂载后经过的秒数;
//   · 爆点 = ANIM[*].proc.impactMs(掉血/飘字/受击都锚在这一拍), 总长 = GLSL_HIT_SPECS[*].totalMs;
//   · 播放倍速: 挂载时读一次祖先 --fx-rate(与 TwinArrowFx/TriSlashFx 同一语义, 下限 0.25)。
// 震屏/白闪按项目分工归相机与 screenFx, 本组件不做; 顿帧期间照常播放(与 TriSlashFx 一致)。
// 无 WebGL 时不渲染, 受击抖动/闪白/飘字照常。
// ============================================================================

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import type { ProcFxPreset } from "@/ui/battle/choreo/animations";
import { GlslSprite, glslAvailable, type GlslUniforms } from "@/ui/common/fx/GlslSprite";
import { GLSL_HIT_SPECS, type GlslHitKind } from "./glslHitPrograms";
import s from "./GlslHitFx.module.css";

export interface GlslHitFxProps {
  preset: ProcFxPreset;
  /** 特效主色(ANIM[*].color)。 */
  color: string;
}

function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace("#", "").trim();
  if (h.length === 3) h = h.split("").map((ch) => ch + ch).join("");
  const n = parseInt(h.slice(0, 6), 16);
  if (!Number.isFinite(n)) return [1, 1, 1];
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

export function GlslHitFx({ kind, preset, color }: GlslHitFxProps & { kind: GlslHitKind }) {
  const spec = GLSL_HIT_SPECS[kind];
  const wrapRef = useRef<HTMLDivElement>(null);
  const [supported] = useState(glslAvailable);
  const [seed] = useState(Math.random);
  const [rate, setRate] = useState(1);

  // 布局阶段读倍速: 早于宿主的第一帧推进, 爆点不会因倍速而错位。
  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const cssRate = parseFloat(getComputedStyle(el).getPropertyValue("--fx-rate"));
    setRate(Math.max(0.25, Number.isFinite(cssRate) && cssRate > 0 ? cssRate : 1));
  }, []);

  const uniforms = useMemo<GlslUniforms>(() => ({
    uColor: hexToRgb(color),
    uImpact: preset.impactMs / 1000,
    uTotal: spec.totalMs / 1000,
  }), [color, preset.impactMs, spec.totalMs]);

  if (!supported) return null;
  return (
    <div ref={wrapRef} className={s["glsl-hit"]} data-flip={spec.flipOnPlayer ? "" : undefined}>
      <GlslSprite program={spec.program} width={spec.width} height={spec.height} uniforms={uniforms} seed={seed} rate={rate} />
    </div>
  );
}

/** 与 CardAnim 同名的组件表, 供 HitFxLayer 的 PROC_FX 直接展开。 */
export const GLSL_HIT_FX: Record<GlslHitKind, (p: GlslHitFxProps) => JSX.Element | null> = {
  slash: (p) => <GlslHitFx kind="slash" {...p} />,
  smash: (p) => <GlslHitFx kind="smash" {...p} />,
  shot: (p) => <GlslHitFx kind="shot" {...p} />,
  fire: (p) => <GlslHitFx kind="fire" {...p} />,
  lightning: (p) => <GlslHitFx kind="lightning" {...p} />,
  poison: (p) => <GlslHitFx kind="poison" {...p} />,
};
