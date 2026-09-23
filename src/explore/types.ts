// ============================================================================
// 探索层类型定义 —— 与 engine/types.ts 同惯例: 只定义类型, 不含逻辑, 不 import 实现。
//
// 本层描述的是「房间制」远征:
//   一张地图 = 一张由若干房间连成的房间图(见 dungeon/), 每个房间展开成一段横向场景(见 corridor/)。
//   玩家在场景里行走、与物件交互(见 curio/)、遭遇黑影; 站上传送门消耗净化粒子换房间。
//   开启 BOSS 红门并挑战成功即通关。净化粒子(energy)是唯一的难度轴与时限。
// ============================================================================

import type { DropEntry, EquipSlot, ItemRarity, ItemStack } from "@/items/types";
import type { MapDifficulty } from "@/data/maps/mapDifficulty";

export type BattleBoonKind = "healDew" | "cardOffer" | "equipCrate" | "moduleCrate";

export interface BoonEntry {
  kind: BattleBoonKind;
  chance: number;
}

export interface PendingBoon {
  uid: string;
  kind: BattleBoonKind;
  dropK: number;
}

export interface CardOfferCandidate {
  charId: string;
  cardDefId: string;
}

// ---------------------------------------------------------------------------
// 场景事件
// ---------------------------------------------------------------------------
// 远征记录与结算页按它分类着色。房间制下实际写入的只有 loot / heal / merchant / energy / battle,
// 其余成员是历史遗留的分类, 结算页的配色与图标仍保留对应条目。
export type NodeEventKind =
  | "retreat"
  | "loot"
  | "heal"
  | "merchant"
  | "route"
  | "energy"
  | "hazard"
  | "battle"
  | "empty";

// 事件效果。新增一种机制 = 这里加一个成员 + session/effects.ts 的 applyEffect 加一个分支。
// ★ 物件效果(data/curios/types.ts CurioEffect)是它的超集, 未识别的物件效果回落到这里结算。
export type ExploreEffect =
  | { type: "HEAL_PARTY"; percent: number } // 全队按 maxHp 百分比回血(不复活阵亡者)
  | { type: "HEAL_ONE"; percent: number; full?: boolean } // 指定一名存活角色按 maxHp 回血
  | { type: "HEAL_LIMIT_PARTY"; percent: number } // 全队修复 hpLimit 并同步恢复等额 hp
  | { type: "HEAL_LIMIT_ONE"; percent?: number; full?: boolean } // 指定一名角色修复 hpLimit
  | { type: "HEAL_ONE_FULL"; othersPercent: number } // 单人回满 + 其余按百分比
  | { type: "DAMAGE_PARTY_PERCENT"; percent: number } // 全队按 maxHp 百分比掉血
  | { type: "GAIN_LOOT"; amount: number } // 城市居民积分(仅撤退/通关时落袋)
  | { type: "GAIN_ITEM"; itemId: string; count?: number } // 指名实物(不吃掉落系数)
  | { type: "FORCE_ITEM"; itemId: string; count?: number } // 强制拾取, 不进入可放弃的 pendingLoot
  | { type: "ROLL_DROP"; table: DropEntry[] } // 掷一张掉落表(吃 K 与 qualityBias)
  | { type: "DISCARD_SLOTS"; slots: number } // 强制丢弃背包若干格(「压力门夹层」)
  | { type: "OPEN_CHUTE" } // 传送投递口: 开启寄件流程(实际寄件由玩家在背包面板里选)
  | { type: "MODIFY_ENERGY"; amount: number } // 净化粒子增减
  | { type: "SKIP_NODE_COST"; nodes: number } // 「隐匿通道」: 接下来 N 次交互免除基础粒子消耗
  | { type: "CONTAMINATE_CARDS"; count?: number; each?: boolean } // 记录待处理的个人卡组污染请求
  | { type: "CURE_QUIRK"; scope: "one" | "party"; count?: number }
  | { type: "REDUCE_POLLUTION"; scope: "one" | "party"; amount: number }
  | { type: "PURIFY_CARDS"; scope: "one" | "party"; count?: number }
  | { type: "GRANT_RELIC"; relicId: string }
  | { type: "GRANT_RANDOM_RELIC"; rarity?: ItemRarity }
  | { type: "GAIN_EXP_PARTY"; amount: number }
  | { type: "GAIN_EXP_ONE"; amount: number }
  | { type: "GRANT_EQUIP" }
  | { type: "GRANT_MODULE" }
  | { type: "FORGE_DRAW" }
  | { type: "FORGE_REMOVE" }
  | { type: "EQUIP_OFFER"; count: number; slot?: EquipSlot }
  // 遗物三选一: 公开若干件祝福遗物候选, 由玩家在奖励浮层里挑一件进拾取框。
  // relicIds 指名候选(教程/剧情用), 缺省则按稀有度随机抽 count 件互不重复的祝福遗物。
  | { type: "RELIC_OFFER"; count?: number; relicIds?: string[]; rarity?: ItemRarity }
  | { type: "REFORGE_BOND"; bias?: BondBias }
  | { type: "START_NODE_BATTLE"; tier?: BattleTier; encounterId?: string };

