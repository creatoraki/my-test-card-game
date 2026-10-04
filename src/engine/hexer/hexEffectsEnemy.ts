// 咒术师效果: 敌人行动点(喂 / 抽 / 换)、操纵攻击、即死。从 hexEffects.ts 分发进来。

import type { BattleState, EffectDescriptor, Enemy } from "../types";
import { ops } from "../core/ops";
import { attackDamage, statOf } from "../combat/stats";
import { isBossEnemyDefId } from "@/data";

function enemyOf(state: BattleState, id: string | undefined): Enemy | undefined {
  const unit = id ? state.combatants[id] : undefined;
  return unit?.alive && unit.team === "enemy" ? (unit as Enemy) : undefined;
}

export function isBossUnit(state: BattleState, id: string): boolean {
  const enemy = enemyOf(state, id);
  return enemy ? isBossEnemyDefId(enemy.enemyDefId) : false;
}

// 饲咒: 只加行动点, 不让敌人立即行动, 也不改变正在蓄力的招式。
function gainEnemyAp(state: BattleState, effect: EffectDescriptor, targetIds: string[]): void {
  const amount = Math.max(0, Math.floor(effect.amount ?? 0));
  if (amount <= 0) return;
  for (const id of targetIds) {
    const enemy = enemyOf(state, id);
    if (!enemy) continue;
    enemy.ap += amount;
    ops.log(state, `${enemy.emoji} ${enemy.name} 获得 ${amount} 点行动点`);
  }
}

function drainEnemyAp(state: BattleState, effect: EffectDescriptor, targetIds: string[]): void {
  const cap = Math.max(0, Math.floor(effect.amount ?? 0));
  let drained = 0;
  for (const id of targetIds) {
    const enemy = enemyOf(state, id);
    if (!enemy) continue;
    const removed = Math.min(cap, Math.max(0, enemy.ap));
    if (removed <= 0) continue;
    enemy.ap -= removed;
    drained += removed;
    ops.log(state, `${enemy.emoji} ${enemy.name} 被抽走 ${removed} 点行动点`);
  }
  state.lastDrainedAp = drained;
}

// 主目标与解析出的另一名敌人交换行动点; 双方当前蓄力的招式不变。
function swapEnemyAp(state: BattleState, targetIds: string[], primaryId: string | undefined): void {
  const primary = enemyOf(state, primaryId);
  const other = enemyOf(state, targetIds.find((id) => id !== primaryId));
  if (!primary || !other) return;
  [primary.ap, other.ap] = [other.ap, primary.ap];
  ops.log(state, `${primary.name} 与 ${other.name} 交换了行动点`);
}

// 操纵: 主目标按自身攻击力 × 倍率攻击解析出的目标; 没有其他目标时打自己。
function puppetStrike(state: BattleState, effect: EffectDescriptor, targetIds: string[], primaryId: string | undefined): void {
  const puppet = enemyOf(state, primaryId);
  if (!puppet) return;
  const victimId = targetIds.find((id) => id !== puppet.id && state.combatants[id]?.alive) ?? puppet.id;
  const amount = attackDamage(statOf(puppet, "attack"), effect.multiplier ?? 1);
  ops.log(state, `${puppet.emoji} ${puppet.name} 被咒丝牵引，攻击了${victimId === puppet.id ? "自己" : state.combatants[victimId].name}`);
  ops.dealDamage(state, puppet.id, victimId, amount, { isAttack: true, single: true });
}

function execute(state: BattleState, effect: EffectDescriptor, targetIds: string[]): void {
  for (const id of targetIds) {
    const enemy = enemyOf(state, id);
    if (!enemy) continue;
    const threshold = isBossEnemyDefId(enemy.enemyDefId) ? effect.executeBossPct ?? 0 : effect.executePct ?? 0;
    if (enemy.hp > enemy.maxHp * threshold) continue;
    ops.log(state, `☠️ ${enemy.name} 被咒杀`);
    ops.loseHp(state, id, enemy.hp);
  }
}

export function applyHexEnemyEffect(
  state: BattleState,
  effect: EffectDescriptor,
  targetIds: string[],
  primaryId: string | undefined,
): void {
  switch (effect.type) {
    case "GAIN_ENEMY_AP":
      gainEnemyAp(state, effect, targetIds);
      break;
    case "DRAIN_ENEMY_AP":
      drainEnemyAp(state, effect, targetIds);
      break;
    case "SWAP_ENEMY_AP":
      swapEnemyAp(state, targetIds, primaryId);
      break;
    case "PUPPET_STRIKE":
      puppetStrike(state, effect, targetIds, primaryId);
      break;
    case "EXECUTE":
      execute(state, effect, targetIds);
      break;
  }
}
