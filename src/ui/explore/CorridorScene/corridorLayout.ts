import { CORRIDOR } from "@/explore/corridor/types";

const NEAR_FLOOR_Y = 674; // 素材平台顶面 y≈751 按 1080px 高缩放后的坐标

/**
 * 废弃楼层分层布局常量。
 * 近景与可交互物、角色同属世界层(1:1 跟随相机)，远景按 farParallax 慢速跟随制造纵深。
 * 平铺宽度取整是为了避免浏览器按小数宽平铺时出现缝隙。
 */
export const CORRIDOR_LAYOUT = {
  /** 远景相对相机的移动比例。 */
  farParallax: 0.35,
  /** 无限远景 3285×948 缩放到 1080 高后的单块尺寸。 */
  farTileWidth: 3742,
  farTileHeight: 1080,
  /** 两张 2048×1177 近景半图缩放到 1080 高后拼成一组，单张取整为 1879px。 */
  nearHalfTileWidth: 1879,
  nearTileWidth: 3758,
  nearTileHeight: 1080,
  /** 近景整体定位，使素材平台顶面与 CORRIDOR.floorY 重合。 */
  nearTop: CORRIDOR.floorY - NEAR_FLOOR_Y,
  /** 角色与交互物共用的地面下沉量；较原值再向下 6px，缩小脚底间隙。 */
  entityGroundOffset: 12,
  /** 近景平台带的下缘，黑色遮罩从这里开始挡住远景。 */
  abyssTop: 735,
} as const;
