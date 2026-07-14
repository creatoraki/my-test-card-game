// ============================================================================
// 效果解释器 —— 把声明式 EffectDescriptor 翻译成引擎原语调用。
// 卡牌和敌人招式共用这套。新增机制 = 在 applyEffect 的 switch 里加一个分支。
// ============================================================================

import type { BattleState, EffectDescriptor } from "./types";
import { ops } from "./ops";
import { drawCards } from "./deck";
import { alliesOf, foesOf } from "./targeting";
import { rngPick } from "./rng";

// 解析单条效果作用到哪些单位(相对施放者)
export function resolveTargets(
  state: BattleState,
  effect: EffectDescriptor,
  sourceId: string,
  primaryId: string | undefined,
): string[] {
  const src = state.combatants[sourceId];
  const t = effect.target ?? "primary";
  switch (t) {
    case "primary":
      return primaryId && state.combatants[primaryId]?.alive ? [primaryId] : [];
    case "self":
      return src?.alive ? [sourceId] : [];
    case "allFoes":
      return foesOf(state, src).map((c) => c.id);
    case "allAllies":
      return alliesOf(state, src).map((c) => c.id);
    case "randomFoe": {
      const foes = foesOf(state, src);
      return foes.length ? [rngPick(state, foes).id] : [];
    }
    case "randomAlly": {
      const allies = alliesOf(state, src);
      return allies.length ? [rngPick(state, allies).id] : [];
    }
    default:
      return [];
  }
}

function applyEffect(
  state: BattleState,
  effect: EffectDescriptor,
  sourceId: string,
  targetIds: string[],
): void {
  const amount = effect.amount ?? 0;
  const unblockable = effect.flags?.includes("unblockable");
  switch (effect.type) {
    case "DAMAGE":
      for (const id of targetIds)
        ops.dealDamage(state, sourceId, id, amount, {
          isAttack: true,
          flags: effect.flags,
          unblockable,
        });
      break;
    case "GAIN_BLOCK":
      for (const id of targetIds) ops.gainBlock(state, id, amount);
      break;
    case "HEAL":
      for (const id of targetIds) ops.heal(state, id, amount);
      break;
    case "APPLY_STATUS":
      for (const id of targetIds) ops.applyStatus(state, id, effect.status!, effect.stacks ?? 0);
      break;
    case "MODIFY_THREAT":
      for (const id of targetIds) ops.modifyThreat(state, id, amount);
      break;
    case "DRAW":
      drawCards(state, amount);
      break;
    case "GAIN_RESOURCE": {
      const res = effect.resource ?? "mana";
      state.resources[res] = (state.resources[res] ?? 0) + amount;
      ops.log(state, `✨ 获得 ${amount} 点${res === "mana" ? "法力水晶" : res}`);
      break;
    }
  }
}

// 依次结算一张卡 / 一个招式的所有效果。
export function resolveEffects(
  state: BattleState,
  effects: EffectDescriptor[],
  sourceId: string,
  primaryId: string | undefined,
): void {
  for (const effect of effects) {
    const targets = resolveTargets(state, effect, sourceId, primaryId);
    applyEffect(state, effect, sourceId, targets);
  }
}
