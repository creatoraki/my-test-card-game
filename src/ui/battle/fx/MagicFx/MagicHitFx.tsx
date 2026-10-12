// ============================================================================
// 魔法攻击 · 单体命中特效(预言家 / 咒术师): GLSL 程序化, 挂在共享 WebGL 宿主上。
//   · 画布 SINGLE_FX(720×600)中心对齐 .vfx 受击锚点, 着色器以爆点为零点(见 magicFxTimeline.ts);
//   · 爆点 = ANIM[*].proc.impactMs, 掉血/飘字/受击都锚在这一拍; 总长取 MAGIC_TIMELINE[*].total;
//   · 倍速在挂载时读祖先 --fx-rate; 镜头会推近, 像素比放宽到 1.5;
//   · 需要立绘的特效(魂魄抽离)读 portrait, 没有时着色器退回椭圆人形轮廓;
//   · 无 WebGL 时不渲染, 受击抖动/闪白/飘字照常。
// 全场级的两种(星幕 / 怨灵潮)不走这里, 见 MagicStageFx。
// ============================================================================

import { useMemo, useRef, useState } from "react";
import type { ProcFxPreset } from "@/ui/battle/choreo/animations";
import { GlslSprite, glslAvailable, type GlslUniforms } from "@/ui/common/fx/GlslSprite";
import { hexToRgb, useFxRate } from "@/ui/battle/fx/GlslHitFx";
import { MAGIC_PROGRAMS, SINGLE_FX } from "./magicFxPrograms";
import { MAGIC_TIMELINE, type MagicFxKind } from "./magicFxTimeline";
import type { HitPortrait } from "./hitPortrait";
import s from "./MagicFx.module.css";

const PIXEL_RATIO = 1.5;
const NO_FIG = [0, 0, 0, 0] as const;

export interface MagicHitFxProps {
  preset: ProcFxPreset;
  color: string;
  portrait?: HitPortrait | null;
}

export function MagicHitFx({ kind, preset, color, portrait }: MagicHitFxProps & { kind: MagicFxKind }) {
  const spec = MAGIC_PROGRAMS[kind];
  const wrapRef = useRef<HTMLDivElement>(null);
  const [supported] = useState(glslAvailable);
  const [seed] = useState(Math.random);
  const rate = useFxRate(wrapRef);
  // 贴图与立绘框只在挂载时取一次: 一次播放内不变。
  const [art] = useState(() => (spec.texture ? portrait ?? null : null));

  const uniforms = useMemo<GlslUniforms>(() => ({
    uColor: hexToRgb(color),
    uImpact: preset.impactMs / 1000,
    uTotal: MAGIC_TIMELINE[kind].total / 1000,
    uFig: art?.fig ?? NO_FIG,
  }), [color, preset.impactMs, kind, art]);

  if (!supported) return null;
  return (
    <div ref={wrapRef} className={s["magic-hit"]}>
      <GlslSprite
        program={spec.program}
        width={SINGLE_FX.width}
        height={SINGLE_FX.height}
        uniforms={uniforms}
        seed={seed}
        rate={rate}
        texture={art?.texture ?? null}
        pixelRatio={PIXEL_RATIO}
      />
    </div>
  );
}

type MagicSingleKind = Exclude<MagicFxKind, "star-curtain" | "spirit-tide">;

/** 与 CardAnim 同名的组件表(仅单体), 供 HitFxLayer 的 PROC_FX 直接展开。 */
export const MAGIC_HIT_FX: Record<MagicSingleKind, (p: MagicHitFxProps) => JSX.Element | null> = {
  "star-shard": (p) => <MagicHitFx kind="star-shard" {...p} />,
  "twin-orbit": (p) => <MagicHitFx kind="twin-orbit" {...p} />,
  "meteor-fall": (p) => <MagicHitFx kind="meteor-fall" {...p} />,
  "astral-verdict": (p) => <MagicHitFx kind="astral-verdict" {...p} />,
  "gravity-lens": (p) => <MagicHitFx kind="gravity-lens" {...p} />,
  "curse-nail": (p) => <MagicHitFx kind="curse-nail" {...p} />,
  "talisman-seal": (p) => <MagicHitFx kind="talisman-seal" {...p} />,
  "binding-hex": (p) => <MagicHitFx kind="binding-hex" {...p} />,
  "doom-clock": (p) => <MagicHitFx kind="doom-clock" {...p} />,
  "soul-rend": (p) => <MagicHitFx kind="soul-rend" {...p} />,
};
