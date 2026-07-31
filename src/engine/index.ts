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
