import type { EnemyMode, EnemySpawn, EnemyState, PlayerState } from "../types";
import { PLAYER_PHYSICS } from "./playerPhysics";

// 黑影状态机：巡逻 → 警觉(红色感叹号) → 追击 → 碰触玩家后消散并永久移除；
// 追丢一段时间后返回巡逻区间。黑影可以悬浮，追击时直接在二维平面内滑行。
export const ENEMY_AI = {
  patrolSpeed: 90,
  chaseSpeed: 720,
  /** 追击起步的加速度，避免瞬间满速。 */
  chaseAccel: 2400,
  returnSpeed: 260,
  alertTime: 0.45,
  turnPause: 0.6,
  sightFront: 420,
  sightBack: 140,
  sightVertical: 220,
  giveUpDistance: 900,
  giveUpTime: 1.5,
  vanishTime: 0.45,
  halfWidth: 34,
  height: 150,
} as const;

const A = ENEMY_AI;

export function createEnemy(spawn: EnemySpawn): EnemyState {
  return {
    id: spawn.id,
    x: spawn.x,
    y: spawn.y,
    homeY: spawn.y,
    minX: spawn.minX,
    maxX: spawn.maxX,
    dir: -1,
    mode: "patrol",
    timer: 0,
    pause: 0,
    lose: 0,
  };
}

function canSee(e: EnemyState, p: PlayerState): boolean {
  const dx = p.x - e.x;
  if (Math.abs(p.y - e.y) > A.sightVertical) return false;
  const ahead = dx * e.dir;
  return (ahead >= 0 && ahead <= A.sightFront) || Math.abs(dx) <= A.sightBack;
}

function touching(e: EnemyState, p: PlayerState): boolean {
  const overlapX = Math.abs(p.x - e.x) < A.halfWidth + PLAYER_PHYSICS.halfWidth;
  const overlapY = p.y - PLAYER_PHYSICS.height < e.y && e.y - A.height < p.y;
  return overlapX && overlapY;
}

function faceToward(e: EnemyState, x: number) {
  if (Math.abs(x - e.x) > 4) e.dir = x > e.x ? 1 : -1;
}

function setMode(e: EnemyState, mode: EnemyMode, timer = 0) {
  e.mode = mode;
  e.timer = timer;
}

/** 推进一步，模式发生变化时返回新模式。 */
export function stepEnemy(e: EnemyState, p: PlayerState, dt: number): EnemyMode | null {
  const before = e.mode;
  if (e.mode === "gone") return null;

  if (e.mode === "vanish") {
    e.timer -= dt;
    if (e.timer <= 0) setMode(e, "gone");
    return e.mode !== before ? e.mode : null;
  }

  if (touching(e, p)) {
    setMode(e, "vanish", A.vanishTime);
    return e.mode;
  }

  switch (e.mode) {
    case "patrol":
      if (e.pause > 0) {
        e.pause -= dt;
      } else {
        e.x += e.dir * A.patrolSpeed * dt;
        if (e.x >= e.maxX || e.x <= e.minX) {
          e.x = Math.max(e.minX, Math.min(e.maxX, e.x));
          e.dir = e.x >= e.maxX ? -1 : 1;
          e.pause = A.turnPause;
        }
      }
      if (canSee(e, p)) {
        faceToward(e, p.x);
        setMode(e, "alert", A.alertTime);
      }
      break;
    case "alert":
      faceToward(e, p.x);
      e.timer -= dt;
      if (e.timer <= 0) setMode(e, "chase", 0);
      break;
    case "chase": {
      const dx = p.x - e.x;
      const dy = p.y - e.y;
      const dist = Math.hypot(dx, dy);
      // timer 在追击态里复用为当前速度
      e.timer = Math.min(A.chaseSpeed, e.timer + A.chaseAccel * dt);
      const step = Math.min(dist, e.timer * dt);
      if (dist > 0.01) {
        e.x += (dx / dist) * step;
        e.y += (dy / dist) * step;
      }
      faceToward(e, p.x);
      e.lose = dist > A.giveUpDistance ? e.lose + dt : 0;
      if (e.lose >= A.giveUpTime) {
        e.lose = 0;
        setMode(e, "return");
      }
      break;
    }
    case "return": {
      const tx = Math.max(e.minX, Math.min(e.maxX, e.x));
      const dx = tx - e.x;
      const dy = e.homeY - e.y;
      const dist = Math.hypot(dx, dy);
      const step = Math.min(dist, A.returnSpeed * dt);
      if (dist > 0.5) {
        e.x += (dx / dist) * step;
        e.y += (dy / dist) * step;
        faceToward(e, tx);
      } else {
        e.y = e.homeY;
        setMode(e, "patrol");
      }
      if (canSee(e, p)) {
        faceToward(e, p.x);
        setMode(e, "alert", A.alertTime);
      }
      break;
    }
  }
  return e.mode !== before ? e.mode : null;
}
