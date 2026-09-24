// 基础枚举与目标选择 —— 阵营、阶段、挑战词条、弃牌/反击来源、小队资源。

export type Team = "player" | "enemy";
export type Phase = "player" | "won" | "lost";
export type ChallengeId =
  | "restraint"
  | "massacre"
  | "mercy"
  | "rotation"
  | "blitz"
  | "slow_start"
  | "untouched"
  | "no_redraw"
  | "low_cost"
  | "focus_fire"
  | "tempo";
export type DiscardReason =
  | "manual"
  | "effect"
  | "cost"
  | "redraw"
  | "roundEnd"
  | "play"
  | "passiveEnd"; // 回合结束把手牌里的被动卡收进弃牌堆; 不计数也不触发弃牌联动
export type CounterSource =
  | "discardsThisRound"
  | "fastPlaysThisRound"
  | "cardsPlayedThisRound"
  | "lastDiscardBatch"
  | "discardsThisBattle"
  | "lastDiscardBatchFast"
  | "lastRecoverBatchFast"
  | "lastDiscardBatchCost"
  | "lastConvertBatch"
  | "squadBuffCount"
  | "lastSquadBuffConsumed"
  | "lastConsumedStatusStacks"
  | "lastRemovedStatusCount"
  | "fullDrawHits"
  | "fullDrawBigHits"
  | "primaryDebuffKinds"
  | "handRottenFruit"
  | "lastExhaustedHandCards"
  | "activeCardResonance"
  | "activeCardCost"
  | "activeCardStarSpent"
  | "handRaisedCostCards"
  | "chosenCardCost"
  | "lastStrippedMarks"
  | "partyInsuranceStacks"
  | "discardPileTens"
  | "aliveFoeCount"
  | "burningFoeCount"
  | "primaryPierce" // 主目标当前穿孔层数
  | "primaryPierceTriples" // 主目标穿孔层数 ÷ 3(向下取整)
  | "primaryPoisonTurns"; // 主目标各段中毒中最长的剩余拍数; 存在无期限分段时为 Infinity

export interface ChallengeRun {
  id: ChallengeId;
  broken: boolean;
}

export interface SquadResourceMods {
  openingHand: number;
  drawCount: number;
  redraws: number;
  waits: number;
  mana: number;
  handLimit: number;
}

export interface SquadBuffRewardPools {
  attack: readonly string[];
  defense: readonly string[];
  support: readonly string[];
  passive: readonly string[];
}

// ---------------------------------------------------------------------------
// 目标选择
// ---------------------------------------------------------------------------
// 卡牌/招式的"主目标"选择方式:
//   foe      —— 需要选择一个敌对单位(玩家点选 / 敌人按仇恨选)
//   ally     —— 需要选择一个友方单位
//   self     —— 施放者自身
//   allFoes  —— 全体敌对
//   allAllies—— 全体友方
//   none     —— 无需主目标(效果自带 target)
export type Targeting = "foe" | "ally" | "self" | "allFoes" | "allAllies" | "none";

// 单条效果作用到谁(相对施放者):
//   primary   —— 卡牌/招式选定的主目标
//   self      —— 施放者
//   allFoes   —— 施放者的全部敌人
//   allAllies —— 施放者的全部队友
//   randomFoe —— 随机一个敌人
//   randomAlly—— 随机一个队友
//   lowestHpAlly —— 受伤最重的存活队友
//   mostPiercedFoe —— 穿孔层数最多的敌人
export type EffectTarget =
  | "primary"
  | "self"
  | "allFoes"
  | "allAllies"
  | "randomFoe"
  | "randomAlly"
  | "lowestHpAlly"
  | "mostPiercedFoe";