export type BondBias = "offense" | "defense";

export interface ChoiceCost {
  itemId: string;
  count: number;
}

export interface EventOutcome {
  id: string;
  weight?: number;
  text: string;
  effects: ExploreEffect[];
}

// 事件分支选项。⚠ 代价与效果**只认选项自己的字段**: NodeEvent 上的同名字段只在 choices 缺省时兜底。
export interface EventChoice {
  id: string;
  label: string; // 按钮文字, 如「迎战黑影」
  desc: string; // 一行代价/收益说明; 当前 UI 不渲染, 选项不预告得失
  story?: string;
  energyDelta: number; // 选中该项的净化粒子增减(**不含**交互基础消耗)
  cost?: ChoiceCost;
  effects?: ExploreEffect[];
  outcomes?: EventOutcome[];
}

export type PendingAction =
  | { kind: "expOne"; amount: number }
  | { kind: "forgeDraw"; contaminate?: number }
  | { kind: "replaceCard"; foodCost?: number }
  | { kind: "equipmentTune"; mode: "bond" | "perfectness"; foodCost: number; result?: { before: ItemStack; after: ItemStack } }
  | { kind: "forgeRemove" }
  | { kind: "equipOffer"; offers: ItemStack[] }
  | { kind: "relicOffer"; offers: ItemStack[] }
  | { kind: "reforge"; bias?: BondBias }
  | { kind: "healOne"; percent: number; full: boolean }
  | { kind: "healLimitOne"; percent: number; full: boolean }
  | { kind: "cureQuirk"; scope: "one" | "party"; count: number }
  | { kind: "reducePollution"; scope: "one" | "party"; amount: number }
  | { kind: "purifyCards"; scope: "one" | "party"; count: number };

// 场景里一件物件或一个黑影对应的事件。物件的真实交互走 curio/ 的决策表, 这里只提供标题与分类;
// 黑影事件的唯一选项带 START_NODE_BATTLE, 由 session/battle.ts 的 engageRoomThreat 结算。
export interface NodeEvent {
  id: string;
  kind: NodeEventKind;
  title: string;
  description: string;
  // 选项缺省时的兜底代价与效果(等价于一个「继续」选项)。
  energyDelta: number;
  effects?: ExploreEffect[];
  choices?: EventChoice[];
}

// ---------------------------------------------------------------------------
// 净化粒子档位 —— 唯一的难度轴(取代已废弃的区域危险度)
// ---------------------------------------------------------------------------
export interface EnergyTier {
  tier: number; // 1..5
  name: string;
  color: string;
  min: number; // 进入该档所需的能量下限(含)
  enemyStatuses: { id: string; stacks: number }[]; // 施加给全体敌人的 BUFF/状态层数
  rewardMultiplier: number; // 即 K_energy, 同时作用于经验与产出
}

// 战斗档位。战斗房按房间深度抽取, BOSS 房默认 t5。
export type BattleTier = "t1" | "t2" | "t3" | "t4" | "t5";

// ---------------------------------------------------------------------------
// 队伍快照 —— 探索层持有的队伍血量, 跨战斗继承。
// ⚠ 形状由 runStore.partySnapshot() 直接产出, 不要随意改字段名。
// ---------------------------------------------------------------------------
export interface PartySnapshot {
  charId: string;
  name: string;
  emoji: string;
  hp: number;
  hpLimit: number;
  maxHp: number;
  alive: boolean; // 本次远征内阵亡即无法再出战, 回城后进入阵亡名单
  gearSettled?: boolean; // 阵亡装备已剥离并结算过, 防止重复剥离
  // 负重适应(固定值)。★ 由 runStore.partySnapshot() 一次性填好 ——
  // 探索层因此自足: 算负重惩罚不用回头去问 townStore, UI 与开战两处也不会各算一份。
  burdenAdapt: number;
  tradeEligibility?: {
    deckSize: number;
    minDeckSize: number;
    contaminatedCards: number;
    quirkCount: number;
  };
}

// ---------------------------------------------------------------------------
// 远征记录 —— 每结算一件物件或一场战斗一条, 结算页据此回顾整趟远征
// ---------------------------------------------------------------------------
export type HistorySlot = "node" | "battle";

export interface NodeHistoryEntry {
  slot: HistorySlot;
  round: number; // 事发房间的深度 + 1
  segment: number; // node: 房内第几件物件 / 黑影; battle: -1
  lane: number; // node: 恒为 0; battle: -1
  /** 事发房间在小地图上的序号; 结算页的条目标签读它。 */
  roomLabel?: number;
  eventId: string;
  eventTitle: string;
  eventKind: NodeEventKind;
  choiceIndex: number;
  choiceLabel: string;
  notes: string[];
  battleResult?: "win" | "lose";
}

export interface ExpeditionStats {
  kills: number;
  expTotal: number;
  pickups: number;
  energySpent: number;
}

