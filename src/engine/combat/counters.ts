import type { BattleState, Card, CounterSource } from "../types";
import { partyInsuranceStacks } from "./insurance";
import { cardCost } from "../cards/cost";
import { playableHandUids } from "../cards/passiveCards";
import { RULES } from "../core/battleRules";
import { getStatusDef } from "../statuses";

export function counterOf(state: BattleState, source: CounterSource, card?: Card): number {
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
  if (source === "fullDrawHits") return state.fullDraw.hitIds.length;
  if (source === "fullDrawBigHits")
    return Object.values(state.fullDraw.removed).filter((removed) => removed >= RULES.pierce.bigHarvest).length;
  if (source === "primaryDebuffKinds") {
    const target = state.activeCardPrimaryId ? state.combatants[state.activeCardPrimaryId] : undefined;
    return target
      ? new Set(target.statuses.filter((status) => status.id !== "pierce" && getStatusDef(status.id)?.kind === "debuff" && status.stacks > 0).map((status) => status.id)).size
      : 0;
  }
  if (source === "primaryPierce" || source === "primaryPierceTriples") {
    const target = state.activeCardPrimaryId ? state.combatants[state.activeCardPrimaryId] : undefined;
    const pierce = target?.statuses.find((status) => status.id === "pierce")?.stacks ?? 0;
    return source === "primaryPierce" ? pierce : Math.floor(pierce / 3);
  }
  if (source === "primaryPoisonTurns") {
    const target = state.activeCardPrimaryId ? state.combatants[state.activeCardPrimaryId] : undefined;
    const poison = target?.statuses.find((status) => status.id === "poison" && status.stacks > 0);
    if (!poison) return 0;
    const segments = poison.segments ?? [{ stacks: poison.stacks, duration: poison.duration, appliedAt: 0 }];
    // 无期限分段视为无限长, 交给效果的 maxStacks 截断。
    return Math.max(0, ...segments.map((segment) => segment.duration ?? Infinity));
  }
  if (source === "handRottenFruit")
    return state.hand.filter((uid) => state.cards[uid]?.id === "rotten-fruit").length;
  if (source === "lastExhaustedHandCards") return state.lastExhaustedHandCards;
  if (source === "activeCardResonance") return card ? card.resonanceStacks ?? 0 : state.activeCardResonance;
  if (source === "activeCardCost") return state.activeCardCost ?? 0;
  if (source === "activeCardStarSpent") return state.activeCardStarSpent;
  if (source === "handRaisedCostCards")
    return playableHandUids(state).filter((uid) => {
      const handCard = state.cards[uid];
      return handCard != null && cardCost(state, handCard) > handCard.cost;
    }).length;
  if (source === "chosenCardCost") return state.chosenCardCost;
  if (source === "lastStrippedMarks") return state.lastStrippedMarks;
  if (source === "partyInsuranceStacks") return partyInsuranceStacks(state);
  if (source === "discardPileTens") return Math.floor(state.discard.length / 10);
  if (source === "aliveFoeCount")
    return state.enemyIds.filter((id) => state.combatants[id]?.alive).length;
  if (source === "burningFoeCount")
    return state.enemyIds.filter((id) => {
      const enemy = state.combatants[id];
      return enemy?.alive && enemy.statuses.some((status) => status.id === "burn" && status.stacks > 0);
    }).length;
  if (source === "fastPlaysThisRound")
    return state.playedThisRound.filter((played) => played.cardType === "fast").length;
  return state.playedThisRound.length;
}
