import type { NearMapVariant } from "./types";

const NEAR_MAP_ART_SCALE = 2;

/** 近景素材原始尺寸。 */
const NEAR_MAP_SOURCE_GEOMETRY = {
  standard: { width: 2048, height: 771 },
  alternate: { width: 2172, height: 724 },
  third: { width: 2048, height: 768 },
} satisfies Record<NearMapVariant, { width: number; height: number }>;

/** 近景素材按 2 倍显示；走廊宽度与图片显示宽度保持一致。 */
export const NEAR_MAP_GEOMETRY = {
  standard: {
    width: NEAR_MAP_SOURCE_GEOMETRY.standard.width * NEAR_MAP_ART_SCALE,
    height: NEAR_MAP_SOURCE_GEOMETRY.standard.height * NEAR_MAP_ART_SCALE,
  },
  alternate: {
    width: NEAR_MAP_SOURCE_GEOMETRY.alternate.width * NEAR_MAP_ART_SCALE,
    height: NEAR_MAP_SOURCE_GEOMETRY.alternate.height * NEAR_MAP_ART_SCALE,
  },
  third: {
    width: NEAR_MAP_SOURCE_GEOMETRY.third.width * NEAR_MAP_ART_SCALE,
    height: NEAR_MAP_SOURCE_GEOMETRY.third.height * NEAR_MAP_ART_SCALE,
  },
} satisfies Record<NearMapVariant, { width: number; height: number }>;
