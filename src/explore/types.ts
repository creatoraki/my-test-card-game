// ============================================================================
// 探索层类型定义 —— 与 engine/types.ts 同惯例: 只定义类型, 不含逻辑, 不 import 实现。
//
// 本层描述的是「区域路由图」远征(见 探索模式设计.md):
//   一趟出击 = 6 轮; 每轮 = 一张 5 通道 × 4 推进段的阿弥陀签拼接图(20 个节点事件全程可见)
//   + 一场固定档位的推进战斗。玩家**只在进入区域时选一次入口通道**, 此后信号沿通道向右推进,
//   遇桥接强制跨到相邻通道, 每跨过一个推进段抵达一个节点; 每个节点结算完由玩家决定
//   「继续推进」还是「前往下一区域」。净化粒子(energy)是唯一的难度轴与时限, 只降不升。
//
// ⚠ 战斗**不是**路由图上的终点(设计文档 §2.4): 它是每轮独立的第二个关卡。
//   老虎机战斗签尚未实现, 当前按轮次固定档位表直接建局(见 session.startRoundBattle)。
// ============================================================================

import type { DropEntry, ItemStack } from "../items/types";

// ---------------------------------------------------------------------------
// 路由图
// ---------------------------------------------------------------------------
// 一根桥接连接 leftLane 与 leftLane + 1 两条相邻通道。同一 row 内不得共享端点。
export interface RouteBridge {
  row: number;
  leftLane: number;
}

// 一个推进段 = 一张独立合法的阿弥陀签。段内「入通道 → 出通道」必为双射。
export interface RouteSegment {
  index: number; // 0-3, 即第 1-4 推进段
  bridges: RouteBridge[]; // 桥接数随 index 递增(设计文档 §2.2)
}

export interface RouteBoard {
  round: number; // 本轮轮号(从 1 起)
  laneCount: number; // 固定 5
  rowsPerSegment: number; // 每段内桥接可占用的横向位置数(一屏硬约束, §9.3)
  segments: RouteSegment[]; // 固定 4 段
  nodes: NodeEvent[][]; // [segmentIndex][lane], 共 4 × 5 = 20
  revealDurationMs: number; // 全图桥接一次性揭示的时长
  blockedLanes: number[]; // 被「塌落的隔断」等 debuff 封锁的入口通道(不可选)
}

// ---------------------------------------------------------------------------
// 节点事件
// ---------------------------------------------------------------------------
// ⚠ 不再有 "battle" / "elite" / "boss" —— 战斗一律走战斗签(设计文档 §2.4)。
export type NodeEventKind =
  | "retreat"
  | "loot"
  | "heal"
  | "merchant"
  | "route"
  | "energy"
  | "hazard";

// 保底规则按「类别」而非 kind 判定(设计文档 §2.3.2), 且范围是**整张图**而不是每段。
export type EventCategory =
  | "survival"
  | "growth"
  | "economy"
  | "route"
  | "energy"
  | "hazard"
  | "endgame";

// 风险标记 —— 纯负面全图最多 2 个、高风险最多 3 个, 且都只能出现在第 3-4 推进段。
export type EventRisk = "negative" | "highRisk";

