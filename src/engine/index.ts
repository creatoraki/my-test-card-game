// 引擎公开 API。UI / store 只从这里 import。

export * from "./types";
export { RULES } from "./rules";
export { STATUS_DEFS, getStatusDef } from "./statuses";
export { createBattle, playCard, endRound, startRound, canPlay, redrawHandCard, discardHandCard } from "./battle";
export type { AllyInit, BattleSetup, PlayRecorder } from "./battle";
export { foesOf, alliesOf, aliveOf, chooseAggroTarget } from "./targeting";
export { getStatus } from "./ops";
