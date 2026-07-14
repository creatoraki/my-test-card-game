// ============================================================================
// 引擎原语 —— 伤害结算管线、治疗、护盾、状态施加、状态生命周期、胜负判定。
// 这些是所有效果/AI/状态最终落地的地方, 都经过事件钩子, 便于组合出复杂联动。
// ============================================================================

import type {
  BattleState,
  Combatant,
  DamageCtx,
  DamageOpts,
  EngineOps,
  StatusCtx,
  StatusInstance,
} from "./types";
import { STATUS_DEFS } from "./statuses";

export function log(state: BattleState, text: string): void {
  state.log.push({ round: state.round, tick: state.tick, text });
}

export function allIds(state: BattleState): string[] {
  return [...state.playerIds, ...state.enemyIds];
}

export function getStatus(cmb: Combatant, id: string): StatusInstance | undefined {
  return cmb.statuses.find((s) => s.id === id);
}

function cleanup(cmb: Combatant): void {
  cmb.statuses = cmb.statuses.filter((s) => s.stacks > 0);
}

function ctxFor(state: BattleState, ownerId: string, inst: StatusInstance): StatusCtx {
  return { state, ownerId, inst, ops };
}

export function markDead(state: BattleState, cmb: Combatant): void {
  if (!cmb.alive) return;
  cmb.hp = 0;
  cmb.alive = false;
  log(state, `${cmb.emoji} ${cmb.name} 倒下了`);
}

// ---------------------------------------------------------------------------
// 伤害结算管线: 基础值 → 施放者修正(力量/虚弱) → 目标修正(易伤) → 护盾吸收 → 落定 → 反伤
// ---------------------------------------------------------------------------
export function dealDamage(
  state: BattleState,
  sourceId: string | undefined,
  targetId: string,
  amount: number,
  opts: DamageOpts = {},
): void {
  const target = state.combatants[targetId];
  if (!target || !target.alive) return;

  const dmg: DamageCtx = {
    sourceId,
    targetId,
    amount,
    flags: opts.flags ?? [],
    isAttack: opts.isAttack ?? false,
    blocked: 0,
    hpLost: 0,
  };

  // 施放者身上的状态(力量 +, 虚弱 ×)
  const src = sourceId ? state.combatants[sourceId] : undefined;
  if (src) {
    for (const inst of [...src.statuses])
      STATUS_DEFS[inst.id]?.hooks?.modifyOutgoingDamage?.(ctxFor(state, sourceId!, inst), dmg);
  }
  // 目标身上的状态(易伤 ×)
  for (const inst of [...target.statuses])
    STATUS_DEFS[inst.id]?.hooks?.modifyIncomingDamage?.(ctxFor(state, targetId, inst), dmg);

  dmg.amount = Math.max(0, Math.round(dmg.amount));

  // 护盾吸收
  if (!opts.unblockable && target.block > 0) {
    const absorbed = Math.min(target.block, dmg.amount);
    target.block -= absorbed;
    dmg.amount -= absorbed;
    dmg.blocked = absorbed;
  }

  target.hp -= dmg.amount;
  dmg.hpLost = dmg.amount;

  const blockedText = dmg.blocked > 0 ? `(护盾挡下 ${dmg.blocked})` : "";
  log(state, `${target.emoji} ${target.name} 受到 ${dmg.hpLost} 点伤害${blockedText}`);

  // 被攻击后触发(荆棘等)
  for (const inst of [...target.statuses])
    STATUS_DEFS[inst.id]?.hooks?.onAfterAttacked?.(ctxFor(state, targetId, inst), dmg);
  cleanup(target);

  if (target.hp <= 0) markDead(state, target);
}

export function heal(state: BattleState, targetId: string, amount: number): void {
  const t = state.combatants[targetId];
  if (!t || !t.alive || amount <= 0) return;
  const before = t.hp;
  t.hp = Math.min(t.maxHp, t.hp + amount);
  log(state, `${t.emoji} ${t.name} 回复 ${t.hp - before} 点生命`);
}

export function gainBlock(state: BattleState, targetId: string, amount: number): void {
  const t = state.combatants[targetId];
  if (!t || !t.alive || amount <= 0) return;
  t.block += amount;
  log(state, `${t.emoji} ${t.name} 获得 ${amount} 点护盾`);
}

export function applyStatus(
  state: BattleState,
  targetId: string,
  statusId: string,
  stacks: number,
): void {
  const t = state.combatants[targetId];
  if (!t || !t.alive || stacks === 0) return;
  const def = STATUS_DEFS[statusId];
  const existing = getStatus(t, statusId);
  if (existing) existing.stacks += stacks;
  else t.statuses.push({ id: statusId, stacks });
  cleanup(t);
  log(state, `${t.emoji} ${t.name} 获得 ${def?.name ?? statusId} ${stacks > 0 ? "+" : ""}${stacks}`);
}

export function modifyThreat(state: BattleState, targetId: string, amount: number): void {
  const t = state.combatants[targetId];
  if (!t || t.team !== "player" || !t.alive) return;
  t.threat += amount;
  log(state, `${t.emoji} ${t.name} 仇恨 ${amount > 0 ? "+" : ""}${amount}`);
}

// 供状态钩子使用的原语集合
export const ops: EngineOps = {
  dealDamage,
  heal,
  gainBlock,
  applyStatus,
  modifyThreat,
  log,
};

// ---------------------------------------------------------------------------
// 状态生命周期 —— 在回合/时刻边界统一驱动所有单位身上的状态钩子。
// ---------------------------------------------------------------------------
function runLifecycle(
  state: BattleState,
  hook: "onRoundStart" | "onRoundEnd" | "onTick",
): void {
  for (const id of allIds(state)) {
    const cmb = state.combatants[id];
    if (!cmb.alive) continue;
    for (const inst of [...cmb.statuses]) {
      if (!cmb.alive) break;
      STATUS_DEFS[inst.id]?.hooks?.[hook]?.(ctxFor(state, id, inst));
    }
    cleanup(cmb);
    if (cmb.hp <= 0) markDead(state, cmb);
  }
}

export function runRoundStart(state: BattleState): void {
  runLifecycle(state, "onRoundStart");
}
export function runRoundEnd(state: BattleState): void {
  runLifecycle(state, "onRoundEnd");
}
export function runTick(state: BattleState): void {
  runLifecycle(state, "onTick");
}

// ---------------------------------------------------------------------------
// 胜负判定
// ---------------------------------------------------------------------------
export function checkEnd(state: BattleState): void {
  if (state.phase !== "player") return;
  const playersAlive = state.playerIds.some((id) => state.combatants[id].alive);
  const enemiesAlive = state.enemyIds.some((id) => state.combatants[id].alive);
  if (!enemiesAlive) {
    state.phase = "won";
    log(state, "🎉 战斗胜利!");
  } else if (!playersAlive) {
    state.phase = "lost";
    log(state, "💀 全员阵亡……");
  }
}
