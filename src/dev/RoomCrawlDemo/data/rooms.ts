import type { RoomDef } from "../types";
import { ARCADE_ROOM } from "./arcadeRoom";
import { CORE_ROOM } from "./coreRoom";
import { DOCK_ROOM } from "./dockRoom";
import { PUMP_ROOM } from "./pumpRoom";
import { SERVER_ROOM } from "./serverRoom";

/**
 * 楼层拓扑(小地图格位):
 *           [④ 数据机房]
 *                │
 * [① 货运入口]─[② 泵站管廊]─[③ 霓虹旧商场]
 *                               │
 *                         [⑤ 冷却核心]
 */
export const ROOMS: readonly RoomDef[] = [DOCK_ROOM, PUMP_ROOM, ARCADE_ROOM, SERVER_ROOM, CORE_ROOM];

export const START_ROOM_ID = DOCK_ROOM.id;

const BY_ID = new Map(ROOMS.map((room) => [room.id, room]));

export function getRoom(id: string): RoomDef {
  const room = BY_ID.get(id);
  if (!room) throw new Error(`未知房间: ${id}`);
  return room;
}

/** 小地图的格子尺寸(列 × 行)。 */
export const GRID_SIZE = {
  cols: Math.max(...ROOMS.map((r) => r.grid.col)) + 1,
  rows: Math.max(...ROOMS.map((r) => r.grid.row)) + 1,
};
