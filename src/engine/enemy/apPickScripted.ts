// 脚本怪(EnemyDef.ai)的行动点抽招 —— 招式编排交给脚本, 不走「小 / 小 / 大」节奏。
// 规则(按顺序):
//   1. 点数 ≥ 大招消耗 × ultimateForceRatio → 固定放大招(须在脚本允许范围内; 开场招优先)
//   2. 点数 ≥ 大招消耗(付得起所有招式) → 照常按脚本抽招, 出完接着判断(可连续行动)
//   3. 付不起所有招式 → 掷骰: 出招概率 = (点数 − 最低消耗 + 1) / (最高消耗 − 最低消耗 + 1)
//   4. 点数 < 最低消耗 → 停手
//   例外: 每回合第一次出招(mustAct)不掷骰、不停手

import type { BattleState, Enemy } from "../types";
import type { EnemyDef, EnemyMove } from "@/data";
import { RULES } from "../core/battleRules";
import { rngFloat, rngPick } from "../core/rng";
import { pickScriptedMove, scriptAllowedMoveIds, scriptOpeningPending } from "./enemyScript";
import { fallbackMove } from "./apShared";

function forcedUltimate(state: BattleState, e: Enemy, def: EnemyDef, maxCost: number): EnemyMove | undefined {
  if (e.ap < maxCost * RULES.enemy.ultimateForceRatio) return undefined;
  if (scriptOpeningPending(e)) return undefined;
  const allowed = scriptAllowedMoveIds(e, def);
  const usable = def.moves.filter((move) => move.cost === maxCost && allowed.has(move.id));
  return usable.length > 0 ? rngPick(state, usable) : undefined;
}

// def 已按锁魂剔除过大招; locked 时不再强制放大招。
export function chooseScriptedApMove(
  state: BattleState,
  e: Enemy,
  def: EnemyDef,
  mustAct: boolean,
  locked: boolean,
): EnemyMove | null {
  const costs = def.moves.map((move) => move.cost);
  const maxCost = Math.max(...costs);
  const minCost = Math.min(...costs);
  if (e.ap < minCost) return mustAct ? fallbackMove(state, e, def.moves) : null;

  const ultimate = locked ? undefined : forcedUltimate(state, e, def, maxCost);
  if (ultimate) return ultimate;

  if (!mustAct && e.ap < maxCost) {
    const actChance = (e.ap - minCost + 1) / (maxCost - minCost + 1);
    if (rngFloat(state) >= actChance) return null;
  }
  const canAfford = (move: EnemyMove) => move.cost <= e.ap;
  const move = pickScriptedMove(state, e, def, canAfford);
  if (canAfford(move)) return move;
  return mustAct ? fallbackMove(state, e, def.moves) : null;
}
