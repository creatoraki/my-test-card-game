import { CORRIDOR } from "@/explore/corridor/types";

const NEAR_FLOOR_Y = 884; // 新近景素材的平台顶面在 1080px 高画布中的约略位置

/**
 * 废弃楼层分层布局常量。
 * 近景与可交互物、角色同属世界层(1:1 跟随相机)，远景按 farParallax 慢速跟随制造纵深。
 * 新近景由两张全屏图左右拼成一张房间地图；每张图的纵向偏移可独立微调。
 */
export const CORRIDOR_LAYOUT = {
  /** 远景相对相机的移动比例。 */
  farParallax: 0.35,
  /** 无限远景 3285×948 缩放到 1080 高后的单块尺寸。 */
  farTileWidth: 3742,
  farTileHeight: 1080,
  /** 每间房完整使用两张近景图，左右各占房间的一半。 */
  /** 单张近景的独立纵向微调（设计 px，正值向下）。 */
  nearSegmentYOffsets: { one: 7, two: 0 },
  nearMapHeight: 1080,
  /** 近景整体定位，使新素材的平台顶面与 CORRIDOR.floorY 重合。 */
  nearTop: CORRIDOR.floorY - NEAR_FLOOR_Y,
  /** 角色与交互物共用的地面下沉量；较原值再向下 6px，缩小脚底间隙。 */
  entityGroundOffset: 12,
  /** 近景平台带的下缘，黑色遮罩从这里开始挡住远景。 */
  abyssTop: 735,
} as const;

/** 镜头让玩家居中, 并夹在房间两端, 永远不越出房间边界。 */
export function cameraX(playerX: number, width: number): number {
  return Math.max(0, Math.min(width - CORRIDOR.viewportWidth, playerX - CORRIDOR.viewportWidth / 2));
}
