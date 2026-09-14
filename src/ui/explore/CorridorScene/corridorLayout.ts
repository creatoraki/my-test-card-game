import { CORRIDOR } from "@/explore/corridor/types";
import type { NearMapVariant } from "@/explore/dungeon/types";

const NEAR_FLOOR_Y = 742; // 测试近景素材的平台顶面缩放到 1080px 高后的约略位置
const NEAR_MAP_FLOOR_Y: Record<NearMapVariant, number> = {
  standard: NEAR_FLOOR_Y,
  alternate: 621, // 测试2.png的平台顶面缩放到 1080px 高后的约略位置
};
const NEAR_MAP_OFFSET_Y: Record<NearMapVariant, number> = {
  standard: 0,
  alternate: -16,
};

/**
 * 废弃楼层分层布局常量。
 * 近景与可交互物、角色同属世界层(1:1 跟随相机)，远景按 farParallax 慢速跟随制造纵深。
 * 新近景由单张全景图铺满一张房间地图。
 */
export const CORRIDOR_LAYOUT = {
  /** 远景相对相机的移动比例。 */
  farParallax: 0.35,
  /** 无限远景 3285×948 缩放到 1080 高后的单块尺寸。 */
  farTileWidth: 3742,
  farTileHeight: 1080,
  /** 单张近景覆盖每间房的完整地图宽度。 */
  nearMapHeight: 1080,
  /** 两种近景的平台顶面位置与对应场景偏移。 */
  nearMapFloorY: NEAR_MAP_FLOOR_Y,
  /** 仅调整近景图层位置，不影响角色与交互物。 */
  nearTop: (variant: NearMapVariant) => CORRIDOR.floorY - NEAR_MAP_FLOOR_Y[variant] + NEAR_MAP_OFFSET_Y[variant],
  /** 角色与交互物共用的地面下沉量；较原值再向下 6px，缩小脚底间隙。 */
  entityGroundOffset: 12,
  /** 近景平台带的下缘，黑色遮罩从这里开始挡住远景。 */
  abyssTop: 735,
} as const;

/** 镜头让玩家居中, 并夹在房间两端, 永远不越出房间边界。 */
export function cameraX(playerX: number, width: number): number {
  return Math.max(0, Math.min(width - CORRIDOR.viewportWidth, playerX - CORRIDOR.viewportWidth / 2));
}
