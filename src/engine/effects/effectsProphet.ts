// 预言家专属效果 —— 从 effects.ts 拆出: 打出预言、推迟敌人招式。

import type { BattleState, EffectDescriptor, Enemy } from "../types";
import { ops } from "../core/ops";
import { startProphecy } from "../prophecy/prophecyState";

function delayEnemyActs(state: BattleState, effect: EffectDescriptor, targetIds: string[]): void {
  const amount = Math.max(0, Math.floor(effect.amount ?? 1));
  if (amount <= 0) return;
  for (const id of targetIds) {
    const enemy = state.combatants[id];
    if (!enemy?.alive || enemy.team !== "enemy") continue;
    const target = enemy as Enemy;
    if (target.nextActTick == null) continue;
    target.nextActTick += amount;
    ops.log(state, `${target.emoji} ${target.name} 的${target.intent.name}推迟 ${amount} 时刻`);
  }
}

export function applyProphetEffect(
  state: BattleState,
  effect: EffectDescriptor,
  sourceId: string,
  targetIds: string[],
  primaryId: string | undefined,
): void {
  if (effect.type === "START_PROPHECY") {
    if (effect.prophecy) startProphecy(state, sourceId, effect.prophecy, targetIds[0] ?? primaryId);
    return;
  }
  if (effect.type === "DELAY_ENEMY_ACT") delayEnemyActs(state, effect, targetIds);
}
