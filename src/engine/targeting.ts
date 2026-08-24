// 目标选择。无站位、★ 无仇恨 —— 敌人在存活的我方单位里等概率随机挑一个。
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

// 敌人随机挑一个存活的我方单位。没有可选目标时返回 undefined。
export function chooseRandomTarget(state: BattleState, enemyId: string): string | undefined {
  const enemy = state.combatants[enemyId];
  const candidates = foesOf(state, enemy); // 敌人的 foe = 我方
  if (candidates.length === 0) return undefined;
  const taunted = candidates.filter((candidate) => {
    const status = candidate.statuses.find((entry) => entry.id === "taunt");
    return status && status.stacks > 0 && (status.appliedRound == null || status.appliedRound < state.round);
  });
  return rngPick(state, taunted.length > 0 ? taunted : candidates).id;
}
