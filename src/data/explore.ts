// ★ 探索卡定义 ★ —— 探索牌局里打出的卡, 与战斗卡(cards.ts)是两套完全独立的体系。
// 新增探索内容主要改这一层, 无需动 explore/ 逻辑层。
//
// 卡池设计准则(后续扩充照此写):
//   1. 每张卡必须同时动两个数(收益 + 危险度)。只给收益不涨危险度的卡是设计失误。
//   2. 降危险度的卡要有明确代价(弃牌 / 放弃收益), 否则玩家会攒着它无限刷。
//   3. 地图性格靠卡池表达 —— 森林多采集与回血, 城市多商人与情报, 深渊多高危高收益 + 更多杂质。
//   4. 稀有度不做抽牌权重, 靠在 MapDef.explorePool 里重复登记来加权(与 poolCardIds 同惯例)。
//
// ⚠ 打出的卡不洗回牌库 ⇒ 牌库有限 ⇒ **地图 explorePool 的大小 = 这张地图最多能玩多久**。
//   这是调远征长度最直接的旋钮。

import type { ExploreCardDef } from "../explore/types";

export const EXPLORE_CARD_DEFS: ExploreCardDef[] = [
  // ── 路线牌(固定发放, 不进牌库, 不占手牌上限) ──
  // 名称与卡面敌人组合由实例上的 encounterId 决定(见 explore/session.ts createSession)。
  {
    id: "route-encounter",
    name: "遭遇",
    kind: "encounter",
    emoji: "⚔️",
    text: "进入一场战斗。难度与奖励按当前区域危险度结算；胜利后抽 2 张。",
    danger: 0,
    effects: [],
  },
  {
    id: "route-boss",
    name: "深处之物",
    kind: "boss",
    emoji: "🩸",
    text: "最终战。它的强度与掉落，就是你这趟远征攒出来的危险度。",
    danger: 0,
    effects: [],
  },
  {
    id: "route-retreat",
    name: "撤退",
    kind: "retreat",
    emoji: "🚪",
    text: "立刻结束远征，已获得的残片全部落袋。",
    danger: 0,
    effects: [],
  },

  // ── 事件卡: 收益型 ──
  {
    id: "gather-moss",
    name: "采集苔藓",
    kind: "event",
    emoji: "🌿",
    text: "获得 8 残片。",
    danger: 1,
    effects: [{ type: "GAIN_LOOT", amount: 8 }],
    rarity: "common",
  },
  {
    id: "scavenge",
    name: "拾荒",
    kind: "event",
    emoji: "🎒",
    text: "获得 12 残片。",
    danger: 1,
    effects: [{ type: "GAIN_LOOT", amount: 12 }],
    rarity: "common",
  },
  {
    id: "supply-crate",
    name: "废弃补给箱",
    kind: "event",
    emoji: "📦",
    text: "获得 20 残片。",
    danger: 1,
    effects: [{ type: "GAIN_LOOT", amount: 20 }],
    rarity: "uncommon",
  },

  // ── 事件卡: 抽牌型(不涨危险度, 是牌局的润滑剂) ──
  {
    id: "hidden-path",
    name: "隐蔽小径",
    kind: "event",
    emoji: "🍃",
    text: "抽 1 张。不惊动任何东西。",
    danger: 0,
    effects: [{ type: "DRAW", amount: 1 }],
    rarity: "common",
  },
  {
    id: "tailwind",
    name: "顺风而行",
    kind: "event",
    emoji: "💨",
    text: "抽 2 张。不惊动任何东西。",
    danger: 0,
    effects: [{ type: "DRAW", amount: 2 }],
    rarity: "uncommon",
  },

  // ── 事件卡: 回血型 ──
  {
    id: "ruined-camp",
    name: "废墟营地",
    kind: "event",
    emoji: "🔥",
    text: "全队回复 30% 最大生命。",
    danger: 1,
    effects: [{ type: "HEAL_PARTY", percent: 0.3 }],
    rarity: "common",
  },
  {
    id: "clear-spring",
    name: "净水源",
    kind: "event",
    emoji: "💧",
    text: "全队回复 15% 最大生命。",
    danger: 0,
    effects: [{ type: "HEAL_PARTY", percent: 0.15 }],
    rarity: "common",
  },

  // ── 事件卡: 高收益高代价(一张牌跳一整档) ──
  {
    id: "flush-flock",
    name: "惊起鸟群",
    kind: "event",
    emoji: "🐦",
    text: "获得 25 残片。动静不小。",
    danger: 2,
    effects: [{ type: "GAIN_LOOT", amount: 25 }],
    rarity: "uncommon",
  },
  {
    id: "burn-nest",
    name: "焚烧巢穴",
    kind: "event",
    emoji: "🔥",
    text: "获得 40 残片，抽 2 张。整片区域都看得见这道烟。",
    danger: 3,
    effects: [
      { type: "GAIN_LOOT", amount: 40 },
      { type: "DRAW", amount: 2 },
    ],
    rarity: "rare",
  },

  // ── 事件卡: 刹车(降危险度, 必须有代价) ──
  {
    id: "cover-tracks",
    name: "掩埋痕迹",
    kind: "event",
    emoji: "🍂",
    text: "危险度 -2。这一步什么也没拿到。",
    danger: -2,
    effects: [],
    rarity: "uncommon",
  },
  {
    id: "detour",
    name: "绕道而行",
    kind: "event",
    emoji: "↩️",
    text: "危险度 -1，随机弃 1 张。",
    danger: -1,
    effects: [{ type: "DISCARD", amount: 1 }],
    rarity: "common",
  },

  // ── 事件卡: 杂质(负面) ──
  // 卡池刻意放负面卡 —— 牌库有杂质,「搜寻」才是有风险的动作,「抽 2 张」才有分量。
  {
    id: "snare",
    name: "陷阱",
    kind: "event",
    emoji: "🪤",
    text: "全队受到 8 点伤害。",
    danger: 1,
    effects: [{ type: "DAMAGE_PARTY", amount: 8 }],
    rarity: "common",
  },
  {
    id: "lost-way",
    name: "迷路",
    kind: "event",
    emoji: "🌀",
    text: "随机弃 2 张。",
    danger: 1,
    effects: [{ type: "DISCARD", amount: 2 }],
    rarity: "common",
  },
];
