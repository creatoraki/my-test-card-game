import type { BattleState, Card, CounterSource } from "./types";

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
  if (source === "fastPlaysThisRound")
    return state.playedThisRound.filter((played) => played.cardType === "fast").length;
  return state.playedThisRound.length;
}
