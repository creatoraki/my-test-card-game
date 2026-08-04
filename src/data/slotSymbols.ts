// 战斗签转轮的符号池 —— 见 探索模式设计.md §2.4 / §8.3 与 事件设计.md §5.1。
//
// 一次战斗签 = 8 个公开符号 × 3 个槽位。普通轮的 8 个 = 5 张战斗卡 + 3 张战前准备卡;
// BOSS 轮的 8 个全是 BOSS 开局条件(§2.4.4)。**两类卡都必然进入战斗**, 只改条件、战术与收益。
//
// ★ 一个刻意的取舍: 不为每张战斗卡新建一个 EncounterDef(5 卡 × 4 档 = 20 场遭遇战, 首图撑不起)。
//   同档位共用 map.battleEncounters[tier] 这一场底子, 差异全部由符号自带的 mod 与 dropBonus 表达。
//
// ⚠ 降级说明(degraded: true 的三张): 设计文档给「环境压力 / 场景战术 / 战场改造」写的效果还
//   包含 SlotBattleMod 尚未承载的污染卡/场景特殊卡。污染卡机制已在抽牌与探索效果层落地,
//   但本符号仍保留当前可执行的降级条件；等战斗签接入污染请求后再改这三条并去掉 degraded。

import type { SlotSymbol } from "../explore/types";

// ---------------------------------------------------------------------------
// 普通轮: 5 张战斗卡
// ---------------------------------------------------------------------------
const BATTLE_SYMBOLS: SlotSymbol[] = [
  {
    id: "sb-steady",
    kind: "battle",
    title: "稳定推进",
    desc: "没有额外压力, 照常打完这一场。",
    icon: "▣",
  },
  {
    id: "sb-tempo",
    kind: "battle",
    title: "节奏控制",
    desc: "敌方先手 +2 —— 它们会更早动手。",
    icon: "⏱",
    mod: { castTickDelta: -2 },
  },
  {
    id: "sb-pressure",
    kind: "battle",
    title: "环境压力",
    desc: "粉尘作业区: 全体敌人开局获得 1 层力量。",
    icon: "☁",
    mod: { enemyStatuses: [{ id: "strength", stacks: 1 }] },
    degraded: true, // 原案是「开战污染 1-2 张卡牌」, 引擎尚无污染卡机制
  },
  {
    id: "sb-tactics",
    kind: "battle",
    title: "场景战术",
    desc: "维护平台: 敌方行动间隔 +1, 你有更多回旋余地。",
    icon: "⚙",
    mod: { castTickDelta: 1 },
    degraded: true, // 原案是「获得 1-2 张场景特殊卡牌」, 引擎尚无场景卡机制
  },
  {
    id: "sb-greed",
    kind: "battle",
    title: "高风险收益",
    desc: "被当作废品: 全体敌人 +1 层力量, 掉落系数 +0.40。",
    icon: "⚠",
    mod: { enemyStatuses: [{ id: "strength", stacks: 1 }] },
    dropBonus: 0.4, // ★ 加法并入 K(§5.1), 不是旧版的 ×1.3
    degraded: true, // 原案还有「我方首回合手牌 −1」, 引擎尚无开局抽牌修正
  },
];

// ---------------------------------------------------------------------------
// 普通轮: 3 张战前准备卡 —— 结算后**仍然进入本轮战斗**, 卖的是条件优势而不是避战出口
// ---------------------------------------------------------------------------
const PREP_SYMBOLS: SlotSymbol[] = [
  {
    id: "sp-supply",
    kind: "prep",
    title: "战前补给",
    desc: "全队回复 15% 最大 HP, 获得营养膏 ×1, 然后开战。",
    icon: "✚",
    prepEffects: [
      { type: "HEAL_PARTY", percent: 0.15 },
      { type: "GAIN_ITEM", itemId: "nutrient-paste" },
    ],
  },
  {
    id: "sp-intel",
    kind: "prep",
    title: "战前情报",
    desc: "全程公示敌方攻击意图, 然后开战。",
    icon: "◉",
    // ★ 完全落地: engine/statuses.ts 的 insight 正是「可以看见该敌人的攻击意图」,
    //   ui/CombatantView.isIntentRevealed 读的就是它; 头顶的 ⏱ T_attack 本来就常驻。
    //   stacks 给足是因为 insight 不衰减, 只需要一个「大于 0」。
    mod: { enemyStatuses: [{ id: "insight", stacks: 99 }] },
  },
  {
    id: "sp-retrofit",
    kind: "prep",
    title: "战场改造",
    desc: "改造过的战场让敌人更脆: 敌人最大 HP ×0.9, 然后开战。",
    icon: "◈",
    mod: { hpMultiplier: 0.9 },
    degraded: true, // 原案是「获得 1-2 张场景特殊卡牌」, 引擎尚无场景卡机制
  },
];

