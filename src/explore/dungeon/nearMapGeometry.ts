import type { NearMapVariant } from "./types";
import { ECO_ARK_NEAR_SOURCE, ECO_ARK_NEAR_SOURCE_GEOMETRY } from "./ecoArkNearGeometry";
import { NEON_CITY_NEAR_SOURCE, NEON_CITY_NEAR_SOURCE_GEOMETRY } from "./neonCityNearGeometry";

/** 近景素材的基准显示倍率；各地图再乘自己的 zoom。 */
const NEAR_MAP_BASE_SCALE = 1.7;

/** 沿用预览页校准比例，按各地图基准原图宽度换算显示倍率。 */
const ECO_ARK_NEAR_ZOOM = 1.15 * 2172 / ECO_ARK_NEAR_SOURCE.referenceWidth;
const NEON_CITY_NEAR_ZOOM = 1.15 * 2172 / NEON_CITY_NEAR_SOURCE.referenceWidth;

/** 近景图层相对原校准尺寸的放大倍率；地面线由 nearTop 按素材高度重新对齐，基线位置不变。 */
const NEAR_MAP_ZOOM = {
  neonCity1: NEON_CITY_NEAR_ZOOM,
  neonCity2: NEON_CITY_NEAR_ZOOM,
  neonCity3: NEON_CITY_NEAR_ZOOM,
  neonCity4: NEON_CITY_NEAR_ZOOM,
  ecoArk1: ECO_ARK_NEAR_ZOOM,
  ecoArk2: ECO_ARK_NEAR_ZOOM,
  ecoArk3: ECO_ARK_NEAR_ZOOM,
  ecoArk4: ECO_ARK_NEAR_ZOOM,
} satisfies Record<NearMapVariant, number>;

/** 近景素材原始尺寸。 */
const NEAR_MAP_SOURCE_GEOMETRY = {
  ...NEON_CITY_NEAR_SOURCE_GEOMETRY,
  ...ECO_ARK_NEAR_SOURCE_GEOMETRY,
} satisfies Record<NearMapVariant, { width: number; height: number }>;

/** 近景原图中的路面上下边界，用于统一计算落地线与深渊遮罩。 */
export function nearMapGroundSource(variant: NearMapVariant) {
  return variant in ECO_ARK_NEAR_SOURCE_GEOMETRY ? ECO_ARK_NEAR_SOURCE : NEON_CITY_NEAR_SOURCE;
}

/** 近景素材的实际显示倍率。 */
export function nearMapArtScale(variant: NearMapVariant): number {
  return NEAR_MAP_BASE_SCALE * NEAR_MAP_ZOOM[variant];
}

function scaledGeometry(variant: NearMapVariant) {
  const source = NEAR_MAP_SOURCE_GEOMETRY[variant];
  const scale = nearMapArtScale(variant);
  return { width: Math.round(source.width * scale), height: Math.round(source.height * scale) };
}

/** 近景素材按 nearMapArtScale 倍显示；走廊宽度与图片显示宽度保持一致。 */
export const NEAR_MAP_GEOMETRY = Object.fromEntries(
  (Object.keys(NEAR_MAP_SOURCE_GEOMETRY) as NearMapVariant[]).map((variant) => [variant, scaledGeometry(variant)]),
) as Record<NearMapVariant, { width: number; height: number }>;
