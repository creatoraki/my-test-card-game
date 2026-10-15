// ============================================================================
// GLSL 全场级特效(魔法: 星幕 / 怨灵潮; 植物学家: 藤蔓缠绕): ScreenFxLayer 每次出牌只挂一份, 画布铺满战斗画布,
// 各目标的 HitFxLayer 只留空锚点(见 AnimPreset.stage), 只演受击抖动与飘字。
//   · 目标在敌人平面里由相机 rig 逐帧写变换, 这里每帧按 data-vfx-anchor 回查受击点,
//     折回设计坐标(左下原点)后直接写进 uniforms 对象 —— 宿主每帧读同一个对象, 无需重渲染;
//   · 所有目标共用同一个爆点(掉血/飘字同时结算); 全部落空的目标不吃爆点;
//   · 全场画布面积大, 像素比压到 1; 倍速由 ScreenFxLayer 行内下发(本层拿不到 --fx-rate)。
// ============================================================================

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { GlslSprite, glslAvailable } from "@/ui/common/fx/GlslSprite";
import { hexToRgb } from "@/ui/battle/fx/GlslHitFx";
import { MAGIC_PROGRAMS, type MagicFxProgram } from "./magicFxPrograms";
import { MAGIC_TIMELINE } from "./magicFxTimeline";
import s from "./MagicFx.module.css";

const PIXEL_RATIO = 1;
const MAX_TARGETS = 3;
const SLOTS = ["uT0", "uT1", "uT2"] as const;

export interface MagicStageTarget {
  id: string;
  missed: boolean;
}

type StageUniforms = Record<string, number | [number, number] | readonly number[]>;

/** 目标锚点元素缓存: 同一次播放内只查一次 DOM, 丢失(卸载)时再查。 */
function anchorLookup(root: ParentNode) {
  const cache = new Map<string, HTMLElement>();
  return (id: string): HTMLElement | null => {
    const hit = cache.get(id);
    if (hit?.isConnected) return hit;
    const found = root.querySelector<HTMLElement>(`[data-cmb-id="${CSS.escape(id)}"] [data-vfx-anchor]`);
    if (found) cache.set(id, found);
    return found;
  };
}

/** 全场级特效的程序与总长; ScreenFxLayer 按 CardAnim 查表挂载。 */
export interface StageFxDef {
  spec: MagicFxProgram;
  totalMs: number;
}

export const MAGIC_STAGE_FX = {
  "star-curtain": { spec: MAGIC_PROGRAMS["star-curtain"], totalMs: MAGIC_TIMELINE["star-curtain"].total },
  "spirit-tide": { spec: MAGIC_PROGRAMS["spirit-tide"], totalMs: MAGIC_TIMELINE["spirit-tide"].total },
} satisfies Record<string, StageFxDef>;

export function MagicStageFx({ def, color, impactMs, targets, fxRate }: {
  def: StageFxDef;
  color: string;
  impactMs: number;
  targets: MagicStageTarget[];
  fxRate: number;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [supported] = useState(glslAvailable);
  const [seed] = useState(Math.random);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  // 目标/倍速只在挂载时取一次: 一次播放内不变, 换一次出牌靠 key 重挂载。
  const [hitIds] = useState(() => targets.filter((t) => !t.missed).slice(0, MAX_TARGETS).map((t) => t.id));
  const [rate] = useState(() => Math.max(0.25, Number.isFinite(fxRate) && fxRate > 0 ? fxRate : 1));
  // 可变 uniforms: 引用保持不变, rAF 循环原地改写目标坐标。
  const [uniforms] = useState<StageUniforms>(() => ({
    uColor: hexToRgb(color),
    uImpact: impactMs / 1000,
    uTotal: def.totalMs / 1000,
    uT0: [0, 0],
    uT1: [0, 0],
    uT2: [0, 0],
    uCount: hitIds.length,
  }));

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (el) setSize({ w: el.clientWidth || 1920, h: el.clientHeight || 1080 });
  }, []);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el || !size) return;
    const lookup = anchorLookup(el.closest("[data-stage-canvas]") ?? document);
    let raf = 0;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      const kx = rect.width > 0 ? size.w / rect.width : 1;
      const ky = rect.height > 0 ? size.h / rect.height : 1;
      hitIds.forEach((id, i) => {
        const anchor = lookup(id);
        if (!anchor) return; // 量不到就沿用上一帧
        const box = anchor.getBoundingClientRect();
        uniforms[SLOTS[i]] = [(box.left - rect.left) * kx, size.h - (box.top - rect.top) * ky];
      });
      raf = requestAnimationFrame(measure);
    };
    measure();
    return () => cancelAnimationFrame(raf);
  }, [size, hitIds, uniforms]);

  if (!supported) return null;
  return (
    <div ref={wrapRef} className={s["magic-stage"]} aria-hidden>
      {size && (
        <GlslSprite
          program={def.spec.program}
          width={size.w}
          height={size.h}
          uniforms={uniforms}
          seed={seed}
          rate={rate}
          pixelRatio={PIXEL_RATIO}
        />
      )}
    </div>
  );
}
