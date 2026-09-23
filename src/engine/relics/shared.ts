import { rngInt } from "../core/rng";
import type { BattleState } from "../types";
import type { RelicBehaviorContext } from "./types";

/** 遗物实例的运行态计数, 随战斗状态一起存档。 */
export function relicData(ctx: RelicBehaviorContext): Record<string, number> {
  return (ctx.relic.data ??= {});
}

export function aliveEnemyIds(state: BattleState, excludeId?: string): string[] {
  return state.enemyIds.filter((id) => id !== excludeId && state.combatants[id]?.alive);
}

export function aliveAllyIds(state: BattleState): string[] {
  return state.playerIds.filter((id) => state.combatants[id]?.alive);
}

/** 走战斗 RNG 随机挑一名存活敌人, 保证同种子可复现。 */
export function randomAliveEnemy(state: BattleState, excludeId?: string): string | undefined {
  const enemies = aliveEnemyIds(state, excludeId);
  return enemies.length ? enemies[rngInt(state, enemies.length)] : undefined;
}
