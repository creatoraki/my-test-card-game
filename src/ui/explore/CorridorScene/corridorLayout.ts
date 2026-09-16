import { CORRIDOR } from "@/explore/corridor/types";
import { NEAR_MAP_ART_SCALE, NEAR_MAP_GEOMETRY } from "@/explore/dungeon/nearMapGeometry";
import type { NearMapVariant } from "@/explore/dungeon/types";

/** 除远景外的世界层统一缩放；以地面线为锚点。 */
export const CORRIDOR_SCENE_SCALE = 1;

/** 世界层缩放后，1920 的可视区域等效多少世界 px。 */
export const CORRIDOR_VIEWPORT_WORLD_WIDTH = CORRIDOR.viewportWidth / CORRIDOR_SCENE_SCALE;

const NEAR_FLOOR_Y_AT_1080: Record<NearMapVariant, number> = {
  standard: 742, // 原 1080px 高布局的平台顶面位置
  alternate: 621, // 原 1080px 高布局的平台顶面位置
  third: 956, // 测试3平台顶面约在原图 y=680，按近景缩放比例换算
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
 * 近景与可交互物、角色同属世界层，统一由 CorridorScene 的 stage 以地面线为锚缩放；
 * 远景按 farParallax 慢速跟随制造纵深。所有布局数值仍使用未缩放世界 px。
 * 房间宽度与近景素材按 NEAR_MAP_ART_SCALE 倍显示宽度相同。
 */
export const CORRIDOR_LAYOUT = {
  /** 远景相对缩放后世界的移动比例；乘缩放值保持原有视差手感。 */
  farParallax: 0.35 * CORRIDOR_SCENE_SCALE,
  /** 无限远景 3285×948 缩放到 1080 高后的单块尺寸。 */
  farTileWidth: 3742,
  farTileHeight: 1080,
  /** 近景按 NEAR_MAP_ART_SCALE 倍显示高度。 */
  nearMapHeight: (variant: NearMapVariant) => NEAR_MAP_GEOMETRY[variant].height,
  /** 把旧的 1080px 高校准值换算到近景素材显示高度。 */
  nearMapFloorY,
  /** 仅调整近景图层位置，不影响角色与交互物。 */
  nearTop: (variant: NearMapVariant) => CORRIDOR.floorY - nearMapFloorY(variant) + NEAR_MAP_OFFSET_Y[variant],
  /** 角色与交互物共用的地面下沉量；较原值再向下 6px，缩小脚底间隙。 */
  entityGroundOffset: 12,
  /** 近景平台带的下缘，黑色遮罩从这里开始挡住远景。 */
  abyssTop: CORRIDOR.floorY + Math.round(55 * NEAR_MAP_ART_SCALE / 2 * CORRIDOR_SCENE_SCALE),
} as const;

/** 镜头让玩家居中, 并夹在房间两端, 永远不越出房间边界。 */
export function cameraX(playerX: number, width: number): number {
  return Math.max(0, Math.min(
    width - CORRIDOR_VIEWPORT_WORLD_WIDTH,
    playerX - CORRIDOR_VIEWPORT_WORLD_WIDTH / 2,
  ));
}
