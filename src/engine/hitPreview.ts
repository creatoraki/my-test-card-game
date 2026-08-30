import type { BattleState, Card, EffectDescriptor } from "./types";
import { cardCost } from "./cost";
import { cultivateReady } from "./cultivate";
import { previewDamage } from "./ops";
import { attackDamage, hitChance, statOf } from "./stats";
import { RULES } from "./rules";

function firstDamageEffect(card: Card): EffectDescriptor | undefined {
  const cultivated = cultivateReady(card) && card.cultivate?.mode === "replace";
  const activeEffects = cultivated ? card.cultivate?.effects ?? [] : card.effects;
  return [
    ...activeEffects,
    ...(card.keywords?.flatMap((keyword) => keyword.effects) ?? []),
  ].find((candidate) => candidate.type === "DAMAGE");
}

function counterOf(state: BattleState, source: NonNullable<EffectDescriptor["bonusMultiplierFrom"]>): number {
  if (source === "discardsThisRound") return state.discardsThisRound;
  if (source === "lastDiscardBatch") return state.lastDiscardBatch;
  if (source === "discardsThisBattle") return state.discardsThisBattle;
  if (source === "lastDiscardBatchFast") return state.lastDiscardBatchFast;
  if (source === "lastRecoverBatchFast") return state.lastRecoverBatchFast;
  if (source === "fastPlaysThisRound")
    return state.playedThisRound.filter((played) => played.cardType === "fast").length;
  return state.playedThisRound.length;
}

function cardAttack(state: BattleState, card: Card): number {
  const attacker = state.combatants[card.ownerCharId];
  if (!attacker) return 0;
  const cost = cardCost(state, card);
  const mastery = cost <= RULES.combat.lowCostApMax ? "lowCostMastery" : "highCostMastery";
  return statOf(attacker, "attack") + statOf(attacker, mastery);
}

// 预览卡牌的第一个 DAMAGE 效果; 多段 DAMAGE 的徽章按第一个效果显示。
// 返回百分点; null 表示没有命中判定或当前目标不可预览。
export function cardHitChance(state: BattleState, card: Card, targetId: string): number | null {
  const effect = firstDamageEffect(card);

  if (!effect || effect.flags?.includes("mustHit")) return null;

  const attacker = state.combatants[card.ownerCharId];
  const target = state.combatants[targetId];
  if (!attacker || !target || !target.alive) return null;

  return hitChance(state, attacker, target, effect.hitBonus ?? 0);
}

// 返回命中后的单段确定性伤害; 暴击、格挡和护盾吸收不计入预览。
export function cardDamagePreview(state: BattleState, card: Card, targetId: string): number | null {
  const effect = firstDamageEffect(card);
  const attacker = state.combatants[card.ownerCharId];
  const target = state.combatants[targetId];
  if (!effect || !attacker || !target || !target.alive) return null;

  const fixed = effect.amount != null;
  const bonusMult =
    effect.bonusMultiplierFrom && effect.bonusMultiplierPer != null
      ? counterOf(state, effect.bonusMultiplierFrom) * effect.bonusMultiplierPer
      : 0;
  const baseMultiplier = (effect.multiplier ?? 1) + bonusMult;
  const targetHasShield = target.shield > 0;
  const bonusApplies =
    !fixed &&
    effect.damageBonus &&
    ((effect.damageBonus.when === "targetHasShield" && targetHasShield) ||
      (effect.damageBonus.when === "targetHasNoShield" && !targetHasShield));
  const aimedBonus =
    effect.aimedMultiplier != null && target.statuses.some((status) => status.id === "aimed")
      ? effect.aimedMultiplier
      : baseMultiplier;
  const damageMultiplier = bonusApplies ? aimedBonus + effect.damageBonus!.multiplier : aimedBonus;
  const valueMultiplier = 1 + state.playValueBonusPct / 100;
  const rawDamage = fixed
    ? (effect.amount ?? 0) * (1 + bonusMult) * valueMultiplier
    : attackDamage(cardAttack(state, card), damageMultiplier) * valueMultiplier;

  return previewDamage(state, attacker.id, target.id, rawDamage, {
    isAttack: true,
    fixed,
    flags: effect.flags,
  });
}