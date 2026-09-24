// ============================================================================
// 预言的挂载与查询 —— 不依赖效果解释器(effects.ts 经由 effectsProphet 引用本文件, 反向引用会成环)。
// 同时只能存在 1 个预言: 打出异名预言时旧预言直接移除(不结算落空); 同名预言刷新期限、保留进度。
// ============================================================================

import type { BattleState, Combatant, ProphecyId, StatusInstance } from "../types";
import { ops } from "../core/ops";
import { prophetIdOf } from "../prophet/prophetUnit";
import { ILL_OMEN_MARK, PROPHECY_DEFS, PROPHECY_LIST, prophecyByStatus, type ProphecyDef } from "./prophecyDefs";

export interface ActiveProphecy {
  ownerId: string;
  inst: StatusInstance;
  def: ProphecyDef;
}

export function activeProphecy(state: BattleState): ActiveProphecy | undefined {
  const ownerId = prophetIdOf(state);
  const owner = ownerId ? state.combatants[ownerId] : undefined;
  if (!owner) return undefined;
  for (const inst of owner.statuses) {
    const def = prophecyByStatus(inst.id);
    if (def && inst.stacks > 0) return { ownerId: owner.id, inst, def };
  }
  return undefined;
}

export function hasIllOmenMark(unit: Combatant | undefined): boolean {
  return Boolean(unit?.statuses.some((status) => status.id === ILL_OMEN_MARK));
}

// 清除凶兆标记。keepArmed = 保留已应验、正在削弱本次攻击的标记(结算完由 afterEnemyAct 移除)。
export function clearIllOmenMarks(state: BattleState, keepArmed = false): void {
  for (const id of state.enemyIds) {
    const enemy = state.combatants[id];
    if (!enemy) continue;
    enemy.statuses = enemy.statuses.filter(
      (status) => status.id !== ILL_OMEN_MARK || (keepArmed && status.data?.armed === 1),
    );
  }
}

export function removeProphecyStatus(state: BattleState, ownerId: string, statusId: string): void {
  const owner = state.combatants[ownerId];
  if (owner) owner.statuses = owner.statuses.filter((status) => status.id !== statusId);
}

export function startProphecy(state: BattleState, sourceId: string, id: ProphecyId, primaryId?: string): void {
  const def = PROPHECY_DEFS[id];
  const owner = state.combatants[sourceId];
  if (!def || !owner?.alive) return;
  const target = primaryId ? state.combatants[primaryId] : undefined;
  if (id === "illOmen" && (!target?.alive || target.team !== "enemy")) return;

  // 顶替: 移除其他预言(不结算落空)。
  for (const other of PROPHECY_LIST) {
    if (other.id === id || !owner.statuses.some((status) => status.id === other.statusId)) continue;
    removeProphecyStatus(state, sourceId, other.statusId);
    ops.log(state, `${other.emoji} 预言·${other.name}被新的预言顶替`);
  }
  clearIllOmenMarks(state, true);
  if (id === "illOmen" && target) {
    // 纯显示标记: 直接写入, 绕过免疫与抗性。
    target.statuses.push({ id: ILL_OMEN_MARK, stacks: 1, sourceId, appliedAt: target.tempo });
  }

  const existing = owner.statuses.find((status) => status.id === def.statusId);
  if (existing) {
    if (def.duration != null) existing.duration = def.duration;
    existing.appliedAt = owner.tempo;
    ops.log(state, `${def.emoji} 预言·${def.name}刷新期限`);
    return;
  }
  ops.applyStatus(state, sourceId, def.statusId, 1, def.duration, def.goal != null ? { progress: 0 } : undefined, sourceId);
}
