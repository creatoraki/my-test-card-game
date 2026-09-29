// ============================================================================
// 敌人死亡「余烬焚解」—— 死亡闸门 vanish 阶段挂载, 接管立绘画面直到 dead 卸载。
//
// 着色器直接采样立绘贴图(deathTexture), 所以任何敌人都通用: 先爆白定格, 再自下而上
// 沿噪声燃烧溶解, 灰烬带着立绘本色上飘, 脚下冲击环扩散。时序见 shaders/emberDissolve.glsl.ts。
// 挂在共享 WebGL 宿主(ui/common/fx/GlslSprite)上, 不单开上下文。
//   · 总长 = DEATH.vanish(与闸门同源), 倍速在挂载时读祖先的 --death-rate(与闸门定时器同一口径);
//   · 画布内框与 .combatant-figure 的立绘展示框重合: 水平居中, 底边对齐, 向下多伸 padBottom;
//   · 击杀镜头会推近, 像素比放宽到 2, 否则放大后发糊。
// 立绘本身由 CombatantView.module.css 在 [data-death-glsl] 下隐藏(交接留一小段重叠, 不闪空帧)。
// ============================================================================

import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { GlslSprite, GLSL_COMMON, type GlslProgramDef, type GlslUniforms } from "@/ui/common/fx/GlslSprite";
import { GLSL_HIT_COMMON } from "@/ui/battle/fx/GlslHitFx/glslHitCommon.glsl";
import { DEATH } from "@/ui/battle/choreo/deathChoreo";
import type { DeathGeometry } from "./deathGeometry";
import { GLSL_DEATH_EMBER } from "./shaders/emberDissolve.glsl";
import s from "./EnemyDeathFx.module.css";

const EMBER_PROGRAM: GlslProgramDef = {
  key: "death.ember",
  fragment: [GLSL_COMMON, GLSL_HIT_COMMON, GLSL_DEATH_EMBER].join("\n"),
};

const PIXEL_RATIO = 2;

export function EnemyDeathFx({ texture, geometry }: { texture: HTMLCanvasElement; geometry: DeathGeometry }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [seed] = useState(Math.random);
  const [rate, setRate] = useState(1);

  // 布局阶段读倍速: 早于宿主的第一帧推进, 与闸门的 vanish→dead 定时器同速。
  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const cssRate = parseFloat(getComputedStyle(el).getPropertyValue("--death-rate"));
    setRate(Math.max(0.25, Number.isFinite(cssRate) && cssRate > 0 ? cssRate : 1));
  }, []);

  const uniforms = useMemo<GlslUniforms>(() => ({
    uFig: geometry.fig,
    uBody: geometry.body,
    uTotal: DEATH.vanish / 1000,
  }), [geometry]);

  return (
    <div
      ref={wrapRef}
      className={s["enemy-death"]}
      style={{ "--death-pad-bottom": `${geometry.padBottom}px` } as CSSProperties}
      aria-hidden="true"
    >
      <GlslSprite
        program={EMBER_PROGRAM}
        width={geometry.width}
        height={geometry.height}
        uniforms={uniforms}
        seed={seed}
        rate={rate}
        texture={texture}
        pixelRatio={PIXEL_RATIO}
      />
    </div>
  );
}
