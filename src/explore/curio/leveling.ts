// ============================================================================
// 物件等级 —— 同一份模板按等级放大奖励与惩罚。
// · curioAtLevel: 合并 3 级 / 5 级的手写覆写(3 级覆写对 3-4 级生效, 5 级对 5 级生效);
// · scaleEffect: 收益按 reward 倍率、惩罚按 penalty 倍率放大, 数量小数部分按概率进位。
// 奖励池的品质右移不在这里, 见 effects.ts 的 rollPoolItem。
// ============================================================================

import { CURIO_LEVEL_RULES } from "@/data/curios/levelRules";
import type { CurioDecision, CurioDef, CurioEffect, CurioLevel } from "@/data/curios/types";
import { rngFloat } from "@/engine/rng";
import type { ExploreState } from "../types";

function overrideFor(def: CurioDef, level: CurioLevel) {
  if (level >= 5 && def.levels?.[5]) return def.levels[5];
  if (level >= 3 && def.levels?.[3]) return def.levels[3];
  return undefined;
}

/** 某等级下实际生效的物件定义；没有覆写时原样返回。 */
export function curioAtLevel(def: CurioDef, level: CurioLevel): CurioDef {
  const override = overrideFor(def, level);
  if (!override) return def;
  const replace = override.replaceEffects ?? {};
  const decisions: CurioDecision[] = def.decisions.map((decision) => (
    replace[decision.id] ? { ...decision, effects: replace[decision.id] } : decision
  ));
  return {
    ...def,
    description: override.description ?? def.description,
    decisions: [...decisions, ...(override.extraDecisions ?? [])],
  };
}

/** 数量按倍率放大, 小数部分按概率进位, 至少保留 1。 */
function scaleCount(s: ExploreState, base: number, multiplier: number): number {
  if (base <= 0) return base;
  const raw = base * multiplier;
  const whole = Math.floor(raw);
  return Math.max(1, whole + (rngFloat(s) < raw - whole ? 1 : 0));
}

const scalePercent = (percent: number, multiplier: number) => Math.min(1, percent * multiplier);

/** 按等级缩放一条效果：收益按奖励倍率放大，伤害、污染、粒子损失按惩罚倍率放大。 */
export function scaleEffect(
  s: ExploreState,
  effect: CurioEffect,
  level: CurioLevel,
): CurioEffect {
  const rule = CURIO_LEVEL_RULES[level];
  const mul = rule.reward;
  if (rule.reward === 1 && rule.penalty === 1) return effect;
  switch (effect.type) {
    case "GAIN_POOL_ITEM":
      return { ...effect, count: scaleCount(s, effect.count, mul) };
    case "GAIN_ITEM":
      return { ...effect, count: scaleCount(s, effect.count ?? 1, mul) };
    case "MODIFY_ENERGY":
      // 粒子补给按奖励放大, 粒子损失按惩罚放大。
      return { ...effect, amount: Math.round(effect.amount * (effect.amount >= 0 ? rule.reward : rule.penalty)) };
    case "HEAL_PARTY":
    case "HEAL_ONE":
      return { ...effect, percent: scalePercent(effect.percent, rule.reward) };
    case "HEAL_LIMIT_ONE":
      return { ...effect, percent: scalePercent(effect.percent ?? 0, rule.reward) };
    case "GAIN_EXP_PARTY":
      return { ...effect, amount: Math.round(effect.amount * rule.reward) };
    case "DAMAGE_MEMBER_PERCENT":
      return { ...effect, percent: scalePercent(effect.percent, rule.penalty) };
    case "ADJUST_POLLUTION":
      // 净化(负数)是奖励, 污染(正数)是惩罚。
      return { ...effect, amount: Math.round(effect.amount * (effect.amount < 0 ? rule.reward : rule.penalty)) };
    default:
      return effect;
  }
}

export function scaleEffects(
  s: ExploreState,
  effects: readonly CurioEffect[],
  level: CurioLevel,
): CurioEffect[] {
  return effects.map((effect) => scaleEffect(s, effect, level));
}
