// 行动点抽招的公共部分: 锁魂判定、剔除大招、保底行动。

import type { BattleState, Enemy } from "../types";
import type { EnemyDef, EnemyMove } from "@/data";
import { rngPickWeighted } from "../core/rng";
import { enemyMoveWeight } from "./enemyMovePick";

// 锁魂(咒术师): 本次抽招不会抽到大招(消耗最高的招式); 只有一档消耗时不受影响。
export const SOUL_LOCK_STATUS = "soulLock";

export function hasSoulLock(e: Enemy): boolean {
  return e.statuses.some((status) => status.id === SOUL_LOCK_STATUS && status.stacks > 0);
}

export function withoutUltimates(def: EnemyDef): EnemyDef {
  const maxCost = Math.max(...def.moves.map((move) => move.cost));
  const moves = def.moves.filter((move) => move.cost < maxCost);
  return moves.length > 0 ? { ...def, moves } : def;
}

// 保底行动: 在付得起的招式里按权重随机; 一招都付不起时在全部招式里按权重随机,
// 点数透支(为负), 下回合回复时补上。
export function fallbackMove(state: BattleState, e: Enemy, moves: EnemyMove[]): EnemyMove {
  const affordable = moves.filter((move) => move.cost <= e.ap);
  const pool = affordable.length > 0 ? affordable : moves;
  return rngPickWeighted(state, pool, (move) => enemyMoveWeight(state, e, move));
}
