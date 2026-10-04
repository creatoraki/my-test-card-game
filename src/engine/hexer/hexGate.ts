// ============================================================================
// 咒术师词条门控 —— 恶毒 N(目标减益种类 ≥ N)与后发 N(本回合已推进 ≥ N 时刻)。
// 词条写在效果描述符的 keywordGate 上, 由 effects.applyEffect 统一过滤目标。
// ============================================================================

import type { BattleState, EffectDescriptor, HexPlayState } from "../types";
import { STATUS_DEFS } from "../core/hookRegistry";
import { RULES } from "../core/battleRules";

export const HEX_OATH_STATUS = "hexOath";

export function emptyHexPlay(): HexPlayState {
  return { returnToHand: false, asFast: false, extraAdvance: 0, damageFlags: [] };
}

// 单位身上的减益种类数: 按 id 去重, 标记类状态(锁魂 / 疫病 / 咒丝)不计入。
export function debuffKindCount(state: BattleState, unitId: string): number {
  const unit = state.combatants[unitId];
  if (!unit) return 0;
  const kinds = new Set<string>();
  for (const status of unit.statuses) {
    const def = STATUS_DEFS[status.id];
    if (status.stacks > 0 && def?.kind === "debuff" && !def.mark) kinds.add(status.id);
  }
  return kinds.size;
}

// 恶毒判定用的种类数: 施放者持有咒誓时视为 +1。
export function venomCount(state: BattleState, unitId: string, sourceId?: string): number {
  const source = sourceId ? state.combatants[sourceId] : undefined;
  const oath = source?.statuses.some((status) => status.id === HEX_OATH_STATUS && status.stacks > 0) ? 1 : 0;
  return debuffKindCount(state, unitId) + oath;
}

export function venomMet(state: BattleState, unitId: string | undefined, n: number, sourceId?: string): boolean {
  if (!unitId || !state.combatants[unitId]) return false;
  return venomCount(state, unitId, sourceId) >= n;
}

export function ticksThisRound(state: BattleState): number {
  return Math.max(0, state.tick - RULES.timeline.startTick);
}

export function lateMet(state: BattleState, n: number): boolean {
  return ticksThisRound(state) >= n;
}

// 按词条过滤效果目标。返回 null = 整条效果不结算。
//   后发: 整条效果一起判定。
//   恶毒: allFoes 效果逐目标判定; 其余效果按主目标(无主目标时取本次出牌的主目标)判定。
export function filterByKeywordGate(
  state: BattleState,
  effect: EffectDescriptor,
  sourceId: string,
  targetIds: string[],
  primaryId: string | undefined,
): string[] | null {
  const gate = effect.keywordGate;
  if (!gate) return targetIds;
  const pass = (met: boolean) => (gate.invert ? !met : met);

  if (gate.kind === "late") return pass(lateMet(state, gate.n)) ? targetIds : null;

  if ((effect.target ?? "primary") === "allFoes") {
    const kept = targetIds.filter((id) => pass(venomMet(state, id, gate.n, sourceId)));
    return kept.length > 0 ? kept : null;
  }
  const unitId = primaryId ?? state.activeCardPrimaryId ?? undefined;
  return pass(venomMet(state, unitId, gate.n, sourceId)) ? targetIds : null;
}

// 手牌高亮: 后发已满足, 或恶毒对场上任一敌人已满足。
export function keywordGateReady(state: BattleState, effect: EffectDescriptor, sourceId: string): boolean {
  const gate = effect.keywordGate;
  if (!gate || gate.invert) return false;
  if (gate.kind === "late") return lateMet(state, gate.n);
  return state.enemyIds.some((id) => state.combatants[id]?.alive && venomMet(state, id, gate.n, sourceId));
}
