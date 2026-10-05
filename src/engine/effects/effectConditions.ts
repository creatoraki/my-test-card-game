import type { BattleState, Card, EffectDescriptor } from "../types";
import { counterOf } from "../combat/counters";
import { playableHandUids } from "../cards/passiveCards";
import { isReacting } from "../combat/reaction";
import { isStealableBuff } from "../hexer/stealableBuff";
import { anyAllyCountsAsAttacked, countsAsAttacked, emergencyPartyWide } from "../actuary/actuaryRules";

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
  if (effect.condition === "targetHasBuff" || effect.condition === "targetLacksBuff") {
    const hasBuff = (targetIds ?? []).some((id) =>
      state.combatants[id]?.statuses.some(isStealableBuff),
    );
    return effect.condition === "targetHasBuff" ? hasBuff : !hasBuff;
  }
  if (effect.condition === "primaryBelowHpLimit") {
    const primary = primaryId ? state.combatants[primaryId] : undefined;
    return Boolean(primary?.alive && primary.hp < primary.hpLimit);
  }
  if (effect.condition === "primaryReacting")
    return isReacting(primaryId ? state.combatants[primaryId] : undefined);
  if (effect.condition === "hasSquadBuff" || effect.condition === "lacksSquadBuff") {
    const owned = Boolean(effect.squadBuff) && state.squadBuffs.some((entry) => entry.id === effect.squadBuff);
    return effect.condition === "hasSquadBuff" ? owned : !owned;
  }
  if (effect.condition === "primaryActsWithin") {
    const primary = primaryId ? state.combatants[primaryId] : undefined;
    if (!primary?.alive || primary.team !== "enemy" || primary.nextActTick == null) return false;
    return primary.nextActTick - state.tick <= (effect.conditionValue ?? 0);
  }
  // 急诊: 卡牌的主目标本回合被攻击过(或带有假装受伤); 没有主目标时看本条效果的目标。
  // ★ 判定对象是主目标而不是本条效果的目标 —— 提前理赔的急诊分支作用于"其他受击队友",
  //   但开关仍是主目标。应急预案持有期间改为看全队。
  if (effect.condition === "targetAttackedThisRound" || effect.condition === "targetNotAttackedThisRound") {
    const judgedIds = primaryId ? [primaryId] : targetIds;
    const targetWasAttacked = judgedIds == null || emergencyPartyWide(state)
      ? anyAllyCountsAsAttacked(state)
      : judgedIds.some((id) => countsAsAttacked(state, id));
    return effect.condition === "targetAttackedThisRound" ? targetWasAttacked : !targetWasAttacked;
  }
  return true;
}
