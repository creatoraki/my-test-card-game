// 目标选择 + 仇恨(aggro)。无站位。

import type { BattleState, Combatant } from "./types";
import { RULES } from "./rules";
import { rngFloat } from "./rng";

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

// 敌人按仇恨选择要攻击的我方目标。
export function chooseAggroTarget(state: BattleState, enemyId: string): string | undefined {
  const enemy = state.combatants[enemyId];
  const allies = foesOf(state, enemy); // 敌人的 foe = 我方
  if (allies.length === 0) return undefined;

  if (RULES.aggro.mode === "highest") {
    // 取最高仇恨, 平局取靠前
    return allies.reduce((best, a) => ((a as any).threat > (best as any).threat ? a : best)).id;
  }

  // 按仇恨加权随机
  const weights = allies.map((a) => Math.max(1, (a as any).threat as number));
  const total = weights.reduce((s, w) => s + w, 0);
  let roll = rngFloat(state) * total;
  for (let i = 0; i < allies.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return allies[i].id;
  }
  return allies[allies.length - 1].id;
}
