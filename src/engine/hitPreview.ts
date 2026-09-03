import type { BattleState, Card, CounterSource, EffectDescriptor } from "./types";
import { cardCost } from "./cost";
import { cultivateReady } from "./cultivate";
import { conditionMet } from "./effects";
import { previewDamage } from "./ops";
import { addMod, attackDamage, hitChance, statOf } from "./stats";
import { RULES } from "./rules";
import { getStatusDef } from "./statuses";

// 本卡自带的「出牌期临时面板」(模组的 PLAY_STAT_BONUS)。
// ★ 预览必须把它算进去, 否则装了攻击力/穿甲/命中模组后预览数字与实际结果对不上。
function playStatBonusesOf(state: BattleState, card: Card): EffectDescriptor[] {
  const cultivated = cultivateReady(card) && card.cultivate?.mode === "replace";
  const activeEffects = cultivated ? card.cultivate?.effects ?? [] : card.effects;
  return [
    ...activeEffects,
    ...(card.keywords?.flatMap((keyword) => keyword.effects) ?? []),
  ].filter((effect) => effect.type === "PLAY_STAT_BONUS" && effect.stat && conditionMet(state, effect));
}

// 把临时面板写进施放者 mods → 跑预览 → 原样撤回。
// ⚠ 刻意走 mods 而不是给 previewDamage 逐项开参数: 穿甲/命中/精准都藏在 statOf 后面,
//   逐项开口子要改的地方远比这一进一出多。整段同步执行, 结束后 state 与调用前完全一致。
function withPlayStatBonuses<T>(state: BattleState, card: Card, run: () => T): T {
  const attacker = state.combatants[card.ownerCharId];
  const bonuses = attacker ? playStatBonusesOf(state, card) : [];
  for (const effect of bonuses) addMod(attacker, effect.stat!, effect.amount ?? 0, effect.pct ?? false);
  try {
    return run();
  } finally {
    for (const effect of bonuses) addMod(attacker, effect.stat!, -(effect.amount ?? 0), effect.pct ?? false);
  }
}

function firstDamageEffect(card: Card): EffectDescriptor | undefined {
  const cultivated = cultivateReady(card) && card.cultivate?.mode === "replace";
  const activeEffects = cultivated ? card.cultivate?.effects ?? [] : card.effects;
  return [
    ...activeEffects,
    ...(card.keywords?.flatMap((keyword) => keyword.effects) ?? []),
  ].find((candidate) => candidate.type === "DAMAGE");
}

function counterOf(state: BattleState, source: CounterSource): number {
  if (source === "discardsThisRound") return state.discardsThisRound;
  if (source === "lastDiscardBatch") return state.lastDiscardBatch;
  if (source === "discardsThisBattle") return state.discardsThisBattle;
  if (source === "lastDiscardBatchFast") return state.lastDiscardBatchFast;
  if (source === "lastRecoverBatchFast") return state.lastRecoverBatchFast;
  if (source === "lastDiscardBatchCost") return state.lastDiscardBatchCost;
  if (source === "lastConvertBatch") return state.lastConvertBatch;
  if (source === "squadBuffCount") return state.squadBuffs.length;
  if (source === "lastSquadBuffConsumed") return state.lastSquadBuffConsumed;
  if (source === "lastConsumedStatusStacks") return state.lastConsumedStatusStacks;
  if (source === "lastRemovedStatusCount") return state.lastRemovedStatusCount;
  if (source === "activeCardResonance") return state.activeCardResonance;
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

  return withPlayStatBonuses(state, card, () => hitChance(state, attacker, target, effect.hitBonus ?? 0));
}

// 返回命中后的单段确定性伤害; 暴击、格挡和护盾吸收不计入预览。
export function cardDamagePreview(state: BattleState, card: Card, targetId: string): number | null {
  const effect = firstDamageEffect(card);
  const attacker = state.combatants[card.ownerCharId];
  const target = state.combatants[targetId];
  if (!effect || !attacker || !target || !target.alive) return null;

  return withPlayStatBonuses(state, card, () => {
    const fixed = effect.amount != null;
    const bonusMult =
      effect.bonusMultiplierFrom && effect.bonusMultiplierPer != null
        ? counterOf(state, effect.bonusMultiplierFrom) * effect.bonusMultiplierPer
        : 0;
      const valueScale = effect.scaleByCounter
        ? Math.min(
            effect.scaleByCounter.max ?? Infinity,
            Math.max(
              effect.scaleByCounter.min ?? -Infinity,
              counterOf(state, effect.scaleByCounter.counter) * (effect.scaleByCounter.per ?? 1),
            ),
          )
        : 1;
    const baseMultiplier = (effect.multiplier ?? 1) + bonusMult;
    const targetHasShield = target.shield > 0;
    const bonusApplies =
      !fixed &&
      effect.damageBonus &&
      ((effect.damageBonus.when === "targetHasShield" && targetHasShield) ||
        (effect.damageBonus.when === "targetHasNoShield" && !targetHasShield) ||
        (effect.damageBonus.when === "targetHpBelowPct" && target.hp / target.maxHp * 100 < (effect.damageBonus.value ?? 0)) ||
        (effect.damageBonus.when === "targetHasDebuff" && target.statuses.some((status) => getStatusDef(status.id)?.kind === "debuff" && status.stacks > 0)));
    const aimedBonus =
      effect.aimedMultiplier != null && target.statuses.some((status) => status.id === "aimed")
        ? effect.aimedMultiplier
        : baseMultiplier;
    const damageMultiplier = bonusApplies ? aimedBonus + effect.damageBonus!.multiplier : aimedBonus;
    const valueMultiplier = 1 + state.playValueBonusPct / 100;
    const rawDamage = fixed
      ? (effect.amount ?? 0) * (1 + bonusMult) * valueMultiplier * valueScale
      : attackDamage(cardAttack(state, card), damageMultiplier) * valueMultiplier * valueScale;

    return previewDamage(state, attacker.id, target.id, rawDamage, {
      isAttack: true,
      fixed,
      flags: effect.flags,
    });
  });
}