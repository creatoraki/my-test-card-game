import type { CorridorPropArt } from "./corridorArt";

/** 探索角色站立帧的可见身高（设计 px）：240px 画框内主体约 236px。 */
export const CORRIDOR_CHARACTER_HEIGHT = 236;

/** 交互物尺寸档位：主体可见高度相对角色身高的目标比例。 */
export const CORRIDOR_PROP_HEIGHT_RATIOS = {
  /** 小型 60%-80% 取中值。 */
  small: 0.7,
  /** 中型 120%-150% 取中值。 */
  medium: 1.35,
  /** 大型高于 150%。 */
  large: 1.7,
} as const;

export const CORRIDOR_PROP_BASE_SCALE = 0.5;

export type CorridorPropTier = keyof typeof CORRIDOR_PROP_HEIGHT_RATIOS;

/** 素材文件像素尺寸与主体（不透明区域）上下边界，均为原图像素。 */
export interface CorridorPropBounds {
  width: number;
  height: number;
  top: number;
  bottom: number;
}

/**
 * 按主体实际高度反推缩放：透明画布留白不同的素材也能与角色保持统一比例。
 * 底部留白同时写入 groundTrim，让主体底边贴住地面线。
 */
export function sizeCorridorProp(src: string, bounds: CorridorPropBounds, tier: CorridorPropTier): CorridorPropArt {
  const subjectHeight = bounds.bottom - bounds.top;
  const targetHeight = CORRIDOR_CHARACTER_HEIGHT * CORRIDOR_PROP_HEIGHT_RATIOS[tier];
  return {
    src,
    width: bounds.width,
    height: bounds.height,
    scale: targetHeight / (subjectHeight * CORRIDOR_PROP_BASE_SCALE),
    groundTrim: (bounds.height - bounds.bottom) / bounds.height,
  };
}
