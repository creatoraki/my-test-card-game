import { STATUS_DEFS } from "./statuses";
import { RULES } from "./rules";
import type { BattleState } from "./types";
import { allIds, cleanup, ctxFor, markDead } from "./ops";
import { effectiveStacks, tickStatus } from "./statuses/stacking";

function runTempo(state: BattleState, ownerId: string): void {
  const cmb = state.combatants[ownerId];
  if (!cmb.alive) return;

  // 敌人的拍点发生在行动前, 因此先进入下一次行动对应的节拍; 我方在回合结束处理当前节拍。
  const tempo = cmb.team === "enemy" ? cmb.tempo + 1 : cmb.tempo;
  for (const inst of [...cmb.statuses]) {
    if (!cmb.alive) break;
    const def = STATUS_DEFS[inst.id];
    if (!def) continue;
    const stacks = effectiveStacks(inst, def, tempo);
    if (stacks > 0) def.hooks?.onTempo?.(ctxFor(state, ownerId, inst, stacks));
  }

  for (const inst of [...cmb.statuses]) {
    const def = STATUS_DEFS[inst.id];
    if (def) tickStatus(inst, def, tempo);
  }
  cleanup(cmb);
  if (cmb.team === "enemy" && cmb.hp <= 0) markDead(state, cmb);
  cmb.tempo = tempo;
}

// 单个我方单位的拍点。分单位暴露是为了让回合结束能逐个录动画帧。
export function runOwnerTempo(state: BattleState, ownerId: string): void {
  runTempo(state, ownerId);
}

export function runAllyTempo(state: BattleState): void {
  for (const id of allyTempoIds(state)) runTempo(state, id);
}

// 本次回合结束需要结算拍点的我方单位(取快照, 避免结算途中集合变化)。
export function allyTempoIds(state: BattleState): string[] {
  return state.playerIds.filter((id) => state.combatants[id]?.alive);
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