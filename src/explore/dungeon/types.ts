// ============================================================================
// 房间图(地牢)类型 —— 一张地图 = 一张由若干房间组成的网格图, 没有「层」的概念。
// 房间总数(MapDef.roomCount)就是这张地图的庞大程度。
//
// · 每个房间最多连通上下左右 4 个房间, 即最多 4 个传送门(网格邻接天然保证上限)。
// · exits 只记录生成时**真正打通**的边, 相邻但未打通的房间之间没有传送门。
// · 房间内的横向场景(物件位置、玩家坐标、黑影)仍由 corridor/ 负责, 本模块只管图。
// ============================================================================

import type { CurioKind } from "../corridor/types";
import type { MerchantShelf } from "../../data/curios/types";

export type PortalDir = "up" | "down" | "left" | "right";
export type RoomKind = "start" | "normal" | "battle" | "boss";
export type NearMapVariant = "standard" | "alternate" | "third";

export const PORTAL_DIRS: readonly PortalDir[] = ["up", "down", "left", "right"];

/** 方向 → 网格偏移。gy 向下为正, 与小地图的绘制方向一致。 */
export const DIR_STEP: Record<PortalDir, { dx: number; dy: number }> = {
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 },
};

export const OPPOSITE_DIR: Record<PortalDir, PortalDir> = {
  up: "down",
  down: "up",
  left: "right",
  right: "left",
};

/** 房间里的一件可交互物; x 取自按该房间近景宽度换算的中段槽位, 与传送门共用槽位故不会重叠。 */
export interface RoomCurio {
  id: string;
  kind: CurioKind;
  x: number;
  used: boolean;
  shelf?: MerchantShelf;
}

export interface RoomNode {
  id: string;
  gx: number;
  gy: number;
  kind: RoomKind;
  /** 房间近景地图变体；生成后固定，重返房间时保持一致。 */
  nearMapVariant: NearMapVariant;
  /** 距起始房间的最短步数; 战斗档位与事件门槛都读它, 越深越难。 */
  depth: number;
  /** 小地图上的房间序号, 从 1 起, 按生成顺序分配。 */
  label: number;
  curios: RoomCurio[];
  /** 方向 → 目标房间 id; 只有这里登记的方向才会在场景里生成传送门。 */
  exits: Partial<Record<PortalDir, string>>;
  /** 传送门在房间地面上的横坐标, 与 exits 同键。 */
  portalX: Partial<Record<PortalDir, number>>;
  visited: boolean;
  /** 战斗房 / BOSS 房的黑影是否已被击败。 */
  threatDefeated: boolean;
  /** 曾被传送门点亮过 —— 小地图从「问号占位」变成「亮格待探索」。 */
  revealed: boolean;
}

export interface DungeonState {
  rooms: Record<string, RoomNode>;
  /** 生成顺序, 小地图遍历与序号都读它。 */
  order: string[];
  startRoomId: string;
  bossRoomId: string;
  currentRoomId: string;
  /** 神谕揭示后，所有房间的位置都已知。 */
  layoutKnown: boolean;
  /** 神谕揭示后，未访问房间的战斗与 BOSS 标记也可见。 */
  threatsKnown: boolean;
  /** 网格包围盒, 小地图按它换算画布尺寸。 */
  bounds: { minX: number; maxX: number; minY: number; maxY: number };
}

export const roomIdAt = (gx: number, gy: number): string => `room-${gx}-${gy}`;
