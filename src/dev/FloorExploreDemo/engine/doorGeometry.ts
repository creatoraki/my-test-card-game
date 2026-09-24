import { STRUCTURE } from "../data";
import type { DoorDef, RoomDef, Vec2, WallSide } from "../types";
import type { Rect } from "./rect";
import { yawOf } from "./rect";

/** 门在房间里的几何: 墙线上的中心点、指向房内的法线、沿墙方向。 */
export interface DoorFrame {
  door: DoorDef;
  center: Vec2;
  inward: Vec2;
  along: Vec2;
  /** 门洞外那段可走通道(中心点可达区域, 已扣掉角色半径)。 */
  channel: Rect;
  /** 从这扇门进房时的出生点与朝向。 */
  spawn: Vec2;
  spawnYaw: number;
  /** 点击门时的寻路终点(门外一步, 会越过触发线)。 */
  exitPoint: Vec2;
}

const INWARD: Record<WallSide, Vec2> = {
  x0: { x: 1, z: 0 },
  x1: { x: -1, z: 0 },
  z0: { x: 0, z: 1 },
  z1: { x: 0, z: -1 },
};

export function isBackWall(side: WallSide): boolean {
  return side === "x0" || side === "z0";
}

export function wallCenter(room: RoomDef, side: WallSide, offset: number): Vec2 {
  if (side === "x0") return { x: 0, z: offset };
  if (side === "x1") return { x: room.width, z: offset };
  if (side === "z0") return { x: offset, z: 0 };
  return { x: offset, z: room.depth };
}

export function doorFrame(room: RoomDef, door: DoorDef, radius: number): DoorFrame {
  const center = wallCenter(room, door.side, door.offset);
  const inward = INWARD[door.side];
  const along = { x: Math.abs(inward.z), z: Math.abs(inward.x) };
  const half = door.width / 2 - radius;
  const outer = STRUCTURE.doorChannel;
  // 通道从房内 radius 处一直延伸到门外 doorChannel 处。
  const a = { x: center.x + inward.x * (radius + 0.05), z: center.z + inward.z * (radius + 0.05) };
  const b = { x: center.x - inward.x * outer, z: center.z - inward.z * outer };
  const channel: Rect = {
    x0: Math.min(a.x, b.x) - along.x * half,
    x1: Math.max(a.x, b.x) + along.x * half,
    z0: Math.min(a.z, b.z) - along.z * half,
    z1: Math.max(a.z, b.z) + along.z * half,
  };
  const spawn = { x: center.x + inward.x * 1.1, z: center.z + inward.z * 1.1 };
  const exitPoint = { x: center.x - inward.x * (STRUCTURE.doorTrigger + 0.35), z: center.z - inward.z * (STRUCTURE.doorTrigger + 0.35) };
  return { door, center, inward, along, channel, spawn, spawnYaw: yawOf(inward.x, inward.z), exitPoint };
}

/** 角色越过门的触发线(走出墙外一段距离)时返回那扇门。 */
export function crossedDoor(frames: DoorFrame[], pos: Vec2): DoorFrame | null {
  for (const frame of frames) {
    const outward = -((pos.x - frame.center.x) * frame.inward.x + (pos.z - frame.center.z) * frame.inward.z);
    const lateral = Math.abs((pos.x - frame.center.x) * frame.along.x + (pos.z - frame.center.z) * frame.along.z);
    if (outward > STRUCTURE.doorTrigger && lateral < frame.door.width / 2) return frame;
  }
  return null;
}
