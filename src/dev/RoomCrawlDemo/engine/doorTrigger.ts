import { END_DOOR_HALF, SIDE_DOOR_HALF, SIDE_DOOR_Z, SIDE_MARGIN, WALK_Z_MAX, WALK_Z_MIN } from "../data/layout";
import type { DoorDef, DoorSide, RoomDef } from "../types";

const OPPOSITE: Record<DoorSide, DoorSide> = { left: "right", right: "left", up: "down", down: "up" };

export function oppositeSide(side: DoorSide): DoorSide {
  return OPPOSITE[side];
}

/** 门在地面上的中心点(x, z)。 */
export function doorAnchor(room: RoomDef, door: DoorDef): { x: number; z: number } {
  switch (door.side) {
    case "left":
      return { x: SIDE_MARGIN, z: SIDE_DOOR_Z };
    case "right":
      return { x: room.width - SIDE_MARGIN, z: SIDE_DOOR_Z };
    case "up":
      return { x: door.x ?? room.width / 2, z: WALK_Z_MIN };
    case "down":
      return { x: door.x ?? room.width / 2, z: WALK_Z_MAX };
  }
}

/**
 * 玩家贴着门所在的边界、且还在朝门的方向推时才触发(DNF 式过门)。
 * 返回被触发的门; 没有则为 null。
 */
export function findDoorHit(room: RoomDef, x: number, z: number, right: number, down: number): DoorDef | null {
  for (const door of room.doors) {
    switch (door.side) {
      case "left":
        if (right < 0 && x <= SIDE_MARGIN + 2 && Math.abs(z - SIDE_DOOR_Z) < SIDE_DOOR_HALF) return door;
        break;
      case "right":
        if (right > 0 && x >= room.width - SIDE_MARGIN - 2 && Math.abs(z - SIDE_DOOR_Z) < SIDE_DOOR_HALF) return door;
        break;
      case "up":
        if (down < 0 && z <= WALK_Z_MIN + 2 && Math.abs(x - (door.x ?? 0)) < END_DOOR_HALF * 0.8) return door;
        break;
      case "down":
        if (down > 0 && z >= WALK_Z_MAX - 2 && Math.abs(x - (door.x ?? 0)) < END_DOOR_HALF * 0.8) return door;
        break;
    }
  }
  return null;
}

/** 玩家是否正站在某扇门前(用于锁门提示)。 */
export function nearDoor(room: RoomDef, x: number, z: number): DoorDef | null {
  for (const door of room.doors) {
    const a = doorAnchor(room, door);
    if (Math.abs(a.x - x) < 90 && Math.abs(a.z - z) < 70) return door;
  }
  return null;
}

/** 从 fromSide 那扇门进入新房间时的落脚点与朝向。 */
export function arrivalPoint(room: RoomDef, fromSide: DoorSide | null): { x: number; z: number; facing: 1 | -1 } {
  if (!fromSide) return { ...room.spawn, facing: 1 };
  const entry = room.doors.find((d) => d.side === OPPOSITE[fromSide]);
  if (!entry) return { ...room.spawn, facing: 1 };
  const a = doorAnchor(room, entry);
  switch (entry.side) {
    case "left":
      return { x: a.x + 70, z: a.z, facing: 1 };
    case "right":
      return { x: a.x - 70, z: a.z, facing: -1 };
    case "up":
      return { x: a.x, z: a.z + 46, facing: 1 };
    case "down":
      return { x: a.x, z: a.z - 46, facing: 1 };
  }
}
