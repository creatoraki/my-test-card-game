import type { EffectDescriptor } from "../types";
import type { CardTextStats } from "./cardText";
import { attackDamage, healValue } from "../combat/stats";

export function effectTextScale(effect?: EffectDescriptor): { stat: "attack" | "healPower"; multiplier: number } | undefined {
  if (!effect) return;
  const scale = effect.stacksFromStat ?? effect.statusDataFrom;
  if (scale?.stat === "attack" || scale?.stat === "healPower") return { stat: scale.stat, multiplier: scale.multiplier };
  if (effect.multiplier == null) return;
  if (effect.type === "DAMAGE" && effect.amount == null) return { stat: "attack", multiplier: effect.multiplier };
  if (["HEAL", "GAIN_SHIELD", "RESTORE_HP_LIMIT", "INDEMNITY_HEAL"].includes(effect.type))
    return { stat: "healPower", multiplier: effect.multiplier };
}

// 内部标记由卡牌富文本组件消费，分别保存具体值与原始倍率。
export function dynamicText(value: number, stat: "attack" | "healPower", multiplier: number): string {
  const percent = Math.round(multiplier * 10000) / 100;
  return `⟦${value}|${percent}%${stat === "attack" ? "攻击力" : "治愈力"}⟧`;
}

export function inlineStatText(text: string, stats: CardTextStats, rich: boolean): string {
  return text.replace(/(?:相当于)?(攻击力|治愈力)\s*(?:的\s*)?(\d+(?:\.\d+)?)%|([\d.]+)%\s*(攻击力|治愈力)(?:的)?/g,
    (match, before: string | undefined, beforePercent: string | undefined, afterPercent: string | undefined, after: string | undefined, offset: number) => {
      // 操纵牌取敌人的属性，不能拿出牌者的攻击力代替。
      if (text.slice(Math.max(0, offset - 4), offset).endsWith("自身")) return match;
      const stat = (before ?? after) === "攻击力" ? "attack" : "healPower";
      const multiplier = Number(beforePercent ?? afterPercent) / 100;
      const value = Math.round(stat === "attack" ? attackDamage(stats.attack, multiplier) : healValue(stats.healPower, multiplier));
      return rich ? dynamicText(value, stat, multiplier) : String(value);
    });
}
