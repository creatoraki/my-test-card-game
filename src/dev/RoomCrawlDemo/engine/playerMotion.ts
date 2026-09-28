import { SIDE_MARGIN, WALK_Z_MAX, WALK_Z_MIN } from "../data/layout";
import type { Blocker } from "../types";

/** 横向 / 纵深的走、跑速度(px/s)。纵深带被压扁显示, 速度也相应放慢。 */
const WALK_X = 330;
const WALK_Z = 210;
const RUN_X = 600;
const RUN_Z = 320;
/** 起步 / 停步的响应速度(越大越跟手)。 */
const ACCEL = 19;
const DECEL = 24;
/** 跳跃: 起跳前蓄力、初速度、重力。 */
const JUMP_CROUCH = 0.075;
const JUMP_V = 660;
const GRAVITY = 2050;
/** 落地后的硬直(压扁回弹的时间窗)。 */
const LAND_TIME = 0.14;
/** 被击退时的初速度与持续时间。 */
const KNOCK_TIME = 0.42;

export type JumpPhase = "ground" | "crouch" | "air" | "land";

export interface PlayerState {
  x: number;
  z: number;
  /** 离地高度(px)。 */
  h: number;
  vx: number;
  vz: number;
  vh: number;
  facing: 1 | -1;
  running: boolean;
  jump: JumpPhase;
  /** 当前跳跃阶段已持续的时间。 */
  phaseT: number;
  /** 击退剩余时间; > 0 时忽略输入。 */
  knock: number;
}

export interface MoveInput {
  right: number;
  down: number;
  run: boolean;
  jump: boolean;
}

export function createPlayer(x: number, z: number, facing: 1 | -1): PlayerState {
  return { x, z, h: 0, vx: 0, vz: 0, vh: 0, facing, running: false, jump: "ground", phaseT: 0, knock: 0 };
}

function approach(v: number, target: number, rate: number, dt: number): number {
  return target + (v - target) * Math.exp(-rate * dt);
}

/** 把点推出所有椭圆阻挡(归一化成单位圆后沿径向推出)。 */
function resolveBlockers(p: PlayerState, blockers: readonly Blocker[]): void {
  for (const b of blockers) {
    const dx = (p.x - b.x) / b.rx;
    const dz = (p.z - b.z) / b.rz;
    const d = Math.hypot(dx, dz);
    if (d >= 1 || d === 0) continue;
    p.x = b.x + (dx / d) * b.rx;
    p.z = b.z + (dz / d) * b.rz;
  }
}

/** 推进一帧。返回本帧是否发生了起跳 / 落地(给动画与音效用)。 */
export function stepPlayer(p: PlayerState, input: MoveInput, dt: number, width: number, blockers: readonly Blocker[]): { tookOff: boolean; landed: boolean } {
  let tookOff = false;
  let landed = false;
  p.phaseT += dt;

  if (p.knock > 0) {
    p.knock = Math.max(0, p.knock - dt);
    p.vx = approach(p.vx, 0, 5, dt);
    p.vz = approach(p.vz, 0, 5, dt);
  } else {
    const len = Math.hypot(input.right, input.down) || 1;
    const run = input.run && (input.right !== 0 || input.down !== 0);
    const tx = (input.right / len) * (run ? RUN_X : WALK_X);
    const tz = (input.down / len) * (run ? RUN_Z : WALK_Z);
    const airControl = p.jump === "air" ? 0.45 : 1;
    p.vx = approach(p.vx, tx, (tx === 0 ? DECEL : ACCEL) * airControl, dt);
    p.vz = approach(p.vz, tz, (tz === 0 ? DECEL : ACCEL) * airControl, dt);
    p.running = run;
    if (input.right !== 0 && p.jump !== "air") p.facing = input.right > 0 ? 1 : -1;
  }

  if (input.jump && p.knock <= 0 && (p.jump === "ground" || p.jump === "land")) {
    p.jump = "crouch";
    p.phaseT = 0;
  }
  if (p.jump === "crouch" && p.phaseT >= JUMP_CROUCH) {
    p.jump = "air";
    p.phaseT = 0;
    p.vh = JUMP_V;
    tookOff = true;
  }
  if (p.jump === "air") {
    p.vh -= GRAVITY * dt;
    p.h += p.vh * dt;
    if (p.h <= 0) {
      p.h = 0;
      p.vh = 0;
      p.jump = "land";
      p.phaseT = 0;
      landed = true;
    }
  }
  if (p.jump === "land" && p.phaseT >= LAND_TIME) {
    p.jump = "ground";
    p.phaseT = 0;
  }

  // 蓄力与落地硬直时脚下不动
  const planted = p.jump === "crouch" || p.jump === "land" ? 0.35 : 1;
  p.x += p.vx * dt * planted;
  p.z += p.vz * dt * planted;
  resolveBlockers(p, blockers);
  p.x = Math.min(width - SIDE_MARGIN, Math.max(SIDE_MARGIN, p.x));
  p.z = Math.min(WALK_Z_MAX, Math.max(WALK_Z_MIN, p.z));
  return { tookOff, landed };
}

/** 被守卫击退: 朝 dir 方向弹开并短暂失去控制。 */
export function knockBack(p: PlayerState, dir: number): void {
  p.vx = dir * 520;
  p.vz = 0;
  p.knock = KNOCK_TIME;
  p.facing = dir > 0 ? -1 : 1;
}

/** 当前水平速度占跑步速度的比例(0~1)。 */
export function speedRatio(p: PlayerState): number {
  return Math.min(1, Math.hypot(p.vx, p.vz * (WALK_X / WALK_Z)) / RUN_X);
}

export const MOTION = { WALK_X, RUN_X, WALK_Z, JUMP_V, GRAVITY };
