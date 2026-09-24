import type { Vec2 } from "../types";
import { approachAngle, yawOf } from "./rect";
import { moveWithCollision, type RoomNav } from "./roomNav";

const WALK_SPEED = 3.1;
const ACCEL = 11;
const TURN_RATE = 12;
const ARRIVE = 0.1;

export interface PlayerState {
  pos: Vec2;
  vel: Vec2;
  yaw: number;
  /** 点击移动的剩余路径点。 */
  path: Vec2[];
  speed: number;
}

export function createPlayer(pos: Vec2, yaw: number): PlayerState {
  return { pos: { ...pos }, vel: { x: 0, z: 0 }, yaw, path: [], speed: 0 };
}

/**
 * 按键 → 世界方向。镜头从 +x+z 方向看向 -x-z:
 * 屏幕上方 = (-1,-1)/√2, 屏幕右方 = (1,-1)/√2。
 */
export function keysToWorld(right: number, up: number): Vec2 | null {
  if (!right && !up) return null;
  const x = right - up;
  const z = -right - up;
  const len = Math.hypot(x, z) || 1;
  return { x: x / len, z: z / len };
}

export function stepPlayer(player: PlayerState, nav: RoomNav, keyDir: Vec2 | null, dt: number): void {
  let want: Vec2 = { x: 0, z: 0 };
  if (keyDir) {
    player.path = [];
    want = { x: keyDir.x * WALK_SPEED, z: keyDir.z * WALK_SPEED };
  } else if (player.path.length) {
    let next = player.path[0];
    let dx = next.x - player.pos.x;
    let dz = next.z - player.pos.z;
    let dist = Math.hypot(dx, dz);
    while (dist < ARRIVE && player.path.length > 1) {
      player.path.shift();
      next = player.path[0];
      dx = next.x - player.pos.x;
      dz = next.z - player.pos.z;
      dist = Math.hypot(dx, dz);
    }
    if (dist < ARRIVE) {
      player.path = [];
    } else {
      // 最后一段减速停稳, 中途保持匀速。
      const last = player.path.length === 1;
      const speed = last ? Math.min(WALK_SPEED, dist * 5 + 0.6) : WALK_SPEED;
      want = { x: (dx / dist) * speed, z: (dz / dist) * speed };
    }
  }

  const k = Math.min(1, dt * ACCEL);
  player.vel.x += (want.x - player.vel.x) * k;
  player.vel.z += (want.z - player.vel.z) * k;
  const moved = moveWithCollision(nav, player.pos, player.vel.x * dt, player.vel.z * dt);
  const actual = { x: (moved.x - player.pos.x) / Math.max(dt, 1e-4), z: (moved.z - player.pos.z) / Math.max(dt, 1e-4) };
  player.pos = moved;
  // 撞墙时速度随实际位移收敛, 避免贴墙原地踏步。
  player.vel = { x: actual.x, z: actual.z };
  player.speed = Math.hypot(actual.x, actual.z);
  // 被卡住(点击路径走不动)时放弃剩余路径。
  if (!keyDir && player.path.length && player.speed < 0.05 && Math.hypot(want.x, want.z) > 1) player.path = [];

  const facing = keyDir ?? (Math.hypot(want.x, want.z) > 0.2 ? want : null);
  if (facing && (player.speed > 0.15 || keyDir)) player.yaw = approachAngle(player.yaw, yawOf(facing.x, facing.z), dt * TURN_RATE);
}
