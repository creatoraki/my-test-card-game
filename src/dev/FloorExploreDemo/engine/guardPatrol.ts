import type { GuardDef, Vec2 } from "../types";
import { approachAngle, yawOf } from "./rect";

/** 守卫只做表现: 沿路径点慢走、停顿、转头张望; 单点路径即原地静立。 */
export interface GuardState {
  def: GuardDef;
  pos: Vec2;
  yaw: number;
  index: number;
  wait: number;
  moving: boolean;
  /** 停顿时张望用的头部偏转。 */
  look: number;
  time: number;
}

export function createGuard(def: GuardDef): GuardState {
  const first = def.path[0];
  const second = def.path[1];
  const yaw = def.facing ?? (second ? yawOf(second.x - first.x, second.z - first.z) : 0);
  return { def, pos: { ...first }, yaw, index: def.path.length > 1 ? 1 : 0, wait: 0, moving: false, look: 0, time: Math.random() * 10 };
}

export function stepGuard(guard: GuardState, dt: number): void {
  guard.time += dt;
  const { path } = guard.def;
  if (path.length < 2) {
    guard.moving = false;
    guard.look = Math.sin(guard.time * 0.35) * 0.35 + Math.sin(guard.time * 1.3) * 0.05;
    return;
  }
  if (guard.wait > 0) {
    guard.wait -= dt;
    guard.moving = false;
    guard.look = Math.sin(guard.time * 1.1) * 0.6;
    return;
  }
  guard.look *= Math.max(0, 1 - dt * 3);
  const target = path[guard.index];
  const dx = target.x - guard.pos.x;
  const dz = target.z - guard.pos.z;
  const dist = Math.hypot(dx, dz);
  const speed = guard.def.speed ?? 0.8;
  if (dist < 0.05) {
    guard.index = (guard.index + 1) % path.length;
    guard.wait = guard.def.pause ?? 1.2;
    return;
  }
  const desiredYaw = yawOf(dx, dz);
  guard.yaw = approachAngle(guard.yaw, desiredYaw, dt * 3);
  // 先转过身再迈步, 显得迟缓而有分量。
  const facingError = Math.abs(Math.atan2(Math.sin(desiredYaw - guard.yaw), Math.cos(desiredYaw - guard.yaw)));
  const step = Math.min(dist, speed * dt * Math.max(0, 1 - facingError * 1.5));
  guard.pos = { x: guard.pos.x + (dx / dist) * step, z: guard.pos.z + (dz / dist) * step };
  guard.moving = step > 1e-4;
}
