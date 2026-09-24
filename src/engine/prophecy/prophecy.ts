// ============================================================================
// 预言事件 —— 监听击杀 / 瀑布 / 敌人行动 / 星辉消耗 / 期限结束, 结算应验与落空。
// 事件统一从 ops.prophecyEvent 进入, 由本模块在加载时注入(与 passive.ts 的 firePassive 同一晚绑定模式)。
// ★ 本模块需在战斗入口加载(battle/battle.ts 副作用导入), 否则 ops.prophecyEvent 为空实现。
// ============================================================================

import type { BattleState, EffectDescriptor, ProphecyEvent } from "../types";
import { ops } from "../core/ops";
import { resolveEffects } from "../effects/effects";
import { ILL_OMEN_MARK, prophecyByStatus } from "./prophecyDefs";
import {
  activeProphecy,
  clearIllOmenMarks,
  hasIllOmenMark,
  removeProphecyStatus,
  type ActiveProphecy,
} from "./prophecyState";

export { startProphecy } from "./prophecyState";

// 结算应验 / 落空。★ 先移除状态再结算效果 —— 奖励里的击杀、瀑布不会重入同一个预言。
function settle(state: BattleState, active: ActiveProphecy, fulfilled: boolean): void {
  const { ownerId, def } = active;
  removeProphecyStatus(state, ownerId, def.statusId);
  if (def.id === "illOmen") clearIllOmenMarks(state, fulfilled);
  ops.log(state, `${def.emoji} 预言·${def.name}${fulfilled ? "应验" : "落空"}`);
  const effects: EffectDescriptor[] = (fulfilled ? def.onFulfill : def.onFail) ?? [];
  if (effects.length === 0 || !state.combatants[ownerId]?.alive) return;
  // 预言奖励不是自动出牌的一部分, 即使在自动出牌途中应验也要照常汇星。
  const suppress = state.autoPlaySuppress;
  state.autoPlaySuppress = false;
  try {
    resolveEffects(state, effects, ownerId, undefined);
  } finally {
    state.autoPlaySuppress = suppress;
  }
}

export function prophecyEvent(state: BattleState, event: ProphecyEvent): void {
  if (event.type === "expired") {
    const def = prophecyByStatus(event.statusId);
    const inst = state.combatants[event.ownerId]?.statuses.find((status) => status.id === event.statusId);
    if (def && inst) settle(state, { ownerId: event.ownerId, inst, def }, false);
    return;
  }
  if (event.type === "afterEnemyAct") {
    const enemy = state.combatants[event.enemyId];
    if (enemy)
      enemy.statuses = enemy.statuses.filter((status) => status.id !== ILL_OMEN_MARK || status.data?.armed !== 1);
    return;
  }

  const active = activeProphecy(state);
  if (!active) return;
  switch (event.type) {
    case "enemyKilled":
      if (active.def.id === "goodOmen") settle(state, active, true);
      else if (active.def.id === "illOmen" && hasIllOmenMark(state.combatants[event.enemyId]))
        settle(state, active, false);
      return;
    case "waterfall":
      if (active.def.id === "omen") settle(state, active, true);
      return;
    case "beforeEnemyAct": {
      const enemy = state.combatants[event.enemyId];
      if (active.def.id !== "illOmen" || !enemy || !hasIllOmenMark(enemy)) return;
      const fulfilled = event.moveKind === "attack";
      if (fulfilled) {
        const mark = enemy.statuses.find((status) => status.id === ILL_OMEN_MARK);
        if (mark) mark.data = { ...mark.data, armed: 1 };
      }
      settle(state, active, fulfilled);
      return;
    }
    case "starlightSpent": {
      if (active.def.id !== "apocalypse" || event.amount <= 0) return;
      const progress = (active.inst.data?.progress ?? 0) + event.amount;
      active.inst.data = { ...active.inst.data, progress };
      ops.log(state, `${active.def.emoji} 预言·${active.def.name}：已消耗星辉 ${progress} / ${active.def.goal}`);
      if (progress >= (active.def.goal ?? Infinity)) settle(state, active, true);
      return;
    }
  }
}

ops.prophecyEvent = prophecyEvent;
