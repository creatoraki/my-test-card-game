import type { Card, EffectDescriptor, StatBlock } from "./types";
import { attackDamage, healValue } from "./stats";
import { cardCost } from "./cost";
import { RULES } from "./rules";

export interface CardTextStats {
  attack: number;
  healPower: number;
  lowCostMastery: number;
  highCostMastery: number;
}

// 由属性换算出的展示值(层数 / 状态参数)。与 effects.sourceStatValue 同口径:
// 攻击力/治愈力都是 100 基准面板, 先 ÷ 各自的 divisor 再乘倍率; 其它属性卡面暂不支持。
function statScaledValue(stats: CardTextStats, stat: keyof StatBlock, multiplier: number): number {
  if (stat === "attack") return attackDamage(stats.attack, multiplier);
  if (stat === "healPower") return healValue(stats.healPower, multiplier);
  return 0;
}

// 显示的是减伤前的基础值。伤害在 ops.dealDamage 中还会经过暴击、防御、格挡和 Math.round，
// 因此说明文案无法预知最终实际掉血。
export function effectDisplayValue(
  effect: EffectDescriptor | undefined,
  stats: CardTextStats,
  selfStacks = 0,
): number | null {
  if (!effect) return null;

  switch (effect.type) {
    case "DAMAGE":
      return effect.amount != null
        ? effect.amount
        : Math.round(
            attackDamage(
              stats.attack,
              (effect.multiplier ?? 1) + (effect.bonusMultiplierPerSelfStack ?? 0) * selfStacks,
            ),
          );
    case "HEAL":
    case "GAIN_SHIELD":
      return effect.multiplier != null
        ? Math.round(healValue(stats.healPower, effect.multiplier))
        : effect.amount ?? null;
    case "APPLY_STATUS":
      if (effect.stacksFromStat)
        return Math.round(statScaledValue(stats, effect.stacksFromStat.stat, effect.stacksFromStat.multiplier));
      if (effect.statusDataFrom)
        return Math.round(statScaledValue(stats, effect.statusDataFrom.stat, effect.statusDataFrom.multiplier));
      return effect.amount ?? 0;
    case "APPLY_STAT_MOD":
    case "DRAW":
    case "GAIN_RESOURCE":
    case "DISCARD":
      return effect.amount ?? 0;
    default:
      return effect.amount ?? 0;
  }
}

// {0} 对应 effects[0]；{d0} 对应 onDiscard.effects[0]；{k0} 对应 cultivate.effects[0]。
export function renderCardText(card: Card, stats: CardTextStats, cost = cardCost(null, card)): string {
  const mastery =
    cost <= RULES.combat.lowCostApMax ? stats.lowCostMastery : stats.highCostMastery;
  const effectiveStats: CardTextStats = {
    ...stats,
    attack: stats.attack + mastery,
    healPower: stats.healPower + mastery,
  };
  return card.text.replace(/\{(d|k)?(\d+|c)\}/g, (_match, kind: string | undefined, indexText: string) => {
    if (indexText === "c") {
      const left = card.cultivateLeft ?? card.cultivate?.turns;
      return left == null ? "?" : left === 0 ? "✔" : String(left);
    }
    const index = Number(indexText);
    const effects = kind === "d" ? card.onDiscard?.effects : kind === "k" ? card.cultivate?.effects : card.effects;
    const value = effectDisplayValue(effects?.[index], effectiveStats, card.discardStacks ?? 0);
    return value == null ? "?" : String(value);
  });
}