// ============================================================================
// 效果解释器 —— 把声明式 EffectDescriptor 翻译成引擎原语调用。
// 卡牌和敌人招式共用这套。新增机制 = 在 applyEffect 的 switch 里加一个分支。
// ============================================================================

import type { BattleState, EffectDescriptor } from "./types";
import { ops } from "./ops";
import { statOf } from "./stats";
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
  const mustHit = effect.flags?.includes("mustHit");
  const src = state.combatants[sourceId];
  switch (effect.type) {
    case "DAMAGE": {
      // amount 与 multiplier 二选一(见 types.EffectDescriptor):
      //   写了 amount   ⇒ 固定伤害, 不用攻击力, 不吃防御与格挡
      //   写了 multiplier ⇒ 攻击力 × 倍率, 走完整管线
      const fixed = effect.amount != null;
      const dmg = fixed ? amount : statOf(src, "attack") * (effect.multiplier ?? 1);
      for (const id of targetIds)
        ops.dealDamage(state, sourceId, id, dmg, {
          isAttack: true,
          fixed,
          mustHit,
          flags: effect.flags,
          unblockable,
        });
      break;
    }
    case "GAIN_SHIELD": {
      // amount = 固定基础护盾; multiplier = 治愈力 × 倍率。护盾强度仍在 ops 里结算。
      const shield = effect.multiplier != null ? statOf(src, "healPower") * effect.multiplier : amount;
      for (const id of targetIds) ops.gainShield(state, sourceId, id, shield);
      break;
    }
    case "HEAL": {
      // amount = 固定基础治疗; multiplier = 治愈力 × 倍率。治愈强度仍在 ops 里结算。
      const scaled = effect.multiplier != null;
      const healing = scaled ? statOf(src, "healPower") * effect.multiplier! : amount;
      for (const id of targetIds) ops.heal(state, sourceId, id, healing, { scaled });
      break;
    }
    case "APPLY_STATUS":
      for (const id of targetIds) ops.applyStatus(state, id, effect.status!, effect.stacks ?? 0);
      break;
    case "APPLY_STAT_MOD":
      for (const id of targetIds)
        ops.applyStatMod(state, id, effect.stat!, amount, effect.pct ?? false);
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
