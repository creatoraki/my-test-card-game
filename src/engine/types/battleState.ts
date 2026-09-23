import type { ChallengeRun, Phase, SquadBuffRewardPools, SquadResourceMods } from "./base";
import type { Card, CardType, PendingChoice } from "./cards";
import type { Combatant } from "./combatants";
import type { StatBlock } from "./stats";
import type { StatusInstance } from "./statuses";

// ---------------------------------------------------------------------------
// 战斗状态 —— 完全可序列化(无函数), 可 structuredClone / 存 localStorage。
// ---------------------------------------------------------------------------
export interface LogEntry {
  round: number;
  tick: number;
  text: string;
}

export interface BattleRelic {
  id: string;
  counter: number;
  // 行为型遗物的战斗内运行态。只存数字，保持可 structuredClone。
  data?: Record<string, number>;
}

export interface BattleState {
  encounterId: string;
  round: number;
  tick: number;
  phase: Phase;
  combatants: Record<string, Combatant>;
  playerIds: string[];
  enemyIds: string[];
  cards: Record<string, Card>;
  // 遗物运行态只保存 id 与 every 计数, 定义从 data/items/relics 读取。
  relics: BattleRelic[];
  draw: string[]; // 卡牌 uid
  hand: string[];
  discard: string[];
  exhaust: string[];
  redrawsThisRound: number;
  waitsThisRound: number;
  discardsThisRound: number;
  playedThisRound: {
    uid: string;
    cost: number;
    cardType: CardType;
    ownerCharId: string;
  }[];
  lastPlayedCard: {
    uid: string;
    cost: number;
    cardType: CardType;
    ownerCharId: string;
  } | null;
  discardResolving: string[];
  pendingAutoPlays: string[];
  lastDiscardBatch: number;
  discardsThisBattle: number;
  lastDiscardBatchFast: number;
  lastRecoverBatchFast: number;
  pendingChoice: PendingChoice | null;
  pendingDiscardPicks: string[];
  waterfallPlay: boolean;
  playValueBonusPct: number;
  // 本次出牌期间临时写进施放者面板的加成台账(PLAY_STAT_BONUS)。
  // ★ 出牌结束逐条逆向撤回后清空 —— 它不是场上 buff, 结算完不留痕。
  playStatMods: { targetId: string; stat: keyof StatBlock; amount: number; pct: boolean }[];
  activeCardCost: number | null;
  // 当前结算卡的类型(速攻精通判定用), 与 activeCardCost 同生命周期。
  activeCardType: CardType | null;
  activeCardStarSpent: number;
  // 当前结算卡的实例累计层数(Card.discardStacks)。与 activeCardCost 同生命周期。
  activeCardStacks: number;
  // 当前结算卡的共鸣强化次数, 与 activeCardStacks 同生命周期。
  activeCardResonance: number;
  fullDraw: { hitIds: string[]; removed: Record<string, number> };
  activeCardUid: string | null;
  activeCardPrimaryId: string | null;
  markTransferSourceUid: string | null;
  chosenCardCost: number;
  lastStrippedMarks: number;
  autoPlaySuppress: boolean;
  // 被动卡结算窗口内, 触发本次事件的那张牌 uid(供 markPick: "eventCard" 定位)。
  passiveEventCardUid: string | null;
  passiveEventTargetStatuses: StatusInstance[] | null;
  passiveSourceCardUid: string | null;
  lastDiscardBatchCost: number;
  lastConvertBatch: number;
  squadBuffs: { id: string }[];
  squadBuffRewardPools: SquadBuffRewardPools;
  lastSquadBuffConsumed: number;
  lastConsumedStatusStacks: number;
  lastRemovedStatusCount: number;
  lastRemovedStatuses: StatusInstance[];
  lastExhaustedHandCards: number;
  resources: Record<string, number>; // 全队共享池, 如 { mana: 3 }
  // ★ 开战瞬间快照的有效负重点数, 战斗中恒定不变(《探索模式设计.md》§6.3)。
  //   引擎不认识背包与占格, 只认识这一个数 —— 由探索层用 stats.burdenValue 算好传入。
  burden: number;
  // ★ 开战瞬间快照: 本趟远征中已阵亡、未能参战的队员数(全家福等遗物读取)。
  fallenAllies: number;
  // ★ 开战瞬间快照的小队徽章与训练修正。引擎只认识最终数值, 不认识徽章/训练点。
  squadMods: SquadResourceMods;
  // 挑战词条运行态: 本场随机到的词条与其打破状态, 以及首次击杀回合。
  challenges: ChallengeRun[];
  challengeKillRound: number | null;
  // 聚焦: 本回合我方实际打掉过血的敌人 id; 出现第二个即打破。每回合开始重置。
  challengeFocusTargetId: string | null;
  // 抢拍: 已对哪一回合做过判定 —— 保证每回合只在敌人第一次行动前判一次。
  challengeEnemyActRound: number | null;
  // 本回合实际被敌方攻击命中的我方单位 id, 回合开始清空。
  attackedThisRound: string[];
  // 回响网络本回合新增人数上限为 1。
  echoGainedThisRound: boolean;
  rngState: number;
  log: LogEntry[];
}
