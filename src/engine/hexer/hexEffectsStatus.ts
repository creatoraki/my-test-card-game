// 咒术师效果: 夺取增益、继承 / 汇集 / 复制 / 交换诅咒、随机诅咒。从 hexEffects.ts 分发进来。
// ★ 只搬运诅咒(StatusDef.curse); 标记(锁魂 / 疫病 / 咒丝)、其他职业的减益与不可驱散状态一律不参与。

import type { BattleState, EffectDescriptor, StatusInstance } from "../types";
import { ops } from "../core/ops";
import { rngPick } from "../core/rng";
import { getStatusDef } from "../statuses";
import { attackDamage, offenseStatOf } from "../combat/stats";
import { isStealableBuff } from "./stealableBuff";

const RANDOM_HEX_POOL = ["doom", "grudge", "seal"] as const;
const GRUDGE_DAMAGE_RATIO = 0.1;

function movableCurse(status: StatusInstance): boolean {
  const def = getStatusDef(status.id);
  return status.stacks > 0 && Boolean(def?.curse) && !def?.mark && !def?.undispellable;
}

function aliveUnit(state: BattleState, id: string | undefined) {
  const unit = id ? state.combatants[id] : undefined;
  return unit?.alive ? unit : undefined;
}

// 把一个状态实例原样施加给目标: 分段状态逐段施加, 保留各段剩余持续。
function copyStatusTo(state: BattleState, toId: string, status: StatusInstance, sourceId?: string): void {
  const from = sourceId ?? status.sourceId;
  if (status.segments?.length) {
    for (const segment of status.segments)
      ops.applyStatus(state, toId, status.id, segment.stacks, segment.duration, status.data, from);
    return;
  }
  ops.applyStatus(state, toId, status.id, status.stacks, status.duration, status.data, from);
}

function moveCurses(state: BattleState, fromId: string, toId: string): number {
  const from = state.combatants[fromId];
  if (!from || !aliveUnit(state, toId) || fromId === toId) return 0;
  const moving = from.statuses.filter(movableCurse);
  if (moving.length === 0) return 0;
  from.statuses = from.statuses.filter((status) => !moving.includes(status));
  for (const status of moving) copyStatusTo(state, toId, status);
  return moving.length;
}

// 夺取: 主目标层数最高的 1 个可驱散增益, 按剩余持续转给施放者。
function stealBuff(state: BattleState, sourceId: string, primaryId: string | undefined): void {
  const target = aliveUnit(state, primaryId);
  state.lastRemovedStatusCount = 0;
  if (!target || !aliveUnit(state, sourceId)) return;
  const pool = target.statuses.filter(isStealableBuff);
  if (pool.length === 0) return;
  const stolen = pool.reduce((best, status) => (status.stacks > best.stacks ? status : best));
  target.statuses = target.statuses.filter((status) => status !== stolen);
  state.lastRemovedStatusCount = 1;
  copyStatusTo(state, sourceId, stolen, sourceId);
  ops.log(state, `${state.combatants[sourceId].name} 夺取了 ${target.name} 的${getStatusDef(stolen.id)?.name ?? stolen.id}`);
}

// 继承: 主目标(通常是刚被击杀的敌人)的全部诅咒交给解析出的目标。
function inheritDebuffs(state: BattleState, targetIds: string[], primaryId: string | undefined): void {
  const heirId = targetIds.find((id) => id !== primaryId);
  if (!primaryId || !heirId) return;
  const moved = moveCurses(state, primaryId, heirId);
  if (moved > 0) ops.log(state, `${state.combatants[heirId].name} 继承了 ${moved} 种诅咒`);
}

// 汇集: 其他所有敌人的诅咒转移到主目标, 同种诅咒按状态自身规则合并。
function gatherDebuffs(state: BattleState, primaryId: string | undefined): void {
  if (!primaryId || !aliveUnit(state, primaryId)) return;
  let moved = 0;
  for (const id of state.enemyIds) {
    if (id === primaryId || !aliveUnit(state, id)) continue;
    moved += moveCurses(state, id, primaryId);
  }
  if (moved > 0) ops.log(state, `${state.combatants[primaryId].name} 汇集了 ${moved} 种诅咒`);
}

// 交换: 主目标与解析出的另一名敌人互换全部诅咒。先双方同时摘下再互相施加, 避免同种诅咒在中途合并。
function swapCurses(state: BattleState, targetIds: string[], primaryId: string | undefined): void {
  const primary = aliveUnit(state, primaryId);
  const other = aliveUnit(state, targetIds.find((id) => id !== primaryId));
  if (!primary || !other) return;
  const fromPrimary = primary.statuses.filter(movableCurse);
  const fromOther = other.statuses.filter(movableCurse);
  if (fromPrimary.length === 0 && fromOther.length === 0) return;
  primary.statuses = primary.statuses.filter((status) => !fromPrimary.includes(status));
  other.statuses = other.statuses.filter((status) => !fromOther.includes(status));
  for (const status of fromPrimary) copyStatusTo(state, other.id, status);
  for (const status of fromOther) copyStatusTo(state, primary.id, status);
  ops.log(state, `${primary.name} 与 ${other.name} 交换了诅咒`);
}

// 复制: 随机把主目标的 1 种诅咒复制给解析出的目标(层数与剩余持续相同)。
function copyDebuff(state: BattleState, targetIds: string[], primaryId: string | undefined): void {
  const source = aliveUnit(state, primaryId);
  const receiverId = targetIds.find((id) => id !== primaryId && aliveUnit(state, id));
  if (!source || !receiverId) return;
  const pool = source.statuses.filter(movableCurse);
  if (pool.length === 0) return;
  copyStatusTo(state, receiverId, rngPick(state, pool));
}

function randomHex(state: BattleState, effect: EffectDescriptor, sourceId: string, targetIds: string[]): void {
  const src = state.combatants[sourceId];
  const grudgeDamage = src ? attackDamage(offenseStatOf(state, src, "attack"), GRUDGE_DAMAGE_RATIO) : 0;
  for (const id of targetIds) {
    const target = aliveUnit(state, id);
    if (!target) continue;
    const pool = RANDOM_HEX_POOL.filter((hex) => !target.statuses.some((status) => status.id === hex && status.stacks > 0));
    if (pool.length === 0) continue;
    const hex = rngPick(state, [...pool]);
    const data = hex === "grudge" ? { damage: grudgeDamage } : undefined;
    ops.applyStatus(state, id, hex, 1, effect.duration ?? 1, data, sourceId);
  }
}

export function applyHexStatusEffect(
  state: BattleState,
  effect: EffectDescriptor,
  sourceId: string,
  targetIds: string[],
  primaryId: string | undefined,
): void {
  switch (effect.type) {
    case "STEAL_BUFF":
      stealBuff(state, sourceId, primaryId);
      break;
    case "INHERIT_DEBUFFS":
      inheritDebuffs(state, targetIds, primaryId);
      break;
    case "GATHER_DEBUFFS":
      gatherDebuffs(state, primaryId);
      break;
    case "COPY_DEBUFF":
      copyDebuff(state, targetIds, primaryId);
      break;
    case "SWAP_CURSES":
      swapCurses(state, targetIds, primaryId);
      break;
    case "RANDOM_HEX":
      randomHex(state, effect, sourceId, targetIds);
      break;
  }
}