// 事件效果。新增一种机制 = 这里加一个成员 + session.ts 的 applyEffect 加一个分支。
export type ExploreEffect =
  | { type: "HEAL_PARTY"; percent: number } // 全队按 maxHp 百分比回血(不复活阵亡者)
  | { type: "HEAL_ONE_FULL"; othersPercent: number } // 单人回满 + 其余按百分比
  | { type: "DAMAGE_PARTY_PERCENT"; percent: number } // 全队按 maxHp 百分比掉血
  | { type: "GAIN_LOOT"; amount: number } // 城市居民积分(仅撤退/通关时落袋)
  | { type: "GAIN_ITEM"; itemId: string; count?: number } // 指名实物(不吃掉落系数)
  | { type: "ROLL_DROP"; table: DropEntry[] } // 掷一张掉落表(吃 K 与 qualityBias)
  | { type: "DISCARD_SLOTS"; slots: number } // 强制丢弃背包若干格(「压力门夹层」)
  | { type: "OPEN_CHUTE" } // 传送投递口: 开启寄件流程(实际寄件由玩家在背包面板里选)
  | { type: "MODIFY_ENERGY"; amount: number } // 净化粒子增减
  | { type: "MODIFY_TAINT"; amount: number } // 污染层数增减
  | { type: "SKIP_NODE_COST"; nodes: number } // 「隐匿通道」: 接下来 N 个节点免除基础粒子消耗
  | { type: "END_REGION" } // 立即结束本轮推进, 进入本轮战斗(「逆流净化机」)
  | { type: "RETREAT" }; // 立即结束远征, 收益带回

// 落点分支选项(设计: 抵达节点后先开浮层, 玩家在两条路里挑一条 —— 落点是运气, 怎么处理是决策)。
// ⚠ 代价与效果**只认选项自己的这两个字段**: NodeEvent 上的同名字段仅用于节点卡的预览。
export interface EventChoice {
  id: string;
  label: string; // 按钮文字, 如「使用」「拆走」
  desc: string; // 一行代价/收益说明, 直接渲染在按钮里
  energyDelta: number; // 选中该项的净化粒子增减(**不含**每节点固定 −3)
  effects: ExploreEffect[];
}

export interface NodeEvent {
  id: string;
  kind: NodeEventKind;
  category: EventCategory;
  risk?: EventRisk;
  title: string;
  description: string;
  // ★ 节点卡上给玩家看的**预览**代价 = 主选项(choices[0])的 energyDelta。
  //   真正结算读的是被选中的那个 EventChoice; 只有 choices 缺省时才回退到这两个字段。
  //   ⚠ 这是「每节点固定 −3」之外的**额外**增减(设计文档 §8 的 E 列)。
  energyDelta: number;
  effects: ExploreEffect[];
  choices?: EventChoice[]; // 两项。缺省 = 单选项事件(等价于直接用上面的 energyDelta/effects)
  // 允许出现的推进段区间(1-4, 含两端), 缺省 [1, 4]。深度分层的唯一声明处(设计文档 §2.3.2)。
  depth?: [number, number];
  minRound?: number; // 终局类事件的最早出现轮次(第 5 轮起)
  duration?: number; // 路由/debuff 类事件的持续**轮**数
  disabled?: boolean; // 尚未实现的事件: 留在池里当占位, 不参与抽取
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
  castTickDelta: number; // 敌方先手变化
  taint: number; // 该档位下我方持续承受的污染层数下限
  rewardMultiplier: number; // 即 K_energy, 同时作用于经验与产出
}

// 推进战斗档位(设计文档 §3.1)。老虎机战斗签接上之前, 它直接决定本轮打哪一场。
export type BattleTier = "light" | "medium" | "heavy" | "boss";

// ---------------------------------------------------------------------------
// 队伍快照 —— 探索层持有的队伍血量, 跨轮与跨战斗继承。
// ⚠ 形状与上一版完全一致: runStore.partySnapshot() 直接产出它, 不要随意改字段名。
// ---------------------------------------------------------------------------
export interface PartySnapshot {
  charId: string;
  name: string;
  emoji: string;
  hp: number;
  maxHp: number;
  alive: boolean; // 本次远征内阵亡即无法再出战, 回城镇后复原
  // 负重适应(百分点)。★ 由 runStore.partySnapshot() 一次性填好 ——
  // 探索层因此自足: 算负重惩罚不用回头去问 townStore, UI 与开战两处也不会各算一份。
  burdenAdapt: number;
}

// ---------------------------------------------------------------------------
// 远征记录 —— 每结算一个节点一条, 结算页据此回顾整趟远征
// ---------------------------------------------------------------------------
export interface NodeHistoryEntry {
  round: number;
  segment: number; // 0-3
  lane: number; // 抵达该节点时所处通道
  eventId: string;
  eventTitle: string;
  choiceIndex: number;
  energyBefore: number;
  energyAfter: number;
  note: string;
}

