// 羁绊对目标的改写:
//   女祭司 9 —— 本回合第一张单体治疗牌, 其「治疗主目标」的效果改为作用于全队(出牌期标记见 behaviors/bulwark)。
//   皇帝 8   —— 敌人本回合第一次全体攻击, 改为只打当前生命最高的队友(由 enemy/ai 在出招前调用)。

import type { BattleState, EffectDescriptor, Enemy } from "../types";
import { log } from "../core/ops";
import { aliveAllies, hasBondTier, isAlly } from "./bondState";

export function bondRetarget(
  state: BattleState,
  effect: EffectDescriptor,
  sourceId: string,
  targets: string[],
): string[] {
  if (!state.bond?.play.healAll || effect.type !== "HEAL" || (effect.target ?? "primary") !== "primary") return targets;
  if (!isAlly(state, sourceId)) return targets;
  return aliveAllies(state).map((ally) => ally.id);
}

/**
 * 皇帝 8: 招式是「纯全体攻击」(含伤害、没有指向主目标的效果)时, 把全体目标收束为生命最高的队友。
 * 返回改写后的效果与主目标; 不改写时返回 null。
 */
export function emperorCollapse(
  state: BattleState,
  enemy: Enemy,
  effects: EffectDescriptor[],
): { effects: EffectDescriptor[]; primaryId: string } | null {
  if (!state.bond || !hasBondTier(state, "emperor", 2) || state.bond.round.emperorAoeUsed) return null;
  const aoeDamage = effects.some((effect) => effect.type === "DAMAGE" && effect.target === "allFoes");
  const hasPrimary = effects.some((effect) => (effect.target ?? "primary") === "primary");
  if (!aoeDamage || hasPrimary) return null;
  const guard = aliveAllies(state).sort((a, b) => b.hp - a.hp)[0];
  if (!guard) return null;
  state.bond.round.emperorAoeUsed = true;
  log(state, `皇帝·王座：${enemy.name} 的全体攻击被 ${guard.name} 独自承下`);
  return {
    effects: effects.map((effect) => (effect.target === "allFoes" ? { ...effect, target: "primary" } : effect)),
    primaryId: guard.id,
  };
}
