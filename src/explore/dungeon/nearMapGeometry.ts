import type { NearMapVariant } from "./types";

/** 近景图层相对原校准尺寸的放大倍率；地面线由 nearTop 按素材高度重新对齐，基线位置不变。 */
export const NEAR_MAP_ZOOM = 1.3;

export const NEAR_MAP_ART_SCALE = 1.7 * NEAR_MAP_ZOOM;

/** 近景素材原始尺寸。 */
const NEAR_MAP_SOURCE_GEOMETRY = {
  standard: { width: 2048, height: 771 },
  alternate: { width: 2172, height: 724 },
  third: { width: 2048, height: 768 },
  ecoArk: { width: 2171, height: 724 },
} satisfies Record<NearMapVariant, { width: number; height: number }>;

/** 近景素材按 NEAR_MAP_ART_SCALE 倍显示；走廊宽度与图片显示宽度保持一致。 */
export const NEAR_MAP_GEOMETRY = {
  ecoArk: {
    width: Math.round(NEAR_MAP_SOURCE_GEOMETRY.ecoArk.width * NEAR_MAP_ART_SCALE),
    height: Math.round(NEAR_MAP_SOURCE_GEOMETRY.ecoArk.height * NEAR_MAP_ART_SCALE),
  },
  standard: {
    width: Math.round(NEAR_MAP_SOURCE_GEOMETRY.standard.width * NEAR_MAP_ART_SCALE),
    height: Math.round(NEAR_MAP_SOURCE_GEOMETRY.standard.height * NEAR_MAP_ART_SCALE),
  },
  alternate: {
    width: Math.round(NEAR_MAP_SOURCE_GEOMETRY.alternate.width * NEAR_MAP_ART_SCALE),
    height: Math.round(NEAR_MAP_SOURCE_GEOMETRY.alternate.height * NEAR_MAP_ART_SCALE),
  },
  third: {
    width: Math.round(NEAR_MAP_SOURCE_GEOMETRY.third.width * NEAR_MAP_ART_SCALE),
    height: Math.round(NEAR_MAP_SOURCE_GEOMETRY.third.height * NEAR_MAP_ART_SCALE),
  },
} satisfies Record<NearMapVariant, { width: number; height: number }>;
