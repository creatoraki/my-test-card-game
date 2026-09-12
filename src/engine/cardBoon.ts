import type { BattleState, Card, EffectDescriptor } from "./types";
import { cardCost, starlightPayment } from "./cost";
import { activeEffectsOf } from "./cardEffects";
import { conditionMet } from "./effects";
import { counterOf } from "./counters";
import { cultivateReady } from "./cultivate";
import { isPassive } from "./passive";
import { waterfallHolds } from "./waterfall";

export type CardBoonId =
  | "cultivate"
  | "cheaper"
  | "starPay"
  | "resonance"
  | "selfStack"
  | "waterfall"
  | "counter"
  | "condition";

// 回合开始时天然成立 ⇒ 全场手牌一起闪, 激活态会贬值; waterfall 另走专项判定
// (state.waterfallPlay 只在 playCard 里写, 手牌阶段读到的是上一张牌的残留);
// eventTargetHasStatus 只在被动结算窗口内有意义。
const IDLE_CONDITIONS: readonly string[] = [
  "waterfall",
  "noPlaysThisRound",
  "noFastPlaysThisRound",
  "counterBelow",
  "eventTargetHasStatus",
  "targetNotAttackedThisRound",
] as const;

function hasCondition(effect: EffectDescriptor): boolean {
  return effect.condition != null && !IDLE_CONDITIONS.includes(effect.condition);
}

function counterScaledValue(state: BattleState, card: Card, effect: EffectDescriptor): number | null {
  if (!effect.scaleByCounter) return null;
  const { counter, per = 1, min, max } = effect.scaleByCounter;
  let value = counterOf(state, counter, card) * per;
  if (min != null) value = Math.max(min, value);
  if (max != null) value = Math.min(max, value);
  return value;
}

function hasCounterBoon(state: BattleState, card: Card, effects: EffectDescriptor[]): boolean {
  return effects.some((effect) => {
    if (effect.condition != null && !conditionMet(state, effect, card)) return false;
    if (
      effect.bonusMultiplierFrom &&
      (effect.bonusMultiplierPer ?? 0) > 0 &&
      counterOf(state, effect.bonusMultiplierFrom, card) > 0
    )
      return true;
    if (
      effect.hitsFrom && counterOf(state, effect.hitsFrom, card) > 0
    )
      return true;
    if (
      effect.bonusHitsFrom && counterOf(state, effect.bonusHitsFrom, card) > 0
    )
      return true;
    if (effect.stacksFrom && counterOf(state, effect.stacksFrom, card) > 0) return true;
    if (effect.amountFrom && counterOf(state, effect.amountFrom, card) > 0) return true;
    return (counterScaledValue(state, card, effect) ?? 0) > 1;
  });
}

function hasConditionBoon(state: BattleState, card: Card, effects: EffectDescriptor[]): boolean {
  return effects.some(
    (effect) => hasCondition(effect) && conditionMet(state, effect, card),
  );
}

export function cardBoons(state: BattleState, card: Card): CardBoonId[] {
  if (isPassive(card) || !state.hand.includes(card.uid)) return [];

  const effects = activeEffectsOf(card);
  const boons: CardBoonId[] = [];
  if (cultivateReady(card)) boons.push("cultivate");
  if (cardCost(state, card) < card.cost) boons.push("cheaper");
  if (starlightPayment(state, card) > 0) boons.push("starPay");
  if ((card.resonanceStacks ?? 0) > 0) boons.push("resonance");
  if (
    (card.discardStacks ?? 0) > 0 &&
    effects.some((effect) => effect.bonusMultiplierPerSelfStack != null)
  )
    boons.push("selfStack");
  if (
    effects.some((effect) => effect.condition === "waterfall") &&
    waterfallHolds(state, card)
  )
    boons.push("waterfall");
  if (hasCounterBoon(state, card, effects)) boons.push("counter");
  if (hasConditionBoon(state, card, effects)) boons.push("condition");
  return boons;
}

export function cardActivated(state: BattleState, card: Card): boolean {
  return cardBoons(state, card).length > 0;
}
