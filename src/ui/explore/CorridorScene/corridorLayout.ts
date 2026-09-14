import { CORRIDOR } from "@/explore/corridor/types";
import { NEAR_MAP_GEOMETRY } from "@/explore/dungeon/nearMapGeometry";
import type { NearMapVariant } from "@/explore/dungeon/types";

const NEAR_FLOOR_Y_AT_1080: Record<NearMapVariant, number> = {
  standard: 742, // 原 1080px 高布局的平台顶面位置
  alternate: 621, // 原 1080px 高布局的平台顶面位置
  third: 956, // 测试3平台顶面约在原图 y=680，按 2 倍显示高度换算
};
const NEAR_MAP_OFFSET_Y: Record<NearMapVariant, number> = {
  standard: 0,
  alternate: -16,
  third: 0,
};

function nearMapFloorY(variant: NearMapVariant): number {
  return Math.round(NEAR_FLOOR_Y_AT_1080[variant] * NEAR_MAP_GEOMETRY[variant].height / 1080);
}

/**
 * 废弃楼层分层布局常量。
 * 近景与可交互物、角色同属世界层(1:1 跟随相机)，远景按 farParallax 慢速跟随制造纵深。
 * 房间宽度与近景素材 2 倍显示宽度相同。
 */
export const CORRIDOR_LAYOUT = {
  /** 远景相对相机的移动比例。 */
  farParallax: 0.35,
  /** 无限远景 3285×948 缩放到 1080 高后的单块尺寸。 */
  farTileWidth: 3742,
  farTileHeight: 1080,
  /** 近景 2 倍显示高度。 */
  nearMapHeight: (variant: NearMapVariant) => NEAR_MAP_GEOMETRY[variant].height,
  /** 把旧的 1080px 高校准值换算到近景素材显示高度。 */
  nearMapFloorY,
  /** 仅调整近景图层位置，不影响角色与交互物。 */
  nearTop: (variant: NearMapVariant) => CORRIDOR.floorY - nearMapFloorY(variant) + NEAR_MAP_OFFSET_Y[variant],
  /** 角色与交互物共用的地面下沉量；较原值再向下 6px，缩小脚底间隙。 */
  entityGroundOffset: 12,
  /** 近景平台带的下缘，黑色遮罩从这里开始挡住远景。 */
  abyssTop: 735,
} as const;

/** 镜头让玩家居中, 并夹在房间两端, 永远不越出房间边界。 */
export function cameraX(playerX: number, width: number): number {
  return Math.max(0, Math.min(width - CORRIDOR.viewportWidth, playerX - CORRIDOR.viewportWidth / 2));
}