// ---------------------------------------------------------------------------
// BOSS 轮: 8 个符号全是 BOSS 卡, 差异来自开局条件(§2.4.4)
// ---------------------------------------------------------------------------
// ⚠ **必须凑满 8 种**: 三连概率 = 1 / 符号数², 只放 3-4 种会让三连率从 1.6% 跳到 6-11%,
//   同花加成的基线就与普通轮不一致了。
// encounterId 一律缺省 ⇒ 回落到 map.battleEncounters.boss。
const BOSS_SYMBOLS: SlotSymbol[] = [
  {
    id: "sbs-standard",
    kind: "battle",
    title: "总控 · 常规启动",
    desc: "回收总控按标准流程启动, 没有额外条件。",
    icon: "◆",
  },
  {
    id: "sbs-priority",
    kind: "battle",
    title: "总控 · 优先响应",
    desc: "总控先手 +2 —— 它比你更早开始处理。",
    icon: "⏱",
    mod: { castTickDelta: -2 },
  },
  {
    id: "sbs-escort",
    kind: "battle",
    title: "总控 · 护卫编队",
    desc: "追加 1 台清运机械护卫。",
    icon: "⛨",
    mod: { extraEnemies: ["scrap-bot"] },
  },
  {
    id: "sbs-overclock",
    kind: "battle",
    title: "总控 · 超频",
    desc: "总控最大 HP ×1.2, 掉落系数 +0.30。",
    icon: "⚡",
    mod: { hpMultiplier: 1.2 },
    dropBonus: 0.3,
  },
  {
    id: "sbs-hardened",
    kind: "battle",
    title: "总控 · 强化装甲",
    desc: "全体敌人开局获得 2 层力量。",
    icon: "▤",
    mod: { enemyStatuses: [{ id: "strength", stacks: 2 }] },
  },
  {
    id: "sbs-degraded",
    kind: "battle",
    title: "总控 · 供电不足",
    desc: "总控最大 HP ×0.85, 但行动间隔 −1。",
    icon: "▽",
    mod: { hpMultiplier: 0.85, castTickDelta: -1 },
  },
  {
    id: "sbs-exposed",
    kind: "battle",
    title: "总控 · 检修态",
    desc: "全程公示总控的攻击意图。",
    icon: "◉",
    mod: { enemyStatuses: [{ id: "insight", stacks: 99 }] },
  },
  {
    id: "sbs-scrapheap",
    kind: "battle",
    title: "总控 · 废品堆场",
    desc: "追加 1 台信标机, 掉落系数 +0.50。",
    icon: "☠",
    mod: { extraEnemies: ["radio-bot"] },
    dropBonus: 0.5,
  },
];

export const SLOT_SYMBOLS: SlotSymbol[] = [...BATTLE_SYMBOLS, ...PREP_SYMBOLS, ...BOSS_SYMBOLS];

// 首图的两组转轮池。轻/中/大三档共用同一组 8 个符号 —— 差异来自 battleEncounters[tier]
// 这场底子(清运班组 / 巡回信标 / 报废压缩机), 符号只负责改条件。
export const NEON_NORMAL_REEL = [...BATTLE_SYMBOLS, ...PREP_SYMBOLS].map((s) => s.id);
export const NEON_BOSS_REEL = BOSS_SYMBOLS.map((s) => s.id);
