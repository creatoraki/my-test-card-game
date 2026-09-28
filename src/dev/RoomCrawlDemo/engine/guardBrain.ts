import { DEPTH_WEIGHT } from "../data/layout";
import type { FloorPoint, GuardDef } from "../types";
import { damp } from "./springBone";

/** 视野: 距离(px, 纵深按权重放大后计)与半张角。 */
export const VIEW_RANGE = 470;
export const VIEW_HALF = 0.56;
const CHASE_RANGE = 700;
const PATROL_SPEED = 88;
const CHASE_SPEED = 262;
const RETURN_SPEED = 130;
const ALERT_TIME = 0.62;
const LOSE_TIME = 2.1;
const SEARCH_TIME = 1.5;
const WAIT_TIME = 1.1;
const CONTACT_DIST = 62;
/** 玩家跳得够高就能从守卫头顶越过。 */
const CONTACT_H = 64;

export type GuardMode = "patrol" | "alert" | "chase" | "search" | "return" | "lunge" | "banished";

export interface GuardState {
  id: string;
  x: number;
  z: number;
  /** 视线方向(弧度, 在纵深加权空间中, 0 = 向右, 正值 = 向前沿)。 */
  look: number;
  facing: 1 | -1;
  mode: GuardMode;
  timer: number;
  patrol: readonly FloorPoint[];
  patrolIdx: number;
  patrolStep: 1 | -1;
  /** 本帧移动速度(px/s), 用于动画摆动幅度。 */
  speed: number;
  /** 视野被禁用的剩余时间(击退玩家后的喘息期)。 */
  cooldown: number;
  /** 被驱散后的溶解进度 0~1。 */
  dissolve: number;
}

export function createGuard(def: GuardDef): GuardState {
  const start = def.patrol[0];
  return {
    id: def.id, x: start.x, z: start.z, look: 0, facing: 1, mode: "patrol", timer: 0,
    patrol: def.patrol, patrolIdx: 1, patrolStep: 1, speed: 0, cooldown: 0, dissolve: 0,
  };
}

/** 把守卫放回巡逻起点(玩家后撤时)。 */
export function resetGuard(g: GuardState, cooldown: number): void {
  const start = g.patrol[0];
  g.x = start.x;
  g.z = start.z;
  g.mode = "patrol";
  g.patrolIdx = 1;
  g.patrolStep = 1;
  g.timer = 0;
  g.cooldown = cooldown;
}

function weightedDelta(ax: number, az: number, bx: number, bz: number): { dx: number; dz: number; dist: number } {
  const dx = bx - ax;
  const dz = (bz - az) * DEPTH_WEIGHT;
  return { dx, dz, dist: Math.hypot(dx, dz) };
}

