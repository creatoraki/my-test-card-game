// 2.5D 舞台的几何常量(设计 px)。屏幕 y 自上而下; 世界 y 向上, 由 WALL_BASE_WY 换算。

export const DESIGN_W = 1920;
export const DESIGN_H = 1080;

/** 后墙墙根在屏幕上的 y(自上而下)。墙根以上是后墙与背景层。 */
export const FLOOR_BACK = 430;
/** 地面纵深带的屏幕高度: z = 0 在墙根, z = FLOOR_DEPTH 在前沿。 */
export const FLOOR_DEPTH = 300;
/** 墙根的世界 y(向上)。 */
export const WALL_BASE_WY = DESIGN_H - FLOOR_BACK;

/** 可行走的纵深范围: 离墙和前沿各留一点。 */
export const WALK_Z_MIN = 26;
export const WALK_Z_MAX = FLOOR_DEPTH - 22;
/** 左右可行走边界离房间边缘的距离(左右门就在这里)。 */
export const SIDE_MARGIN = 96;

/** 左右门的纵深中心与半高。 */
export const SIDE_DOOR_Z = 150;
export const SIDE_DOOR_HALF = 78;
/** 上 / 下门的门洞半宽。 */
export const END_DOOR_HALF = 92;

/** 纵深方向在距离判断里的放大系数: 纵深带被压扁显示, 同样的屏幕距离意味着更远。 */
export const DEPTH_WEIGHT = 1.7;

/** 某纵深、某离地高度处的世界 y。 */
export function worldY(z: number, h = 0): number {
  return WALL_BASE_WY - z + h;
}
