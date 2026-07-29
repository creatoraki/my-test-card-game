// ============================================================================
// 探索层类型定义 —— 与 engine/types.ts 同惯例: 只定义类型, 不含逻辑, 不 import 实现。
//
// 本层描述的是「失真路由图」远征(见 探索模式设计.md):
//   一张地图 = 5-7 段独立的阿弥陀签路由决策; 每段公开 5 个终点事件、短暂全显线路后隐去,
//   玩家选入口 A-E, 信号自动下行遇横线强制换线, 抵达一个终点并结算。
//   净化粒子(energy)是唯一的难度轴与时限, 只降不升。
// ============================================================================

// ---------------------------------------------------------------------------
// 路由图
// ---------------------------------------------------------------------------
// 一条横线连接 leftLane 与 leftLane + 1 两条相邻竖线。同一 row 内不得共享端点。
export interface RouteCrossbar {
  row: number;
  leftLane: number;
}

export interface RouteBoard {
  segment: number; // 本段段号(从 1 起)
  laneCount: number;
  rowCount: number; // 横线可占用的行数, 决定图形高度
  crossbars: RouteCrossbar[];
  events: RouteEvent[]; // 终点事件, 从左到右与 lane 0..laneCount-1 一一对应
  revealDurationMs: number; // 完整线路的展示时长
  blockedLanes: number[]; // 被「塌落的隔断」等 debuff 封锁的入口(不可选)
}

// ---------------------------------------------------------------------------
// 终点事件
// ---------------------------------------------------------------------------
export type RouteEventKind =
  | "battle"
  | "elite"
  | "boss"
  | "retreat"
  | "loot"
  | "heal"
  | "merchant"
  | "route"
  | "energy"
  | "hazard";

// 保底规则按「类别」而非 kind 判定(设计文档 §2.3): 一段里至少各有一个生存 / 成长 / 战斗。
export type EventCategory =
  | "survival"
  | "growth"
  | "battle"
  | "economy"
  | "route"
  | "energy"
  | "hazard"
  | "endgame";

// 风险标记 —— 纯负面每段最多 1 个, 纯负面 + 高风险合计不超过 2 个。
export type EventRisk = "negative" | "highRisk";

// 事件效果。新增一种机制 = 这里加一个成员 + session.ts 的 applyEffect 加一个分支。
export type ExploreEffect =
  | { type: "HEAL_PARTY"; percent: number } // 全队按 maxHp 百分比回血(不复活阵亡者)
  | { type: "HEAL_ONE_FULL"; othersPercent: number } // 单人回满 + 其余按百分比
  | { type: "DAMAGE_PARTY_PERCENT"; percent: number } // 全队按 maxHp 百分比掉血
  | { type: "GAIN_LOOT"; amount: number } // 城市居民积分(仅撤退/通关时落袋)
  | { type: "MODIFY_ENERGY"; amount: number } // 净化粒子增减
  | { type: "MODIFY_TAINT"; amount: number } // 污染层数增减
  | { type: "SKIP_SEGMENT_COST" } // 免除本段的基础能量消耗
  | { type: "START_BATTLE"; encounterId: string; boss?: boolean } // 进入战斗
  | { type: "RETREAT" }; // 立即结束远征, 收益带回

export interface RouteEvent {
  id: string;
  kind: RouteEventKind;
  category: EventCategory;
  risk?: EventRisk;
  title: string;
  description: string;
  energyDelta: number; // 抵达该终点的额外能量代价(每段的基础 -10 不含在内)
  effects: ExploreEffect[];
  minSegment?: number; // 精英 / 高额奖励 / 终局事件的最早出现段号
  disabled?: boolean; // P0 未实现的事件: 留在池里当占位, 不参与抽取
}

// ---------------------------------------------------------------------------
// 净化粒子档位 —— 唯一的难度轴(取代已废弃的区域危险度)
// ---------------------------------------------------------------------------
export interface EnergyTier {
  tier: number; // 1..5
  name: string;
  color: string;
  min: number; // 进入该档所需的能量下限(含)
  extraEnemies: number;
  enemyStatuses: { id: string; stacks: number }[];
  castTickDelta: number;
  taint: number; // 该档位下我方持续承受的污染层数下限
  rewardMultiplier: number; // 即 K_energy, 同时作用于经验与产出
}

// ---------------------------------------------------------------------------
// 队伍快照 —— 探索层持有的队伍血量, 跨段与跨战斗继承。
// ⚠ 形状与上一版完全一致: runStore.partySnapshot() 直接产出它, 不要随意改字段名。
// ---------------------------------------------------------------------------
export interface PartySnapshot {
  charId: string;
  name: string;
  emoji: string;
  hp: number;
  maxHp: number;
  alive: boolean; // 本次远征内阵亡即无法再出战, 回城镇后复原
}

// ---------------------------------------------------------------------------
// 远征记录 —— 每段一条, 结算页据此回顾整趟远征
// ---------------------------------------------------------------------------
export interface RouteHistoryEntry {
  segment: number;
  entryLane: number;
  exitLane: number;
  eventId: string;
  eventTitle: string;
  energyBefore: number;
  energyAfter: number;
  note: string;
}

// ---------------------------------------------------------------------------
// 会话状态 —— 完全可序列化(无函数), 可 structuredClone。
// ---------------------------------------------------------------------------
export type ExplorePhase =
  | "revealing" // 完整线路展示中。⚠ 此阶段禁止开背包(设计文档 §6.3 硬约束)
  | "choosing" // 线路已隐去, 等玩家选入口。不限时, 可开背包
  | "routing" // 信号沿线路下行中, 动画由 UI 驱动
  | "resolving" // 已抵达终点并结算完毕, 等玩家确认后推进
  | "inBattle" // 终点是战斗, 战斗进行中
  | "cleared" // BOSS 已击杀
  | "retreated" // 主动撤退 / 走完全部段数
  | "wiped"; // 团灭

export interface ExploreState {
  mapId: string;

  energy: number; // 净化粒子, 唯一难度轴
  taint: number; // 污染层数, 本次远征内不可自行清除
  loot: number; // 本趟累积的城市居民积分; 仅撤退/通关时转进城镇

  segment: number; // 当前段号, 从 1 起
  segmentCount: number;
  board: RouteBoard | null;

  party: PartySnapshot[];
  history: RouteHistoryEntry[];

  entryLane: number | null; // 本段已选的入口
  exitLane: number | null; // 本段的落点(phase 进入 routing 后才有值)
  pendingNotes: string[]; // 本段结算摘要, 供 resolving 浮层展示

  pendingEncounterId: string | null; // 战斗中: 打的是哪一场
  pendingIsBoss: boolean;
  skipSegmentCost: boolean; // 「隐匿通道」: 本段免除基础能量消耗

  bossAvailable: boolean; // BOSS 已接入网络, 终点池开始出现 BOSS 与撤离升降机

  phase: ExplorePhase;
  rngState: number;
  log: string[];
}
