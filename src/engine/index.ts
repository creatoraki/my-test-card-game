// 引擎公开 API。UI / store 只从这里 import。

import "./discard";

export * from "./types";
export type { CardRarity } from "./types";
export {
  RULES,
  capProb,
  deckRarityChances,
  deckRarityWeights,
  deckUpgradeCost,
  drawCostToday,
  lowerMinSizeCost,
  removeCostToday,
} from "./rules";
export {
  ZERO_STATS,
  STAT_KEYS,
  makeStats,
  addStats,
  applyModifier,
  statOf,
  hitChance,
  critChance,
  burdenOf,
  defenseMultiplier,
  partyInitiative,
  partyHandLimit,
  partyDrawCount,
  partyOpeningDrawCount,
  partyManaPerRound,
  partyRedrawLimit,
  partyWaitLimit,
  squadHandLimit,
  squadDrawCount,
  squadOpeningDrawCount,
  squadManaPerRound,
  squadRedrawLimit,
  squadWaitLimit,
  burdenValue,
  burdenHitPenalty,
  burdenInitiativePenalty,
} from "./stats";
export { STATUS_DEFS, getStatusDef } from "./statuses";
export { cardCost } from "./cost";
export { cardHitChance } from "./hitPreview";
export { CARD_MARK_DEFS } from "./cardMarks";
export {
  POLLUTION_RULES,
  QUIRK_DEFS,
  QUIRK_IDS,
  SICK_MOD,
  getQuirkDef,
} from "./quirks";
export { quirkIdsOf } from "./pollution";
export type { QuirkDef, QuirkId } from "./quirks";
export {
  createBattle,
  playCard,
  endRound,
  startRound,
  canPlay,
  redrawHandCard,
  waitTick,
  discardHandCard,
  resolvePendingChoice,
  cancelPendingChoice,
  playBlockReason,
} from "./battle";
export type { AllyInit, BattleSetup, PlayBlock, PlayRecorder } from "./battle";
export { foesOf, alliesOf, aliveOf, chooseRandomTarget } from "./targeting";
export { getStatus } from "./ops";
export { moveToDiscard } from "./discard";
export { KEYWORD_DEFS } from "./keywords";
export type { KeywordDef } from "./keywords";
export { effectDisplayValue, renderCardText } from "./cardText";
export type { CardTextStats } from "./cardText";
export {
  CHALLENGE_DEFS,
  CHALLENGE_PICK,
  CHALLENGE_POOL,
  MERCY_MAX_DAMAGE,
  RESTRAINT_MIN_MANA,
  earnedChallengeBonus,
} from "./challenges";
