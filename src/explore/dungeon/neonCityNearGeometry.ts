/** 霓虹街区建筑路面的原图几何；正式探索与预览页共用。 */
export const NEON_CITY_NEAR_SOURCE = {
  referenceWidth: 3072,
  height: 1024,
  floorY: 954,
  bottomY: 974,
} as const;

/** 沿用预览页默认上下偏移，让路面与角色脚底对齐。 */
export const NEON_CITY_NEAR_OFFSET_Y = 12;

export const NEON_CITY_NEAR_SOURCE_GEOMETRY = {
  neonCity1: { width: 2958, height: NEON_CITY_NEAR_SOURCE.height },
  neonCity2: { width: 2861, height: NEON_CITY_NEAR_SOURCE.height },
  neonCity3: { width: 2973, height: NEON_CITY_NEAR_SOURCE.height },
  neonCity4: { width: 3033, height: NEON_CITY_NEAR_SOURCE.height },
  neonCity5: { width: 3009, height: NEON_CITY_NEAR_SOURCE.height },
} as const;
