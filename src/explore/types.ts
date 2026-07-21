// ============================================================================
// 探索层类型定义 —— 与 engine/types.ts 同惯例: 只定义类型, 不含逻辑, 不 import 实现。
// 探索卡与战斗卡是两套完全独立的体系, 刻意不复用 Card ——
// 前者的"效果"作用于整支队伍与区域危险度, 后者作用于战斗单位。
// ============================================================================

import type { Rarity } from "../engine/types";

// ---------------------------------------------------------------------------
// 探索卡
// ---------------------------------------------------------------------------
// encounter/boss/retreat 是「路线牌」: 不进牌库、不可弃、不占手牌上限, 由 createSession 直接发到 route。
// event 是唯一会进牌库、靠抽取获得的卡型。
export type ExploreCardKind = "encounter" | "boss" | "retreat" | "event";

// 探索效果 —— 新增一种机制 = 这里加一个成员 + session.ts 的 applyEffect 加一个分支。
export type ExploreEffect =
  | { type: "GAIN_LOOT"; amount: number } // 残片入袋(仅撤退/通关时才转进城镇)
  | { type: "DRAW"; amount: number } // 抽牌(手牌满则抽满即止)
  | { type: "DISCARD"; amount: number } // 随机弃牌(负面卡用; 玩家主动弃牌走 pendingDiscard)
  | { type: "HEAL_PARTY"; percent: number } // 全队按 maxHp 百分比回血(不复活阵亡者)
  | { type: "DAMAGE_PARTY"; amount: number } // 全队固定伤害(无视护盾, 可致死)
  | { type: "MODIFY_DANGER"; amount: number }; // 额外的危险度增减(danger 字段之外的)

export interface ExploreCardDef {
  id: string;
  name: string;
  kind: ExploreCardKind;
  emoji: string;
  text: string;
  danger: number; // 打出后危险度变化。事件卡默认 +1, 路线牌为 0
  effects: ExploreEffect[];
  rarity?: Rarity;
}

// 运行期实例。encounterId 只有 encounter/boss 卡有 —— 开局就绑定好具体打哪一场,
// 因此卡面能提前把敌人组合亮给玩家看(玩家可以自选先打哪一场)。
export interface ExploreCard extends ExploreCardDef {
  uid: string;
  encounterId?: string;
}

// ---------------------------------------------------------------------------
// 轨迹 —— 已打出的卡, 横向排开构成这趟远征的可视历史。
// 「地图不用画, 它自己长出来」: 轨迹就是地图。
// ---------------------------------------------------------------------------
export interface TrailEntry {
  name: string;
  emoji: string;
  kind: ExploreCardKind;
  dangerBefore: number;
  dangerAfter: number;
  note: string; // 结算摘要, 如 "残片 +12"; 悬停轨迹卡时显示
}

// ---------------------------------------------------------------------------
// 队伍快照 —— 探索层持有的队伍血量, 跨战斗继承。
// 这是整套设计的地基: 没有它,「休整」没意义、撤退没人考虑。
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
// 危险度档位
// ---------------------------------------------------------------------------
export interface DangerTier {
  tier: number; // 1..5
  name: string;
  color: string;
  min: number; // 进入该档所需的危险度数值(含)
  extraEnemies: number; // 战斗追加的敌人数
  enemyStatuses: { id: string; stacks: number }[]; // 敌人开局状态
  castTickDelta: number; // 敌人行动间隔调整(引擎侧钳到下限 1)
  rewardMultiplier: number; // 战利品与经验倍率
}

// ---------------------------------------------------------------------------
// 场地能力 —— 探索界面上三个常驻按钮, 永远可用(代价不足时置灰)。
// 存在的意义是「牌库空 + 手牌空」的死局不成立。
// ---------------------------------------------------------------------------
export type AbilityId = "scout" | "rest" | "conceal";

// 需要玩家点选弃牌的挂起态。rest/conceal 的代价是弃牌, 而「弃哪两张」本身就是决策,
// 故不做随机弃牌 —— 随机弃牌等于没有决策。
export interface PendingDiscard {
  ability: AbilityId;
  count: number;
  picked: string[]; // 已点选的手牌 uid
}

// ---------------------------------------------------------------------------
// 会话状态 —— 完全可序列化(无函数), 可 structuredClone。
// ---------------------------------------------------------------------------
export type ExplorePhase =
  | "exploring" // 牌桌上, 等玩家操作
  | "inBattle" // 已打出遭遇/BOSS 卡, 战斗进行中
  | "cleared" // BOSS 已击杀
  | "retreated" // 主动撤退
  | "wiped"; // 团灭

export interface ExploreState {
  mapId: string;
  danger: number;
  loot: number; // 本趟累积的残片; 仅撤退/通关时转进城镇

  cards: Record<string, ExploreCard>;
  draw: string[]; // 牌库(uid)。打出的卡不洗回 ⇒ 牌库有限 ⇒ 地图卡池大小 = 这张图最多能玩多久
  hand: string[]; // 事件卡, 受 handSize 约束
  route: string[]; // 路线牌: 遭遇 ×N / BOSS(揭示后) / 撤退

  trail: TrailEntry[];
  party: PartySnapshot[];

  bossUid: string; // BOSS 卡的 uid(未揭示时不在 route 里)
  bossRevealed: boolean;
  encountersLeft: number;

  pendingEncounterId: string | null; // 战斗中: 打的是哪一场
  pendingIsBoss: boolean;
  pendingDiscard: PendingDiscard | null;

  phase: ExplorePhase;
  rngState: number;
  log: string[];
}
