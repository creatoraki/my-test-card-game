import type { BattleState, Card, CounterSource } from "./types";
import { partyInsuranceStacks } from "./insurance";
import { cardCost } from "./cost";
import { playableHandUids } from "./passiveCards";

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
  if (source === "lastAimConsumed") return state.lastAimConsumed;
  if (source === "partyInsuranceStacks") return partyInsuranceStacks(state);
  if (source === "discardPileTens") return Math.floor(state.discard.length / 10);
  if (source === "fastPlaysThisRound")
    return state.playedThisRound.filter((played) => played.cardType === "fast").length;
  return state.playedThisRound.length;
}
