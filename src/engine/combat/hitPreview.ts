import type { BattleState, Card, EffectDescriptor } from "../types";
import { cardCost, starlightPayment } from "../cards/cost";
import { activeEffectsOf } from "../cards/cardEffects";
import { counterOf } from "./counters";
import { conditionMet } from "../effects/effects";
import { previewDamage } from "../damage";
import { addMod, attackDamage, damageMasteryOf, hitChance, statOf } from "./stats";
import { RULES } from "../core/battleRules";
import { getStatusDef } from "../statuses";
import { CARD_MARK_DEFS } from "../cards/cardMarks";
import { waterfallWouldTrigger } from "../battle/waterfall";
import { graftBonusPct } from "../battle/cultivatePlay";
import { pierceOf } from "./pierce";

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
    if (effect.boostSource === "fullDraw" && !willFullDraw(state, card, targetId)) return [];
    return effect.condition === "waterfall" && doublesWaterfall ? [effect, effect] : [effect];
  });
}

function willFullDraw(state: BattleState, card: Card, targetId?: string): boolean {
  if (!card.volley) return false;
  const ids = card.targeting === "allFoes"
    ? targetId ? [targetId] : state.enemyIds.filter((id) => state.combatants[id]?.alive)
    : targetId ? [targetId] : [];
  return ids.some((id) => pierceOf(state, id) >= card.volley!.threshold);
}

function previewPierceStacks(state: BattleState, card: Card, targetId: string): number {
  const current = pierceOf(state, targetId);
  if (!card.volley || !willFullDraw(state, card, targetId)) return current;
  const halfDraw = state.playerIds.some((id) =>
    state.combatants[id]?.alive && state.combatants[id].statuses.some(
      (status) => status.id === "halfDraw" && status.stacks > 0,
    ),
  );
  const removed = halfDraw
    ? Math.ceil(card.volley.threshold / 2)
    : card.volley.consumeAll ? current : card.volley.threshold;
  return Math.max(0, current - removed);
}

function previewConditionMet(
  state: BattleState,
  effect: EffectDescriptor,
  card: Card,
  targetId?: string,
): boolean {
  if (effect.condition === "waterfall") return waterfallWouldTrigger(state, card);
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

// 带条件的互斥伤害(蒺藜箭 / 汲血蔓)按当前目标判定; 计数源读 activeCardPrimaryId, 预览期间临时写入后原样撤回。
function previewDamageConditionMet(state: BattleState, effect: EffectDescriptor, card: Card, targetId?: string): boolean {
  if (!effect.condition) return true;
  const previousPrimary = state.activeCardPrimaryId;
  state.activeCardPrimaryId = targetId ?? previousPrimary;
  try {
    return previewConditionMet(state, effect, card, targetId);
  } finally {
    state.activeCardPrimaryId = previousPrimary;
  }
}

function firstDamageEffect(state: BattleState, card: Card, targetId?: string): EffectDescriptor | undefined {
  const fullDraw = willFullDraw(state, card, targetId);
  const candidates = activeEffectsOf(card).filter((candidate) =>
    candidate.type === "DAMAGE" &&
    (!candidate.fullDraw || (candidate.fullDraw === "hit" ? fullDraw : !fullDraw)),
  );
  // 没有任何分支满足条件时仍按第一个伤害预览, 保持旧口径(单条件伤害牌照常显示命中徽章)。
  return candidates.find((candidate) => previewDamageConditionMet(state, candidate, card, targetId)) ?? candidates[0];
}

function cardAttack(state: BattleState, card: Card, targetId?: string): number {
  const attacker = state.combatants[card.ownerCharId];
  if (!attacker) return 0;
  const target = targetId ? state.combatants[targetId] : undefined;
  const cost = cardCost(state, card);
  const mastery = cost <= RULES.combat.lowCostApMax ? "lowCostMastery" : "highCostMastery";
  return statOf(attacker, "attack") + statOf(attacker, mastery) + damageMasteryOf(state, attacker, target, card.cardType);
}

// 预览卡牌的第一个 DAMAGE 效果; 多段 DAMAGE 的徽章按第一个效果显示。
// 返回百分点; null 表示没有命中判定或当前目标不可预览。
export function cardHitChance(state: BattleState, card: Card, targetId: string): number | null {
  const effect = firstDamageEffect(state, card, targetId);

  if (!effect || effect.flags?.includes("mustHit")) return null;

  const attacker = state.combatants[card.ownerCharId];
  const target = state.combatants[targetId];
  if (!attacker || !target || !target.alive) return null;

  return withPlayStatBonuses(state, card, targetId, () => hitChance(state, attacker, target, effect.hitBonus ?? 0));
}

// 返回命中后的单段确定性伤害; 暴击、格挡和护盾吸收不计入预览。
export function cardDamagePreview(state: BattleState, card: Card, targetId: string): number | null {
  const effect = firstDamageEffect(state, card, targetId);
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
    let damageBonus = 0;
    if (!fixed && effect.damageBonus) {
      const bonus = effect.damageBonus;
      if (
        (bonus.when === "targetHasShield" && targetHasShield) ||
        (bonus.when === "targetHasNoShield" && !targetHasShield) ||
        (bonus.when === "targetHpBelowPct" && target.hp / target.maxHp * 100 < (bonus.value ?? 0)) ||
        (bonus.when === "targetHasDebuff" && target.statuses.some((status) => getStatusDef(status.id)?.kind === "debuff" && status.stacks > 0)) ||
        (bonus.when === "targetHasStatus" && Boolean(bonus.status) && target.statuses.some((status) => status.id === bonus.status && status.stacks > 0))
      ) damageBonus = bonus.multiplier;
      if (bonus.when === "perStatusStack") {
        const count = bonus.status === "pierce"
          ? previewPierceStacks(state, card, targetId)
          : bonus.status
          ? target.statuses.find((status) => status.id === bonus.status)?.stacks ?? 0
          : target.statuses.reduce((sum, status) => sum + status.stacks, 0);
        damageBonus = count * bonus.multiplier;
      }
    }
    const damageMultiplier = baseMultiplier + damageBonus;
    const fullDrawBonus = activeEffectsOf(card)
      .filter((candidate) => candidate.type === "VALUE_BOOST" && candidate.boostSource === "fullDraw" && willFullDraw(state, card, targetId))
      .reduce((sum, candidate) => sum + (candidate.boostPct ?? 0), 0);
    const valueMultiplier = 1 + (state.playValueBonusPct + graftBonusPct(state, card) + fullDrawBonus) / 100;
    const rawDamage = fixed
      ? (effect.amount ?? 0) * (1 + bonusMult) * valueMultiplier * valueScale
      : attackDamage(cardAttack(state, card, targetId), damageMultiplier) * valueMultiplier * valueScale;

    return previewDamage(state, attacker.id, target.id, rawDamage, {
      isAttack: true,
      fixed,
      flags: effect.flags,
    });
  });
}
