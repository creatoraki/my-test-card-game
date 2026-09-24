import type { BattleState, Card, EffectDescriptor } from "../types";
import { counterOf } from "../combat/counters";
import { playableHandUids } from "../cards/passiveCards";

export function conditionMet(
  state: BattleState,
  effect: EffectDescriptor,
  card?: Card,
  targetIds?: string[],
  primaryId?: string,
): boolean {
  if (effect.condition === "discardedThisRound") return counterOf(state, "discardsThisRound") > 0;
  if (effect.condition === "noFastPlaysThisRound") return counterOf(state, "fastPlaysThisRound") === 0;
  if (effect.condition === "noPlaysThisRound") return counterOf(state, "cardsPlayedThisRound") === 0;
  if (effect.condition === "waterfall") return state.waterfallPlay;
  if (effect.condition === "eventIsSourceCard")
    return Boolean(card?.uid && state.passiveSourceCardUid === card.uid);
  if (effect.condition === "handHasCostAtLeast")
    return playableHandUids(state).some((uid) => (state.cards[uid]?.cost ?? 0) >= (effect.conditionValue ?? 0));
  if (effect.condition === "fastCardsInHandAtLeast")
    return playableHandUids(state).filter((uid) => state.cards[uid]?.cardType === "fast").length >= (effect.conditionValue ?? 0);
  if (effect.condition === "counterAtLeast") {
    const value = counterOf(state, effect.conditionCounter!, card);
    return value >= (effect.conditionValue ?? 0) &&
      (effect.conditionValueMax == null || value <= effect.conditionValueMax);
  }
  if (effect.condition === "counterBelow")
    return counterOf(state, effect.conditionCounter!, card) < (effect.conditionValue ?? 0);
  if (effect.condition === "eventTargetHasStatus")
    return Boolean(
      effect.conditionStatus && state.passiveEventTargetStatuses?.some(
        (status) => status.id === effect.conditionStatus && status.stacks > 0,
      ),
    );
  if (effect.condition === "fullyStarPaid")
    return state.activeCardStarSpent > 0 && state.activeCardCost != null &&
      state.activeCardStarSpent === state.activeCardCost;
  if (effect.condition === "targetLacksStatus")
    return Boolean(effect.conditionStatus) && (targetIds ?? []).every((id) =>
      !state.combatants[id]?.statuses.some((status) => status.id === effect.conditionStatus && status.stacks > 0),
    );
  if (effect.condition === "targetHasStatus")
    return Boolean(effect.conditionStatus) && (targetIds ?? []).some((id) =>
      state.combatants[id]?.statuses.some((status) => status.id === effect.conditionStatus && status.stacks > 0),
    );
  if (effect.condition === "primaryBelowHpLimit") {
    const primary = primaryId ? state.combatants[primaryId] : undefined;
    return Boolean(primary?.alive && primary.hp < primary.hpLimit);
  }
  if (effect.condition === "primaryActsWithin") {
    const primary = primaryId ? state.combatants[primaryId] : undefined;
    if (!primary?.alive || primary.team !== "enemy" || primary.nextActTick == null) return false;
    return primary.nextActTick - state.tick <= (effect.conditionValue ?? 0);
  }
  if (effect.condition === "targetAttackedThisRound" || effect.condition === "targetNotAttackedThisRound") {
    const targetWasAttacked = targetIds == null
      ? state.attackedThisRound.length > 0 || state.playerIds.some((id) => feignsInjury(state, id))
      : targetIds.some((id) => state.attackedThisRound.includes(id) || feignsInjury(state, id));
    return effect.condition === "targetAttackedThisRound" ? targetWasAttacked : !targetWasAttacked;
  }
  return true;
}

function feignsInjury(state: BattleState, id: string): boolean {
  return Boolean(
    state.combatants[id]?.statuses.some((status) => status.id === "feignInjury" && status.stacks > 0),
  );
}
