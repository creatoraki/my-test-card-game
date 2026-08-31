import { STATUS_DEFS } from "./statuses";
import { RULES } from "./rules";
import type { BattleState } from "./types";
import { allIds, cleanup, ctxFor, markDead } from "./ops";

function runTempo(state: BattleState, ownerId: string): void {
  const cmb = state.combatants[ownerId];
  if (!cmb.alive) return;

  // 敌人的拍点发生在行动前, 因此先进入下一次行动对应的节拍; 我方在回合结束处理当前节拍。
  const tempo = cmb.team === "enemy" ? cmb.tempo + 1 : cmb.tempo;
  for (const inst of [...cmb.statuses]) {
    if (!cmb.alive) break;
    if (inst.appliedAt === tempo) continue;
    STATUS_DEFS[inst.id]?.hooks?.onTempo?.(ctxFor(state, ownerId, inst));
  }

  for (const inst of [...cmb.statuses]) {
    if (inst.appliedAt === tempo) continue;
    const def = STATUS_DEFS[inst.id];
    if (def?.decay === "one") inst.stacks -= 1;
    if (def?.decay === "half") inst.stacks = Math.floor(inst.stacks / 2);
    if (inst.duration != null) inst.duration -= 1;
  }
  cleanup(cmb);
  if (cmb.team === "enemy" && cmb.hp <= 0) markDead(state, cmb);
  cmb.tempo = tempo;
}

export function runAllyTempo(state: BattleState): void {
  for (const id of state.playerIds) {
    if (state.combatants[id].alive) runTempo(state, id);
  }
}

export function runEnemyTempo(state: BattleState, enemyId: string): boolean {
  const enemy = state.combatants[enemyId];
  if (!enemy || !enemy.alive) return false;
  if (!RULES.combat.enemyTempoPerAct && enemy.tempo >= state.round) return true;
  runTempo(state, enemyId);
  return enemy.alive;
}

function runTickLifecycle(state: BattleState, hook: "onTick"): void {
  for (const id of allIds(state)) {
    const cmb = state.combatants[id];
    if (!cmb.alive) continue;
    for (const inst of [...cmb.statuses]) {
      if (!cmb.alive) break;
      STATUS_DEFS[inst.id]?.hooks?.[hook]?.(ctxFor(state, id, inst));
    }
    cleanup(cmb);
    if (cmb.team === "enemy" && cmb.hp <= 0) markDead(state, cmb);
  }
}

export function runTick(state: BattleState): void {
  runTickLifecycle(state, "onTick");
}