import { STATUS_DEFS } from "../core/hookRegistry";
import { RULES } from "../core/battleRules";
import type { BattleState, StatusSegment } from "../types";
import { allIds, cleanup, ctxFor, markDead } from "../core/ops";
import { effectiveStacks, tickStatus } from "../statuses/stacking";
import { notifyDotExpired } from "../statuses/dotEvents";

function runTempo(state: BattleState, ownerId: string): void {
  const cmb = state.combatants[ownerId];
  if (!cmb.alive) return;

  // 敌人在行动前进入下一拍; 我方在回合结束结算当前拍, 完成后再推进。
  const tempo = cmb.team === "enemy" ? cmb.tempo + 1 : cmb.tempo;
  if (cmb.team === "enemy") {
    // 敌人先写入拍号, 让本拍新施加的状态跳过本次衰减。
    cmb.tempo = tempo;
  }
  for (const inst of [...cmb.statuses]) {
    if (!cmb.alive) break;
    const def = STATUS_DEFS[inst.id];
    if (!def) continue;
    const stacks = effectiveStacks(inst, def, tempo);
    if (stacks > 0) def.hooks?.onTempo?.(ctxFor(state, ownerId, inst, stacks));
  }

  const expiredDots: { statusId: string; segments: StatusSegment[] }[] = [];
  // 衰减前取快照，避免暂停效果在同拍到期时受状态遍历顺序影响。
  const pausedDurations = new Set(cmb.statuses
    .filter((inst) => inst.stacks > 0 && (inst.duration == null || inst.duration > 0))
    .flatMap((inst) => STATUS_DEFS[inst.id]?.pausesStatusDuration ?? []));
  for (const inst of [...cmb.statuses]) {
    const def = STATUS_DEFS[inst.id];
    if (!def) continue;
    if (pausedDurations.has(inst.id)) continue;
    const expired = tickStatus(inst, def, tempo);
    if (expired.length > 0) expiredDots.push({ statusId: inst.id, segments: expired });
  }
  // 先让本拍衰减全部完成, 再派发到期事件: 转化出的新分段从下一拍开始计时。
  if (cmb.alive)
    for (const { statusId, segments } of expiredDots) notifyDotExpired(state, ownerId, statusId, segments);
  for (const inst of [...cmb.statuses]) {
    if (!cmb.statuses.includes(inst)) continue;
    const def = STATUS_DEFS[inst.id];
    if (def && ((inst.duration != null && inst.duration <= 0) || inst.stacks <= 0))
      def.hooks?.onExpire?.(ctxFor(state, ownerId, inst));
  }
  cleanup(cmb);
  if (cmb.team === "enemy" && cmb.hp <= 0) markDead(state, cmb);
  if (cmb.team === "player") {
    // 我方完成当前拍结算后才进入下一拍。
    cmb.tempo = tempo + 1;
  }
}

// 单个我方单位的拍点。分单位暴露是为了让回合结束能逐个录动画帧。
export function runOwnerTempo(state: BattleState, ownerId: string): void {
  runTempo(state, ownerId);
}

export function runStatusTickNow(state: BattleState, ownerId: string, statusId: string, stacks?: number): void {
  const cmb = state.combatants[ownerId];
  if (!cmb?.alive) return;
  const inst = cmb.statuses.find((status) => status.id === statusId);
  const def = inst && STATUS_DEFS[statusId];
  if (inst && def) def.hooks?.onTempo?.(ctxFor(state, ownerId, inst, stacks ?? inst.stacks));
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

// 「本回合」状态(expiresOnRoundEnd)在回合结束后统一移除 —— 敌方回合末的清算仍在本回合内。
export function purgeRoundStatuses(state: BattleState): void {
  for (const id of allIds(state)) {
    const cmb = state.combatants[id];
    if (!cmb) continue;
    cmb.statuses = cmb.statuses.filter((inst) => !STATUS_DEFS[inst.id]?.expiresOnRoundEnd);
  }
}
