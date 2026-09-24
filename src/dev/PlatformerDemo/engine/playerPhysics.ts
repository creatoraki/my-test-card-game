import type { InputState, PlayerState, Platform } from "../types";
import { FALL_LIMIT, PLATFORMS, PLAYER_START, WORLD_W } from "./level";

export const PLAYER_PHYSICS = {
  runSpeed: 520,
  groundAccel: 3800,
  airAccel: 2400,
  friction: 4600,
  gravity: 2600,
  /** 下落时重力加成，手感更利落。 */
  fallMultiplier: 1.3,
  jumpSpeed: 1150,
  /** 上升中松开跳跃键时保留的速度比例 → 可变跳跃高度。 */
  jumpCut: 0.45,
  maxFall: 1500,
  coyoteTime: 0.1,
  jumpBufferTime: 0.12,
  landTime: 0.14,
  takeoffTime: 0.1,
  /** 碰撞体半宽 / 身高（脚底为锚点）。 */
  halfWidth: 26,
  height: 150,
  /** 每移动 1px 推进的步态相位。 */
  stridePerPx: 0.028,
} as const;

const P = PLAYER_PHYSICS;
const EDGE_TOLERANCE = 8;

export function createPlayer(): PlayerState {
  return {
    x: PLAYER_START.x,
    y: PLAYER_START.y,
    vx: 0,
    vy: 0,
    facing: 1,
    grounded: true,
    coyote: 0,
    jumpBuffer: 0,
    jumpCut: false,
    runPhase: 0,
    landTimer: 0,
    takeoffTimer: 0,
    safe: { ...PLAYER_START },
  };
}

function approach(value: number, target: number, delta: number): number {
  return value < target ? Math.min(target, value + delta) : Math.max(target, value - delta);
}

function overPlatform(x: number, platform: Platform): boolean {
  return x >= platform.x - EDGE_TOLERANCE && x <= platform.x + platform.w + EDGE_TOLERANCE;
}

/** 推进一步，返回是否发生了坠落复位。 */
export function stepPlayer(p: PlayerState, input: InputState, dt: number): boolean {
  const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  if (dir !== 0) p.facing = dir as 1 | -1;

  const accel = dir === 0 ? P.friction : p.grounded ? P.groundAccel : P.airAccel;
  p.vx = approach(p.vx, dir * P.runSpeed, accel * dt);

  p.coyote = p.grounded ? P.coyoteTime : Math.max(0, p.coyote - dt);
  p.jumpBuffer = input.jumpPressed ? P.jumpBufferTime : Math.max(0, p.jumpBuffer - dt);
  if (p.jumpBuffer > 0 && p.coyote > 0) {
    p.vy = -P.jumpSpeed;
    p.grounded = false;
    p.coyote = 0;
    p.jumpBuffer = 0;
    p.jumpCut = false;
    p.takeoffTimer = P.takeoffTime;
  }
  if (!input.jumpHeld && p.vy < 0 && !p.jumpCut) {
    p.vy *= P.jumpCut;
    p.jumpCut = true;
  }

  p.vy = Math.min(P.maxFall, p.vy + P.gravity * (p.vy > 0 ? P.fallMultiplier : 1) * dt);
  p.x = Math.max(40, Math.min(WORLD_W - 40, p.x + p.vx * dt));
  const prevY = p.y;
  p.y += p.vy * dt;

  const wasGrounded = p.grounded;
  p.grounded = false;
  if (p.vy >= 0) {
    for (const platform of PLATFORMS) {
      if (!overPlatform(p.x, platform)) continue;
      if (prevY <= platform.y + 0.5 && p.y >= platform.y) {
        p.y = platform.y;
        p.vy = 0;
        p.grounded = true;
        const margin = Math.min(60, platform.w / 3);
        p.safe = { x: Math.max(platform.x + margin, Math.min(platform.x + platform.w - margin, p.x)), y: platform.y };
        break;
      }
    }
  }
  if (p.grounded && !wasGrounded) p.landTimer = P.landTime;

  p.landTimer = Math.max(0, p.landTimer - dt);
  p.takeoffTimer = Math.max(0, p.takeoffTimer - dt);
  if (p.grounded) p.runPhase += Math.abs(p.vx) * dt * P.stridePerPx;

  if (p.y > FALL_LIMIT) {
    p.x = p.safe.x;
    p.y = p.safe.y;
    p.vx = 0;
    p.vy = 0;
    p.grounded = true;
    p.landTimer = P.landTime;
    return true;
  }
  return false;
}
