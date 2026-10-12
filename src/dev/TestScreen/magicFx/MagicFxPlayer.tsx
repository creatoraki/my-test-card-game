import { useMemo, useState } from "react";
import { GlslSprite, glslAvailable, type GlslUniforms } from "@/ui/common/fx/GlslSprite";
import { hexToRgb } from "@/ui/battle/fx/GlslHitFx";
import type { MagicFxSpec } from "./magicFxSpecs";
import { SINGLE_FX, STAGE, type StagePoint } from "./magicFxLayout";
import { useLoadedImage } from "./useLoadedImage";
import s from "./MagicFxStage.module.css";

/** 单体特效的细线条多，像素比放宽到 2；全屏画布面积大，压到 1.25。 */
const SINGLE_RATIO = 2;
const STAGE_RATIO = 1.25;
/** 演示目标立绘 256×256，受击锚点即立绘中心：立绘框 [左, 下, 宽, 高] 相对锚点。 */
const DEMO_FIG = [-128, -128, 256, 256] as const;

/**
 * 播放一次魔法攻击特效：挂载即从 0 开始推进(uPhase)，由调用方换 key 重播。
 * 单体画布中心对齐 targets[0]；全屏画布铺满舞台，目标坐标换算成左下原点后传入着色器。
 * 需要立绘贴图的特效(spec.texture)等贴图加载完才挂载，保证从第 0 秒完整播放。
 */
export function MagicFxPlayer({ spec, rate, targets, portrait }: {
  spec: MagicFxSpec;
  rate: number;
  targets: readonly StagePoint[];
  /** 目标立绘地址(256×256，居中于目标)。 */
  portrait: string;
}) {
  const [supported] = useState(glslAvailable);
  const [seed] = useState(Math.random);
  const isStage = spec.mode === "stage";
  const image = useLoadedImage(spec.texture ? portrait : null);

  const uniforms = useMemo<GlslUniforms>(() => {
    const base = {
      uColor: hexToRgb(spec.color),
      uImpact: spec.impactMs / 1000,
      uTotal: spec.totalMs / 1000,
      uFig: DEMO_FIG,
    };
    if (!isStage) return base;
    const at = (i: number) => {
      const p = targets[Math.min(i, targets.length - 1)];
      return [p.x, STAGE.height - p.y] as const;
    };
    return { ...base, uT0: at(0), uT1: at(1), uT2: at(2), uCount: targets.length };
  }, [spec, isStage, targets]);

  if (!supported) return <p className={s.unsupported}>当前环境不支持 WebGL，无法演示着色器特效。</p>;
  if (spec.texture && !image) return null;
  const size = isStage ? STAGE : SINGLE_FX;
  const style = isStage ? { left: 0, top: 0 } : { left: targets[0].x - SINGLE_FX.width / 2, top: targets[0].y - SINGLE_FX.height / 2 };
  return (
    <div className={s.fx} style={style}>
      <GlslSprite
        program={spec.program}
        width={size.width}
        height={size.height}
        uniforms={uniforms}
        seed={seed}
        rate={rate}
        pixelRatio={isStage ? STAGE_RATIO : SINGLE_RATIO}
        texture={image}
      />
    </div>
  );
}
