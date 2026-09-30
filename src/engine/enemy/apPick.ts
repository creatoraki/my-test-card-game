// 敌人行动点抽招: 决定下一招, 或本回合停手攒点(返回 null)。
// 规则(按顺序):
//   1. 点数 ≥ 大招消耗 × ultimateForceRatio → 固定放大招(大招 = 消耗最高的招式)
//   2. 点数 ≥ 大招消耗(付得起所有招式) → 照常抽招, 出完接着判断(可连续行动)
//   3. 付不起所有招式 → 掷骰: 出招概率 = (点数 − 最低消耗 + 1) / (最高消耗 − 最低消耗 + 1),
//      剩的点数越多越倾向出招; 出招只在付得起的招式里抽, 否则停手
//   4. 点数 < 最低消耗 → 停手

import type { BattleState, Enemy } from "../types";
import type { EnemyDef, EnemyMove } from "@/data";
import { RULES } from "../core/battleRules";
import { rngFloat, rngPick, rngPickWeighted } from "../core/rng";
import { enemyMoveWeight } from "./enemyMovePick";
import { pickScriptedMove, scriptAllowedMoveIds, scriptOpeningPending } from "./enemyScript";

function forcedUltimate(state: BattleState, e: Enemy, def: EnemyDef, maxCost: number): EnemyMove | undefined {
  if (e.ap < maxCost * RULES.enemy.ultimateForceRatio) return undefined;
  const ultimates = def.moves.filter((move) => move.cost === maxCost);
  if (def.ai) {
    // 脚本怪: 开场招优先; 大招须在脚本允许范围内(冷却、禁连发)。
    if (scriptOpeningPending(e)) return undefined;
    const allowed = scriptAllowedMoveIds(e, def);
    const usable = ultimates.filter((move) => allowed.has(move.id));
    return usable.length > 0 ? rngPick(state, usable) : undefined;
  }
  const usable = ultimates.filter((move) => enemyMoveWeight(state, e, move) > 0);
  return usable.length > 0 ? rngPickWeighted(state, usable, (move) => enemyMoveWeight(state, e, move)) : undefined;
}

function pickAffordable(state: BattleState, e: Enemy, def: EnemyDef): EnemyMove | null {
  const canAfford = (move: EnemyMove) => move.cost <= e.ap;
  if (def.ai) {
    const move = pickScriptedMove(state, e, def, canAfford);
    return canAfford(move) ? move : null;
  }
  const pool = def.moves.filter(canAfford);
  return pool.length > 0 ? rngPickWeighted(state, pool, (move) => enemyMoveWeight(state, e, move)) : null;
}

export function chooseNextMove(state: BattleState, e: Enemy, def: EnemyDef): EnemyMove | null {
  if (def.moves.length === 0) return null;
  const costs = def.moves.map((move) => move.cost);
  const maxCost = Math.max(...costs);
  const minCost = Math.min(...costs);
  if (e.ap < minCost) return null;

  const ultimate = forcedUltimate(state, e, def, maxCost);
  if (ultimate) return ultimate;

  if (e.ap < maxCost) {
    const actChance = (e.ap - minCost + 1) / (maxCost - minCost + 1);
    if (rngFloat(state) >= actChance) return null;
  }
  return pickAffordable(state, e, def);
}
