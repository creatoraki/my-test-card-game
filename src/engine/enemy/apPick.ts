// 敌人行动点抽招: 决定下一招, 或本回合停手攒点(返回 null)。
// 非脚本怪走「小 / 小 / 大」节奏(规则见 enemyRhythm.ts):
//   1. 已出满小招且点数 ≥ 大招消耗 → 决策点: 掷 ultimateChance 放大招;
//      没放 → 放弃本轮, 节奏归零, 改出小招(之后本回合有点就连放)
//   2. 已出满小招但付不起大招 → 攒点期: 只出每回合必出的那一招, 挑招为大招留点
//   3. 其余情况 → 有点就在小招里按权重抽(可一回合连续行动)
//   每回合第一次出招(mustAct)必定出招; 一招都付不起时透支出招。
// 脚本怪(EnemyDef.ai)保留原有规则, 见 apPickScripted.ts。

import type { BattleState, Enemy } from "../types";
import type { EnemyDef, EnemyMove } from "@/data";
import { RULES } from "../core/battleRules";
import { rngFloat, rngPickWeighted } from "../core/rng";
import { enemyMoveWeight } from "./enemyMovePick";
import { fallbackMove, hasSoulLock, withoutUltimates } from "./apShared";
import { chooseScriptedApMove } from "./apPickScripted";
import { keepUltimateReachable, restartRhythm, ultimateCost, ultimateDue, ultimateImminent } from "./enemyRhythm";

export { hasSoulLock, SOUL_LOCK_STATUS } from "./apShared";

function pickWeighted(state: BattleState, e: Enemy, moves: EnemyMove[]): EnemyMove {
  return rngPickWeighted(state, moves, (move) => enemyMoveWeight(state, e, move));
}

// 决策点掷大招; 大招全被权重条件挡住(权重为 0)时视同没掷中。
function rollUltimate(state: BattleState, e: Enemy, def: EnemyDef, ultCost: number): EnemyMove | undefined {
  const usable = def.moves.filter((move) => move.cost === ultCost && enemyMoveWeight(state, e, move) > 0);
  if (usable.length === 0) return undefined;
  if (rngFloat(state) * 100 >= RULES.enemy.ultimateChance) return undefined;
  return pickWeighted(state, e, usable);
}

// 在付得起的小招里抽; 临近大招时只在为大招留得住点的招里抽。
function pickSmall(state: BattleState, e: Enemy, smalls: EnemyMove[], ultCost: number | null): EnemyMove {
  const affordable = smalls.filter((move) => move.cost <= e.ap);
  const pool = ultCost != null && ultimateImminent(e) ? keepUltimateReachable(e, affordable, ultCost) : affordable;
  return pickWeighted(state, e, pool);
}

function chooseRhythmMove(state: BattleState, e: Enemy, def: EnemyDef, mustAct: boolean): EnemyMove | null {
  const ultCost = ultimateCost(def);
  const smalls = def.moves.filter((move) => (ultCost == null || move.cost < ultCost) && enemyMoveWeight(state, e, move) > 0);
  if (smalls.length === 0) {
    const usable = def.moves.filter((move) => !hasSoulLock(e) && enemyMoveWeight(state, e, move) > 0);
    const affordable = usable.filter((move) => move.cost <= e.ap);
    return affordable.length ? pickWeighted(state, e, affordable) : mustAct && usable.length ? fallbackMove(state, e, usable) : null;
  }

  if (ultCost != null && ultimateDue(e) && e.ap >= ultCost) {
    // 锁魂只挡这一次: 改出小招, 节奏不归零, 下次决策点照样掷大招。
    if (hasSoulLock(e)) return pickSmall(state, e, smalls, ultCost);
    const ultimate = rollUltimate(state, e, def, ultCost);
    if (ultimate) return ultimate;
    restartRhythm(e);
    return pickSmall(state, e, smalls, ultCost);
  }

  const minCost = Math.min(...smalls.map((move) => move.cost));
  if (e.ap < minCost) return mustAct ? fallbackMove(state, e, smalls) : null;
  if (!mustAct && ultCost != null && ultimateDue(e)) return null;
  return pickSmall(state, e, smalls, ultCost);
}

// mustAct: 本回合第一次出招 —— 每回合至少行动一次。
export function chooseNextMove(state: BattleState, e: Enemy, def: EnemyDef, mustAct = false): EnemyMove | null {
  if (def.moves.length === 0) return null;
  if (def.ai) {
    const locked = hasSoulLock(e);
    return chooseScriptedApMove(state, e, locked ? withoutUltimates(def) : def, mustAct, locked);
  }
  return chooseRhythmMove(state, e, def, mustAct);
}