// ---------------------------------------------------------------------------
// 会话状态 —— 完全可序列化(无函数), 可 structuredClone。
// ---------------------------------------------------------------------------
export type ExplorePhase =
  | "generating" // 新一轮的路由图正在逐段浮现(2s 演出)。锁死一切交互, 禁开背包
  | "sealed" // 图已浮现完但**桥接仍遮蔽**; 等玩家按「探索路线」。不限时, 可开背包
  | "revealing" // 全图桥接一次性揭示中。⚠ 此阶段禁止开背包(设计文档 §6.3 硬约束)
  | "choosingEntry" // 桥接已隐去, 等玩家选入口通道。★ 全轮唯一一次自由选择
  | "advancing" // 信号沿通道向右推进中, 动画由 UI 驱动
  | "landed" // ★ 已抵达节点, **效果尚未结算**, 等玩家在浮层里选分支。不限时
  | "resolving" // 分支已结算完毕, 等玩家确认
  | "atNode" // 节点决策: 继续推进 / 前往下一区域(设计文档 §2.3.3)
  | "routeDisclosure" // 本轮结束, 披露全图桥接与实际路径
  | "inBattle" // 本轮的推进战斗进行中
  | "cleared" // BOSS 已击杀
  | "retreated" // 主动撤退 / 走完全部轮次
  | "wiped"; // 团灭

export interface ExploreState {
  mapId: string;

  energy: number; // 净化粒子, 唯一难度轴
  taint: number; // 污染层数, 本次远征内不可自行清除
  loot: number; // 本趟累积的城市居民积分; 仅撤退/通关时转进城镇

  round: number; // 当前轮号, 从 1 起
  roundCount: number; // 固定 6
  board: RouteBoard | null;

  party: PartySnapshot[];
  history: NodeHistoryEntry[];

  // ---- 实物背包(设计文档 §六) ----
  // 紧凑数组 + 容量以**格数**计(RULES.burden.backpackSlots), 不是定长稀疏数组。
  // 视觉上的 32 个格位由 items/inventory.layoutBackpack 现算。
  backpack: ItemStack[];
  // 已通过投递口寄回据点的物品。★ 团灭时 backpack 清空而它保留 —— 这是唯一的保险手段。
  shipped: ItemStack[];
  // 背包装不下、等玩家取舍的物品。非空 ⇒ UI 强制打开背包并进「替换模式」。
  // ⚠ 刻意**不**做成 phase: 它会叠加在 landed / resolving 之上, 做成阶段会把阶段机撑爆。
  pendingPickup: ItemStack[];
  // 投递口已开启(本节点的 resolving/atNode 阶段内可寄件)。推进到下一个节点即复位。
  chuteOpen: boolean;

  // ---- 本轮推进状态 ----
  entryLane: number | null; // 本轮选定的入口通道, choosingEntry 之后不可再改
  currentLane: number | null; // 信号当前所处通道
  currentSegment: number; // 已抵达的推进段数, 0 = 尚未进入第 1 段, 4 = 已走满
  freeNodes: number; // 「隐匿通道」: 接下来几个节点免除基础粒子消耗
  pendingNotes: string[]; // 本节点结算摘要, 供 resolving 浮层展示

  // 侧向跨接(设计文档 §7.2): 整趟出击的剩余次数, 基础 1。
  // ⚠ 字段先占位, 指令系统是 P1 —— 目前没有任何入口消耗它。
  lateralShiftsLeft: number;

  pendingEncounterId: string | null; // 战斗中: 打的是哪一场
  pendingIsBoss: boolean;
  pendingBattleTier: BattleTier | null; // 本轮推进战斗的档位(§3.1 固定表)

  phase: ExplorePhase;
  rngState: number;
  log: string[];
}
