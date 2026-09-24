import { DECOR_FOOTPRINT, PROP_FOOTPRINT } from "../data";
import type { RoomDef, Vec2 } from "../types";
import { doorFrame, type DoorFrame } from "./doorGeometry";
import { footprintRect, inRect, type Rect } from "./rect";

export const PLAYER_RADIUS = 0.3;

/** 房间的可走区域: 角色中心点只能落在 walk 里, 且不能落进(已按半径外扩的)障碍里。 */
export interface RoomNav {
  room: RoomDef;
  walk: Rect[];
  blocks: Rect[];
  doors: DoorFrame[];
}

export function buildRoomNav(room: RoomDef): RoomNav {
  const r = PLAYER_RADIUS;
  const doors = room.doors.map((door) => doorFrame(room, door, r));
  const walk: Rect[] = [
    { x0: r, z0: r, x1: room.width - r, z1: room.depth - r },
    ...doors.map((frame) => frame.channel),
  ];
  const blocks: Rect[] = [];
  for (const prop of room.props) {
    const [w, d] = PROP_FOOTPRINT[prop.kind];
    blocks.push(footprintRect(prop.x, prop.z, w, d, prop.rot, r));
  }
  for (const decor of room.decor) {
    const base = DECOR_FOOTPRINT[decor.kind];
    if (!base) continue;
    const [w, d] = decor.size ?? base;
    blocks.push(footprintRect(decor.x, decor.z, w, Math.max(d, 0.1), decor.rot ?? 0, r));
  }
  return { room, walk, blocks, doors };
}

export function isFree(nav: RoomNav, x: number, z: number): boolean {
  if (!nav.walk.some((rect) => inRect(rect, x, z))) return false;
  return !nav.blocks.some((rect) => inRect(rect, x, z));
}

/** 按轴拆分的滑动碰撞: 整步走不通就分别试 x / z 分量, 贴墙时能顺着墙滑。 */
export function moveWithCollision(nav: RoomNav, from: Vec2, dx: number, dz: number): Vec2 {
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dz) / 0.08));
  let x = from.x;
  let z = from.z;
  const sx = dx / steps;
  const sz = dz / steps;
  for (let i = 0; i < steps; i += 1) {
    if (isFree(nav, x + sx, z + sz)) {
      x += sx;
      z += sz;
    } else if (isFree(nav, x + sx, z)) {
      x += sx;
    } else if (isFree(nav, x, z + sz)) {
      z += sz;
    } else {
      break;
    }
  }
  return { x, z };
}

/** 两点之间是否一路畅通(用于路径拉直)。 */
export function lineFree(nav: RoomNav, a: Vec2, b: Vec2): boolean {
  const len = Math.hypot(b.x - a.x, b.z - a.z);
  const n = Math.max(1, Math.ceil(len / 0.1));
  for (let i = 1; i <= n; i += 1) {
    const t = i / n;
    if (!isFree(nav, a.x + (b.x - a.x) * t, a.z + (b.z - a.z) * t)) return false;
  }
  return true;
}
