import { ARK_MAP, RUINS_MAP } from "../maps";
import type { MapDef, MapId, RoomDef } from "../types";

/** 可切换的全部地图(切换按钮按此顺序排列)。 */
export const MAPS: readonly MapDef[] = [RUINS_MAP, ARK_MAP];

export const DEFAULT_MAP_ID: MapId = RUINS_MAP.id;

const MAP_BY_ID = new Map(MAPS.map((map) => [map.id, map]));
/** 房间 id 在所有地图间唯一, 按 id 直接查房间。 */
const ROOM_BY_ID = new Map(MAPS.flatMap((map) => map.rooms.map((room) => [room.id, room] as const)));

export function getMap(id: MapId): MapDef {
  const map = MAP_BY_ID.get(id);
  if (!map) throw new Error(`未知地图: ${id}`);
  return map;
}

export function getRoom(id: string): RoomDef {
  const room = ROOM_BY_ID.get(id);
  if (!room) throw new Error(`未知房间: ${id}`);
  return room;
}