// ---------------------------------------------------------------------------
// 会话状态 —— 完全可序列化(无函数), 可 structuredClone。
// ---------------------------------------------------------------------------
export type ExplorePhase =
  | "encounter" // 黑影破地演出期间锁定探索，结束后进入卡牌战斗
  | "landed" // ★ 已打开物件, **效果尚未结算**, 等玩家在浮层里选决策。不限时
  | "shopping" // 货商货架开启, 是 landed 之后与 resolving 并列的分叉相
  | "resolving" // 决策已结算完毕, 等玩家确认
  | "atNode" // 横向场景里的自由行走阶段
  | "inBattle" // 战斗进行中
  | "cleared" // BOSS 已击杀
  | "retreated" // 主动撤退 / BOSS 战失败
  | "wiped"; // 团灭

export interface ExploreState {
  /** 当前房间的横向场景(两屏宽); 房间之间的连通关系见 dungeon。 */
  corridor: import("./corridor/types").CorridorState | null;
  /** 整趟远征的房间图 —— 房间制下没有「层」, 一张地图就是一张图。 */
  dungeon: import("./dungeon/types").DungeonState | null;
  mapId: string;
  difficulty: MapDifficulty;

  energy: number; // 净化粒子, 唯一难度轴
  loot: number; // 本趟累积的城市居民积分; 仅撤退/通关时转进城镇

  // ★ round 只表示「当前房间的深度 + 1」(起始房 = 1), 远征记录读它。
  round: number;
  roomCount: number; // 由地图决定的房间总数 = 这张地图的庞大程度
  roundBattleTier: BattleTier; // 最近一次建立的战斗档位, 供 HUD 与结算读取
  battlesWon: number; // 本趟已打赢的战斗场数

  // ★ 当前房间场景的事件索引: 第 i 件物件 / 黑影对应 sceneEvents[i](见 CorridorObject.nodeIndex)。
  //   由 corridor/session.buildRoomScene 按房间重建, 暗雷与警报守卫会追加到末尾。
  sceneEvents: NodeEvent[];
  // 当前落点在 sceneEvents 里的下标; null = 没有打开任何物件或黑影。
  landedIndex: number | null;

  party: PartySnapshot[];
  // 出发时记录仓库与背包已拥有的遗物 id，后续投放按 id 去重。
  ownedRelicIds: string[];
  // 结算页唯一数据来源; 交互数从 history 的 node 条目现算。
  stats: ExpeditionStats;
  /** 上一场战斗结束时的累计粒子消耗，用于计算战后暗雷进度。 */
  battleEnergyMark: number;
  history: NodeHistoryEntry[];

  // ---- 实物背包(设计文档 §六) ----
  // 紧凑数组 + 容量以**格数**计(RULES.burden.backpackSlots), 不是定长稀疏数组。
  // 视觉上的 24 个格位由 items/inventory.layoutBackpack 现算。
  backpack: ItemStack[];
  // 已通过投递口寄回据点的物品。★ 团灭时 backpack 清空而它保留 —— 这是唯一的保险手段。
  shipped: ItemStack[];
  // 背包装不下、等玩家取舍的物品。非空 ⇒ UI 强制打开背包并进「替换模式」。
  // ⚠ 刻意**不**做成 phase: 它会叠加在 landed / resolving 之上, 做成阶段会把阶段机撑爆。
  pendingPickup: ItemStack[];
  pendingLoot: ItemStack[];
  pendingBoons: PendingBoon[];
  pendingCardOffer: CardOfferCandidate[] | null;
  pendingExp: Record<string, number>;
  pendingActions: PendingAction[];
  pendingStory: string[];
  // 投递口已开启(本次交互的 resolving/atNode 阶段内可寄件)。打开下一件物件即复位。
  chuteOpen: boolean;

  freeNodes: number; // 「隐匿通道」: 接下来几次交互免除基础粒子消耗
  pendingNotes: string[]; // 本次交互的结算摘要, 供 resolving 浮层展示
  pendingPollution: { charId: string; amount: number }[];
  pendingContaminationCount: number; // 尚未交给 townStore 应用的污染卡数量
  pendingContaminationEach: number; // 每名角色各污染 N 张, 与上面的全队总数语义分开

  // 野餐技能整趟远征只有一次。
  picnicUsed: boolean;
  /** 探索级遗物的运行态计数(新房间数、已返还粒子的房间等)。键由各遗物行为自取。 */
  relicCounters: Record<string, number>;
  /** 应急信标整趟远征只有一次。 */
  beaconUsed: boolean;

  // ---- 当前战斗 ----
  pendingEncounterId: string | null; // 战斗中: 打的是哪一场
  pendingIsBoss: boolean;
  pendingBattleTier: BattleTier | null; // 当前战斗的档位
  battleSource: "boss" | "room" | null; // BOSS 红门 / 房间内黑影
  // 挑战词条加成只有战斗结算后才知道, 由 finishBattle 写入后供掉落掷点读取。
  pendingChallengeBonus: number;

  phase: ExplorePhase;
  rngState: number;
  log: string[];
}
