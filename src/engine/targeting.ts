// 目标选择。无站位；有嘲讽时先收窄到嘲讽单位，否则在存活目标中等概率随机挑一个。
// 普通敌人的定向目标筛选由 enemyMovePick.ts 负责, 本文件只提供公共敌我查询与嘲讽口径。
// 走战斗 RNG(rngFloat) 而不是 Math.random, 保证同种子的战斗可复现。

import type { BattleState, Combatant } from "./types";
import { rngPick } from "./rng";

export function aliveOf(state: BattleState, team: "player" | "enemy"): Combatant[] {
  const ids = team === "player" ? state.playerIds : state.enemyIds;
  return ids.map((id) => state.combatants[id]).filter((c) => c.alive);
}

export function foesOf(state: BattleState, cmb: Combatant): Combatant[] {
  return aliveOf(state, cmb.team === "player" ? "enemy" : "player");
}

export function alliesOf(state: BattleState, cmb: Combatant): Combatant[] {
  return aliveOf(state, cmb.team);
}

export function tauntedAmong(candidates: Combatant[]): Combatant[] {
  return candidates.filter((candidate) =>
    candidate.statuses.some((status) => status.id === "taunt" && status.stacks > 0),
  );
}

export function validFoeTargetIds(state: BattleState, actorTeam: "player" | "enemy"): string[] {
  const candidates = aliveOf(state, actorTeam === "player" ? "enemy" : "player");
  const taunted = tauntedAmong(candidates);
  return (taunted.length > 0 ? taunted : candidates).map((candidate) => candidate.id);
}

// 敌人随机挑一个存活的我方单位。没有可选目标时返回 undefined。
export function chooseRandomTarget(state: BattleState, enemyId: string): string | undefined {
  const enemy = state.combatants[enemyId];
  const candidates = foesOf(state, enemy); // 敌人的 foe = 我方
  if (candidates.length === 0) return undefined;
  const taunted = tauntedAmong(candidates);
  return rngPick(state, taunted.length > 0 ? taunted : candidates).id;
}
