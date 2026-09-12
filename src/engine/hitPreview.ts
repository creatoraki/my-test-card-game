import type { BattleState, Card, EffectDescriptor } from "./types";
import { cardCost, starlightPayment } from "./cost";
import { activeEffectsOf } from "./cardEffects";
import { counterOf } from "./counters";
import { conditionMet } from "./effects";
import { previewDamage } from "./ops";
import { addMod, attackDamage, hitChance, statOf } from "./stats";
import { RULES } from "./rules";
import { getStatusDef } from "./statuses";
import { CARD_MARK_DEFS } from "./cardMarks";
import { waterfallHolds } from "./waterfall";

// 本卡自带的「出牌期临时面板」(模组的 PLAY_STAT_BONUS)。
// ★ 预览必须把它算进去, 否则装了攻击力/穿甲/命中模组后预览数字与实际结果对不上。
function playStatBonusesOf(state: BattleState, card: Card, targetId?: string): EffectDescriptor[] {
  const markEffects = (card.marks ?? []).flatMap((markId) => CARD_MARK_DEFS[markId]?.preEffects ?? []);
  const owner = state.combatants[card.ownerCharId];
  const doublesWaterfall = Boolean(owner?.statuses.some(
    (status) => status.id === "gravityLens" && status.stacks > 0,
  ));
  return [...activeEffectsOf(card), ...markEffects].flatMap((effect) => {
    if (effect.type !== "PLAY_STAT_BONUS" || !effect.stat || !previewConditionMet(state, effect, card, targetId))
      return [];
    return effect.condition === "waterfall" && doublesWaterfall ? [effect, effect] : [effect];
  });
}

function previewConditionMet(
  state: BattleState,
  effect: EffectDescriptor,
  card: Card,
  targetId?: string,
): boolean {
  if (effect.condition === "waterfall") {
    const owner = state.combatants[card.ownerCharId];
    return waterfallHolds(state, card) || Boolean(owner?.statuses.some((status) => status.id === "zenithStar" && status.stacks > 0));
  }
  if (effect.condition === "fullyStarPaid") {
    const cost = cardCost(state, card);
    const spent = starlightPayment(state, card);
    return spent > 0 && spent === cost;
  }
  return conditionMet(state, effect, card, targetId ? [targetId] : undefined, targetId);
}

function playStatAmount(state: BattleState, card: Card, effect: EffectDescriptor): number {
  const scale = effect.scaleByCounter;
  if (!scale) return effect.amount ?? 0;
  const counter = scale.counter === "activeCardCost"
    ? cardCost(state, card)
    : scale.counter === "activeCardStarSpent"
      ? starlightPayment(state, card)
      : counterOf(state, scale.counter, card);
  let factor = counter * (scale.per ?? 1);
  if (scale.min != null) factor = Math.max(scale.min, factor);
  if (scale.max != null) factor = Math.min(scale.max, factor);
  return (effect.amount ?? 0) * factor;
}

// 把临时面板写进施放者 mods → 跑预览 → 原样撤回。
// ⚠ 刻意走 mods 而不是给 previewDamage 逐项开参数: 穿甲/命中/精准都藏在 statOf 后面,
//   逐项开口子要改的地方远比这一进一出多。整段同步执行, 结束后 state 与调用前完全一致。
function withPlayStatBonuses<T>(state: BattleState, card: Card, targetId: string | undefined, run: () => T): T {
  const attacker = state.combatants[card.ownerCharId];
  const bonuses = attacker ? playStatBonusesOf(state, card, targetId) : [];
  for (const effect of bonuses) addMod(attacker, effect.stat!, playStatAmount(state, card, effect), effect.pct ?? false);
  try {
    return run();
  } finally {
    for (const effect of bonuses) addMod(attacker, effect.stat!, -playStatAmount(state, card, effect), effect.pct ?? false);
  }
}

function firstDamageEffect(card: Card): EffectDescriptor | undefined {
  return activeEffectsOf(card).find((candidate) => candidate.type === "DAMAGE");
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

  return withPlayStatBonuses(state, card, targetId, () => hitChance(state, attacker, target, effect.hitBonus ?? 0));
}

// 返回命中后的单段确定性伤害; 暴击、格挡和护盾吸收不计入预览。
export function cardDamagePreview(state: BattleState, card: Card, targetId: string): number | null {
  const effect = firstDamageEffect(card);
  const attacker = state.combatants[card.ownerCharId];
  const target = state.combatants[targetId];
  if (!effect || !attacker || !target || !target.alive) return null;

  return withPlayStatBonuses(state, card, targetId, () => {
    const fixed = effect.amount != null;
    const rawBonusMult =
      effect.bonusMultiplierFrom && effect.bonusMultiplierPer != null
        ? counterOf(state, effect.bonusMultiplierFrom) * effect.bonusMultiplierPer
        : 0;
    const bonusMult = Math.min(effect.maxBonusMultiplier ?? Infinity, rawBonusMult);
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
