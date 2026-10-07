import type { NearMapVariant } from "./types";

/** 近景素材的基准显示倍率；各地图再乘自己的 zoom。 */
const NEAR_MAP_BASE_SCALE = 1.7;

/** 近景图层相对原校准尺寸的放大倍率；地面线由 nearTop 按素材高度重新对齐，基线位置不变。 */
const NEAR_MAP_ZOOM = {
  neonCity1: 1.15,
  neonCity2: 1.15,
  neonCity3: 1.15,
  ecoArk1: 1.3,
  ecoArk2: 1.3,
  ecoArk3: 1.3,
  ecoArk4: 1.3,
} satisfies Record<NearMapVariant, number>;

/** 近景素材原始尺寸。 */
const NEAR_MAP_SOURCE_GEOMETRY = {
  neonCity1: { width: 2172, height: 724 },
  neonCity2: { width: 2172, height: 724 },
  neonCity3: { width: 2172, height: 724 },
  ecoArk1: { width: 2172, height: 724 },
  ecoArk2: { width: 2172, height: 724 },
  ecoArk3: { width: 2172, height: 724 },
  ecoArk4: { width: 2172, height: 724 },
} satisfies Record<NearMapVariant, { width: number; height: number }>;

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
