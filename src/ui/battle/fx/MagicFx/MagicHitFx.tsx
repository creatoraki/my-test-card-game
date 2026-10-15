// ============================================================================
// 魔法攻击 · 单体命中特效(预言家 / 咒术师): GLSL 程序化, 挂在共享 WebGL 宿主上。
//   · 画布 SINGLE_FX(720×600)中心对齐 .vfx 受击锚点, 着色器以爆点为零点(见 magicFxTimeline.ts);
//   · 爆点 = ANIM[*].proc.impactMs, 掉血/飘字/受击都锚在这一拍; 总长取各自时间轴的 total;
//   · 组件只认「程序 + 总长」, 植物学家(fx/BotanistFx)同样复用, 各自用 glslHitFxTable 生成组件表;
//   · 倍速在挂载时读祖先 --fx-rate; 镜头会推近, 像素比放宽到 1.5;
//   · 需要立绘的特效(魂魄抽离)读 portrait, 没有时着色器退回椭圆人形轮廓;
//   · 无 WebGL 时不渲染, 受击抖动/闪白/飘字照常。
// 全场级的两种(星幕 / 怨灵潮)不走这里, 见 MagicStageFx。
// ============================================================================

import { useMemo, useRef, useState } from "react";
import type { ProcFxPreset } from "@/ui/battle/choreo/animations";
import { GlslSprite, glslAvailable, type GlslUniforms } from "@/ui/common/fx/GlslSprite";
import { hexToRgb, useFxRate } from "@/ui/battle/fx/GlslHitFx";
import { MAGIC_PROGRAMS, SINGLE_FX, type MagicFxProgram } from "./magicFxPrograms";
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

export function MagicHitFx({ spec, totalMs, preset, color, portrait }: MagicHitFxProps & {
  spec: MagicFxProgram;
  totalMs: number;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [supported] = useState(glslAvailable);
  const [seed] = useState(Math.random);
  const rate = useFxRate(wrapRef);
  // 贴图与立绘框只在挂载时取一次: 一次播放内不变。
  const [art] = useState(() => (spec.texture ? portrait ?? null : null));

  const uniforms = useMemo<GlslUniforms>(() => ({
    uColor: hexToRgb(color),
    uImpact: preset.impactMs / 1000,
    uTotal: totalMs / 1000,
    uFig: art?.fig ?? NO_FIG,
  }), [color, preset.impactMs, totalMs, art]);

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

type HitFxComponent = (p: MagicHitFxProps) => JSX.Element | null;

/** 由程序表 + 时间轴生成与 CardAnim 同名的单体组件表, 供 HitFxLayer 的 PROC_FX 直接展开。 */
export function glslHitFxTable<K extends string>(
  kinds: readonly K[],
  programs: Record<K, MagicFxProgram>,
  timeline: Record<K, { total: number }>,
): Record<K, HitFxComponent> {
  const table = {} as Record<K, HitFxComponent>;
  for (const kind of kinds) {
    const spec = programs[kind];
    const totalMs = timeline[kind].total;
    table[kind] = (p) => <MagicHitFx spec={spec} totalMs={totalMs} {...p} />;
  }
  return table;
}

/** 魔法单体组件表; 全场级的星幕/怨灵潮见 MagicStageFx。 */
export const MAGIC_HIT_FX = glslHitFxTable<Exclude<MagicFxKind, "star-curtain" | "spirit-tide">>(
  ["star-shard", "twin-orbit", "meteor-fall", "astral-verdict", "gravity-lens",
    "curse-nail", "talisman-seal", "binding-hex", "doom-clock", "soul-rend"],
  MAGIC_PROGRAMS,
  MAGIC_TIMELINE,
);
