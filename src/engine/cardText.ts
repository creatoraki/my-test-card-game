import type { CardDef, EffectDescriptor } from "./types";

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

// {0} 对应 effects[0]；{d0} 预留给 onDiscard.effects[0]。
export function renderCardText(card: CardDef, stats: CardTextStats): string {
  return card.text.replace(/\{(d?)(\d+)\}/g, (_match, discard: string, indexText: string) => {
    const index = Number(indexText);
    const effects = discard ? card.onDiscard?.effects : card.effects;
    const value = effectDisplayValue(effects?.[index], stats);
    return value == null ? "?" : String(value);
  });
}