function angleDiff(a: number, b: number): number {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

/** 朝目标走一步; 返回是否已到达。 */
function moveToward(g: GuardState, tx: number, tz: number, speed: number, dt: number): boolean {
  const { dx, dz, dist } = weightedDelta(g.x, g.z, tx, tz);
  if (dist < 4) {
    g.speed = 0;
    return true;
  }
  const step = Math.min(dist, speed * dt);
  g.x += (dx / dist) * step;
  g.z += (dz / dist) * step / DEPTH_WEIGHT;
  g.speed = step / Math.max(dt, 1e-4);
  const want = Math.atan2(dz, dx);
  g.look += angleDiff(g.look, want) * (1 - Math.exp(-7 * dt));
  if (Math.abs(dx) > 2) g.facing = dx > 0 ? 1 : -1;
  return false;
}

export function canSee(g: GuardState, px: number, pz: number): boolean {
  if (g.cooldown > 0) return false;
  const { dx, dz, dist } = weightedDelta(g.x, g.z, px, pz);
  if (dist > VIEW_RANGE) return false;
  if (dist < 70) return true;
  return Math.abs(angleDiff(g.look, Math.atan2(dz, dx))) < VIEW_HALF;
}

export interface GuardTarget {
  x: number;
  z: number;
  h: number;
}

/** 推进一帧。返回 "contact" 表示本帧扑中了玩家。 */
export function stepGuard(g: GuardState, dt: number, player: GuardTarget): "contact" | null {
  g.timer += dt;
  g.cooldown = Math.max(0, g.cooldown - dt);
  if (g.mode === "banished") {
    g.dissolve = Math.min(1, g.dissolve + dt / 1.1);
    g.speed = 0;
    return null;
  }
  if (g.mode === "lunge") {
    g.speed = damp(g.speed, 0, 6, dt);
    return null;
  }

  const toPlayer = weightedDelta(g.x, g.z, player.x, player.z);
  if (toPlayer.dist < CONTACT_DIST && player.h < CONTACT_H && g.cooldown <= 0 && g.mode !== "return") {
    g.mode = "lunge";
    g.timer = 0;
    g.facing = toPlayer.dx >= 0 ? 1 : -1;
    return "contact";
  }

  const sees = canSee(g, player.x, player.z);
  switch (g.mode) {
    case "patrol": {
      if (sees) {
        g.mode = "alert";
        g.timer = 0;
        break;
      }
      const target = g.patrol[g.patrolIdx];
      if (moveToward(g, target.x, target.z, PATROL_SPEED, dt)) {
        // 到点后原地张望一会儿再折返
        if (g.timer > WAIT_TIME) {
          if (g.patrolIdx + g.patrolStep >= g.patrol.length || g.patrolIdx + g.patrolStep < 0) g.patrolStep = g.patrolStep === 1 ? -1 : 1;
          g.patrolIdx += g.patrolStep;
          g.timer = 0;
        } else {
          g.look += Math.sin(g.timer * 3) * dt * 0.8;
        }
      } else {
        g.timer = 0;
      }
      break;
    }
    case "alert": {
      g.speed = 0;
      g.look += angleDiff(g.look, Math.atan2(toPlayer.dz, toPlayer.dx)) * (1 - Math.exp(-10 * dt));
      if (toPlayer.dx !== 0) g.facing = toPlayer.dx > 0 ? 1 : -1;
      if (g.timer >= ALERT_TIME) {
        g.mode = "chase";
        g.timer = 0;
      }
      break;
    }
    case "chase": {
      moveToward(g, player.x, player.z, CHASE_SPEED, dt);
      const inRange = toPlayer.dist < CHASE_RANGE && g.cooldown <= 0;
      if (inRange) g.timer = 0;
      else if (g.timer > LOSE_TIME) {
        g.mode = "search";
        g.timer = 0;
      }
      break;
    }
    case "search": {
      g.speed = 0;
      g.look += Math.sin(g.timer * 4.2) * dt * 2.2;
      if (sees) {
        g.mode = "alert";
        g.timer = 0;
      } else if (g.timer > SEARCH_TIME) {
        g.mode = "return";
        g.timer = 0;
      }
      break;
    }
    case "return": {
      const home = nearestPatrolPoint(g);
      if (moveToward(g, g.patrol[home].x, g.patrol[home].z, RETURN_SPEED, dt)) {
        g.patrolIdx = home;
        g.mode = "patrol";
        g.timer = WAIT_TIME;
      } else if (sees && g.timer > 0.8) {
        g.mode = "alert";
        g.timer = 0;
      }
      break;
    }
  }
  return null;
}

function nearestPatrolPoint(g: GuardState): number {
  let best = 0;
  let bestD = Infinity;
  g.patrol.forEach((p, i) => {
    const d = weightedDelta(g.x, g.z, p.x, p.z).dist;
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  });
  return best;
}

/** 警觉程度 0~1: 头顶符号与视野锥变色用。 */
export function guardAlertLevel(g: GuardState): number {
  if (g.mode === "alert") return Math.min(1, g.timer / 0.25);
  if (g.mode === "chase" || g.mode === "lunge") return 1;
  if (g.mode === "search") return 0.5;
  return 0;
}
