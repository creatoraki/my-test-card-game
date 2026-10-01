// ============================================================================
// 雷走 · 迅雷斩(thunder-run) —— GLSL 程序化命中特效, 总长 780ms。
//   蓄电压暗 → 两记疾斩交成 X(刃光拖月牙残影、斩痕缠绕频闪电弧) →
//   200ms 爆点: 双斩痕充能爆亮 + 白核四芒星 + 锯齿电光环 + 火花 + 分叉放电 → 100ms 后雷鸣复闪 → 余电消散。
// 挂在共享 WebGL 宿主(ui/common/fx/GlslSprite)上, 不单开上下文; 时间轴见 thunderRunTimeline.ts。
//   · 震屏/顿帧归相机 SHOTS.thunder, 全屏压暗与闪白归 screenFx "thunder", 本组件只画目标周围;
//   · 镜头会推近, 像素比放宽到 2, 否则细刃光与电弧放大后发糊;
//   · 倍速在挂载时读祖先 --fx-rate; 无 WebGL 时不渲染, 受击抖动/闪白/飘字照常。
// ============================================================================

import { useMemo, useRef, useState } from "react";
import type { ProcFxPreset } from "@/ui/battle/choreo/animations";
import { GlslSprite, GLSL_COMMON, glslAvailable, type GlslProgramDef, type GlslUniforms } from "@/ui/common/fx/GlslSprite";
import { GLSL_HIT_COMMON, hexToRgb, useFxRate } from "@/ui/battle/fx/GlslHitFx";
import { GLSL_THUNDER_CUT } from "./shaders/thunderCut.glsl";
import { GLSL_THUNDER_RUN } from "./shaders/thunderRun.glsl";
import { THUNDER_TIMELINE } from "./thunderRunTimeline";
import s from "./ThunderRunFx.module.css";

const THUNDER_PROGRAM: GlslProgramDef = {
  key: "hit.thunder-run",
  fragment: [GLSL_COMMON, GLSL_HIT_COMMON, GLSL_THUNDER_CUT, GLSL_THUNDER_RUN].join("\n"),
};

/** 画布设计尺寸: 两道 460px 长的斩痕连同光晕都要装下, 命中点在画布中心。 */
const WIDTH = 560;
const HEIGHT = 420;
const PIXEL_RATIO = 2;

export function ThunderRunFx({ preset, color }: { preset: ProcFxPreset; color: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [supported] = useState(glslAvailable);
  const [seed] = useState(Math.random);
  const rate = useFxRate(wrapRef);

  const uniforms = useMemo<GlslUniforms>(() => ({
    uColor: hexToRgb(color),
    uImpact: preset.impactMs / 1000,
    uTotal: THUNDER_TIMELINE.total / 1000,
  }), [color, preset.impactMs]);

  if (!supported) return null;
  return (
    <div ref={wrapRef} className={s["thunder-run"]}>
      <GlslSprite
        program={THUNDER_PROGRAM}
        width={WIDTH}
        height={HEIGHT}
        uniforms={uniforms}
        seed={seed}
        rate={rate}
        pixelRatio={PIXEL_RATIO}
      />
    </div>
  );
}
