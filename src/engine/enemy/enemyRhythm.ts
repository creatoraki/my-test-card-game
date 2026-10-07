// 怪物出招节奏「小 / 小 / 大」(仅非脚本怪)。
//   - 每发动 smallsBeforeUltimate 次小招, 进入攒点期: 只出每回合必出的那一招, 不再连续行动
//   - 攒点期点数够大招时为决策点: 按 ultimateChance 掷骰放大招, 放完节奏归零
//   - 没放(没掷中 / 大招被权重条件挡住) = 放弃本轮: 节奏归零, 改出小招, 本回合有点就连放
//   - 临近大招时挑小招, 优先挑出完后下回合仍付得起大招的招, 避免把大招往后拖
// 大招 = 消耗最高的招式; 所有招式同一档消耗时没有大招, 有点就出。

import type { Enemy } from "../types";
import type { EnemyDef, EnemyMove } from "@/data";
import { RULES } from "../core/battleRules";

export function ultimateCost(def: EnemyDef): number | null {
  if (def.moves.length === 0) return null;
  const costs = def.moves.map((move) => move.cost);
  const maxCost = Math.max(...costs);
  return maxCost > Math.min(...costs) ? maxCost : null;
}

// 已出满小招: 下一招该放大招。
export function ultimateDue(e: Enemy): boolean {
  return e.rhythm.smallsSinceUltimate >= RULES.enemy.smallsBeforeUltimate;
}

// 正在挑的这一招出完后就该放大招(或已经该放大招) —— 挑招须为大招留点。
export function ultimateImminent(e: Enemy): boolean {
  return e.rhythm.smallsSinceUltimate + 1 >= RULES.enemy.smallsBeforeUltimate;
}

// 放弃本轮大招, 节奏从头计起。
export function restartRhythm(e: Enemy): void {
  e.rhythm.smallsSinceUltimate = 0;
}

// 招式真正发动时记一笔(被眩晕跳过的蓄力招不算)。
export function noteRhythmMove(e: Enemy, def: EnemyDef, move: EnemyMove): void {
  const cost = ultimateCost(def);
  e.rhythm.smallsSinceUltimate = cost != null && move.cost === cost ? 0 : e.rhythm.smallsSinceUltimate + 1;
}

// 为大招留点: 只留出完后靠下回合回复仍付得起大招的招; 一个都没有就只留最便宜的。
export function keepUltimateReachable(e: Enemy, moves: EnemyMove[], ultCost: number): EnemyMove[] {
  const reachable = moves.filter((move) => e.ap - move.cost + e.apPerRound >= ultCost);
  if (reachable.length > 0) return reachable;
  const cheapest = Math.min(...moves.map((move) => move.cost));
  return moves.filter((move) => move.cost === cheapest);
}
