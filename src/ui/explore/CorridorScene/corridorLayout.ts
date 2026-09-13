import { CORRIDOR } from "@/explore/corridor/types";

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
  /** 无限近景 3315×948 缩放到 1080 高后的单块尺寸。 */
  nearTileWidth: 3777,
  nearTileHeight: 1080,
  /** 近景整体下移量，使素材里的平台顶面正好落在 CORRIDOR.floorY。 */
  nearTop: CORRIDOR.floorY - 670,
  /** 角色与交互物相对素材地面线的视觉下沉量。 */
  entityGroundOffset: 12,
  /** 近景平台带的下缘，黑色遮罩从这里开始挡住远景。 */
  abyssTop: 735,
} as const;
