// ============================================================================
// 狼雀 · 牙咬(wolf-fang) —— GLSL 程序化命中特效, 总长 1100ms。
//   局部压暗 → 一对琥珀狼瞳亮起、眨眼熄灭 → 上下两道月牙獠牙张成眼形加速合拢、尖齿交错 →
//   420ms 爆点闭成一线: 横向白核 + 镜头拖光 + 咬合星芒 + 冲击环 + 火花 →
//   斩线冷却成琥珀并按噪声烧蚀, 雀羽上下翻飞飘落。
// 挂在共享 WebGL 宿主(ui/common/fx/GlslSprite)上, 不单开上下文; 时间轴见 wolfFangTimeline.ts。
//   · 压暗与闪光都只画在目标周围, 不配全屏层(全屏层压在敌人平面之上, 会盖住特效本身);
//   · 震屏/顿帧归相机 SHOTS.wolf;
//   · 镜头会推近, 像素比放宽到 2, 否则细刃与羽轴放大后发糊;
//   · 倍速在挂载时读祖先 --fx-rate; 无 WebGL 时不渲染, 受击抖动/闪白/飘字照常。
// ============================================================================

import { useMemo, useRef, useState } from "react";
import type { ProcFxPreset } from "@/ui/battle/choreo/animations";
import { GlslSprite, GLSL_COMMON, glslAvailable, type GlslProgramDef, type GlslUniforms } from "@/ui/common/fx/GlslSprite";
import { GLSL_HIT_COMMON, hexToRgb, useFxRate } from "@/ui/battle/fx/GlslHitFx";
import { GLSL_WOLF_FANG_PARTS } from "./shaders/wolfFangParts.glsl";
import { GLSL_WOLF_FANG, GLSL_WOLF_FANG_DEFS } from "./shaders/wolfFang.glsl";
import { WOLF_TIMELINE } from "./wolfFangTimeline";
import s from "./WolfFangFx.module.css";

const WOLF_PROGRAM: GlslProgramDef = {
  key: "hit.wolf-fang",
  fragment: [GLSL_COMMON, GLSL_HIT_COMMON, GLSL_WOLF_FANG_DEFS, GLSL_WOLF_FANG_PARTS, GLSL_WOLF_FANG].join("\n"),
};

/** 画布设计尺寸: 300px 宽的獠牙、横向拖光与上下翻飞的雀羽都要装下, 命中点在画布中心。 */
const WIDTH = 600;
const HEIGHT = 440;
const PIXEL_RATIO = 2;

export function WolfFangFx({ preset, color }: { preset: ProcFxPreset; color: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [supported] = useState(glslAvailable);
  const [seed] = useState(Math.random);
  const rate = useFxRate(wrapRef);

  const uniforms = useMemo<GlslUniforms>(() => ({
    uColor: hexToRgb(color),
    uImpact: preset.impactMs / 1000,
    uTotal: WOLF_TIMELINE.total / 1000,
  }), [color, preset.impactMs]);

  if (!supported) return null;
  return (
    <div ref={wrapRef} className={s["wolf-fang"]}>
      <GlslSprite
        program={WOLF_PROGRAM}
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
