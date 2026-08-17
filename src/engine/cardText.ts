import type { Card, EffectDescriptor } from "./types";

export interface CardTextStats {
  attack: number;
  healPower: number;
}

// 显示的是减伤前的基础值。伤害在 ops.dealDamage 中还会经过暴击、防御、格挡和 Math.round，
// 因此说明文案无法预知最终实际掉血。
export function effectDisplayValue(
  effect: EffectDescriptor | undefined,
  stats: CardTextStats,
): number | null {
  if (!effect) return null;

  switch (effect.type) {
    case "DAMAGE":
      return effect.amount != null
        ? effect.amount
        : Math.round(stats.attack * (effect.multiplier ?? 1));
    case "HEAL":
    case "GAIN_SHIELD":
      return effect.multiplier != null
        ? Math.round(stats.healPower * effect.multiplier)
        : effect.amount ?? null;
    case "APPLY_STATUS":
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
export function renderCardText(card: Card, stats: CardTextStats): string {
  return card.text.replace(/\{(d|k)?(\d+|c)\}/g, (_match, kind: string | undefined, indexText: string) => {
    if (indexText === "c") {
      const left = card.cultivateLeft ?? card.cultivate?.turns;
      return left == null ? "?" : left === 0 ? "✔" : String(left);
    }
    const index = Number(indexText);
    const effects = kind === "d" ? card.onDiscard?.effects : kind === "k" ? card.cultivate?.effects : card.effects;
    const value = effectDisplayValue(effects?.[index], stats);
    return value == null ? "?" : String(value);
  });
}