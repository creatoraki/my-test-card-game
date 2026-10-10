/** 新版方舟建筑路面的统一原图几何；正式探索与测试页共用。 */
export const ECO_ARK_NEAR_SOURCE = {
  referenceWidth: 3072,
  height: 1024,
  floorY: 954,
  bottomY: 974,
} as const;

/** 测试页确认的近景上下偏移，使用场景显示像素，正值向下。 */
export const ECO_ARK_NEAR_OFFSET_Y = 12;

/** 依次对应测试页的 4-3、6-1、6-2、6-3。 */
export const ECO_ARK_NEAR_SOURCE_GEOMETRY = {
  ecoArk1: { width: 3072, height: ECO_ARK_NEAR_SOURCE.height },
  ecoArk2: { width: 3032, height: ECO_ARK_NEAR_SOURCE.height },
  ecoArk3: { width: 3072, height: ECO_ARK_NEAR_SOURCE.height },
  ecoArk4: { width: 3072, height: ECO_ARK_NEAR_SOURCE.height },
} as const;
