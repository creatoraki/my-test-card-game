// 引擎公开 API。UI / store 只从这里 import。

import "./deck/discard";

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
} from "./core/battleRules";
export {
  ZERO_STATS,
  STAT_KEYS,
  makeStats,
  addStats,
  applyModifier,
  attackDamage,
  healValue,
  masteryBonusOf,
  offenseStatOf,
  damageMasteryOf,
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
  burdenDodgePenalty,
  burdenPrecisionPenalty,
  enemyBaselineStats,
} from "./combat/stats";
export { STATUS_DEFS, getStatusDef } from "./statuses";
export { cardCost, manaCostOf, starPayable, starlightPayment, starlightStacksOf } from "./cards/cost";
export { cardDamagePreview, cardHitChance } from "./combat/hitPreview";
export { CARD_MARK_DEFS } from "./cards/cardMarks";
export {
  POLLUTION_RULES,
  QUIRK_DEFS,
  QUIRK_IDS,
  SICK_MOD,
  getQuirkDef,
} from "./combat/quirks";
export { quirkIdsOf } from "./combat/pollution";
export type { QuirkDef, QuirkId } from "./combat/quirks";
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
} from "./battle/battle";
export type { AllyInit, BattleSetup, PlayBlock, PlayRecorder } from "./battle/battle";
export { runEnemyFlee } from "./battle/flee";
export { foesOf, alliesOf, aliveOf, chooseRandomTarget, tauntedAmong, validFoeTargetIds } from "./combat/targeting";
export { getStatus } from "./core/ops";
export { growInsurance, insuranceStacksOf, partyInsuranceStacks, settleInsurance } from "./combat/insurance";
export { enemyMoveWeight, biasConditionMet, pickScriptedTarget, pickAllyTarget } from "./enemy/enemyMovePick";
export { pickScriptedMove, updateAiMemory } from "./enemy/enemyScript";
export { moveToDiscard } from "./deck/discard";
export { addCardToHand, replaceHandCard, rotOverripeCards } from "./deck/deck";
export { isPassive, playableHandUids, handPassiveUids } from "./combat/passive";
export { avidyaPickCount } from "./deck/handChoice";
export { RELIC_TRIGGERS, fireRelic } from "./relics/relics";
export { RELIC_BEHAVIORS, runRelicHook } from "./relics/relicBehaviors";
export type { RelicBehavior, RelicBehaviorContext } from "./relics/relicBehaviors";
export {
  cultivateCanAdvance,
  cultivateOverripe,
  cultivateReady,
  cultivateStage,
  effectiveTargeting,
  resetCultivate,
  tickCultivate,
} from "./deck/cultivate";
export { applyPierce, mostPiercedFoe, pierceOf, removePierce, transferPierce } from "./combat/pierce";
export { emptyFullDraw, fullDrawBigHits, fullDrawHits, resolveFullDraw } from "./deck/fullDraw";
export { cardActivated, cardBoons } from "./cards/cardBoon";
export type { CardBoonId } from "./cards/cardBoon";
export {
  ASSEMBLE_IDS,
  SQUAD_BUFF_DEFS,
  checkAssembly,
  consumeAllSquadBuffs,
  gainSquadBuff,
  hasSquadBuff,
  missingAssembleIds,
  removeRandomSquadBuff,
  removeSquadBuff,
  squadBuffIds,
} from "./combat/squadBuff";
export type { AssembleId, AssembleRewardCategory, SquadBuffDef } from "./combat/squadBuff";
export { CARD_KEYWORD_INFOS, KEYWORD_DEFS, cardKeywordsIn, splitCardKeywords } from "./cards/keywords";
export type { CardKeywordInfo, KeywordCtx, KeywordDef } from "./cards/keywords";
export { cardDisplayName, effectDisplayValue, renderCardText } from "./cards/cardText";
export type { CardTextStats } from "./cards/cardText";
export {
  CHALLENGE_DEFS,
  CHALLENGE_PICK,
  CHALLENGE_POOL,
  MERCY_MAX_DAMAGE,
  RESTRAINT_MIN_MANA,
  ROTATION_MIN_OWNERS,
  earnedChallengeBonus,
} from "./challenges";
