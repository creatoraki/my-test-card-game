// 引擎公开 API。UI / store 只从这里 import。

export * from "./types";
export { RULES, capProb, deckUpgradeCost, lowerMinSizeCost } from "./rules";
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
  burdenPenalty,
} from "./stats";
export { STATUS_DEFS, getStatusDef } from "./statuses";
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
  discardHandCard,
} from "./battle";
export type { AllyInit, BattleSetup, PlayRecorder } from "./battle";
export { foesOf, alliesOf, aliveOf, chooseRandomTarget } from "./targeting";
export { getStatus } from "./ops";
