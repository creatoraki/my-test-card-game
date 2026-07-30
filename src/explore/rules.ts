// ============================================================================
// ★ 可配置探索规则 ★ —— 与 engine/rules.ts 同惯例: 所有旋钮集中在这一个文件。
// 调探索层平衡(段数 / 展示时长 / 横线数 / 能量档位与收益)只改这里。
//
// ⚠ 上一版的「区域危险度 DANGER_TIERS」与「残片」已废弃, 难度轴只保留净化粒子一条
//   (设计文档 §4.1 明确禁止再引入第二条并行难度数值)。
// ============================================================================

import type { ItemRarity } from "../items/types";
import type { EnergyTier } from "./types";

export const EXPLORE_RULES = {
  // ── 路由图规模 ──
  laneCount: 5, // 5 条竖线 / 5 个入口 / 5 个终点
  rowCount: 10, // 横线可占用的行数。行越多图越高, 横线越稀疏也越好记

  // 展示时长与横线数按「段在远征中的位置」分三档(设计文档 §2.2 的表)。
  // ⚠ 展示时长的下限刻意不低于 800ms —— 短时记忆是特色, 但不该变成不可跨越的门槛(§11.3)。
  stages: {
    early: { untilRatio: 1 / 3, revealMs: 1200, bars: [4, 6] },
    mid: { untilRatio: 2 / 3, revealMs: 1000, bars: [6, 9] },
    late: { untilRatio: 1, revealMs: 900, bars: [9, 12] },
  },

  // ── 净化粒子 ──
  startingEnergy: 100,
  energyMax: 100,
  energyPerSegment: 10, // 每完成一段的固定消耗, 玩家无法阻止
  battleEnergy: { normal: 4, elite: 7, boss: 10 }, // 终点为战斗时的额外消耗

  // 落点浮层里「绕开/放弃」那一支的代价。规避永远要付钱 —— 否则风险终点就没有风险了,
  // 而且代价一律比硬吃这场战斗的能量消耗高, 玩家才会真的犹豫。
  bypass: { normal: 8, elite: 12, boss: 15, hazard: 4 },

  // ── 污染层数(每层叠加, 本次远征内不可自行清除) ──
  taint: {
    damageTakenPerStack: 0.06, // 全队受到伤害 +6%/层
    healingPerStack: -0.1, // 治疗效果 -10%/层
    max: 5,
  },

  // ── BOSS 的额外缩放(在档位表之上再叠一层, 读开打瞬间的能量) ──
  boss: {
    hpPerTier: 0.15, // maxHp × (1 + 0.15 × (档位-1))
    guardFromTier: 4, // 第 4 档起追加一个护卫
  },

  // ── 团灭惩罚。★ 背包与积分全丢, 经验照发(经验在每场战斗后即时入账, 见 runStore)。
  //   已通过投递口寄回的物品不受影响 —— 那是背包玩法唯一的保险手段(设计文档 §6.5)。──
  wipe: {
    lootKept: 0,
  },

  // ── 投递口: 把背包里选中的物品提前寄回据点, 安全落袋(设计文档 §6.5) ──
  chute: {
    energyCost: 5,
  },

  // ── 战斗产出。⚠ 设计文档 §6.1: 战斗胜利**只掉物品, 绝不直接掉居民积分** ——
  //   积分改由「废料带回据点的回收台出售」产生。下面这两个数留着是给 BOSS 的通关奖励用的,
  //   普通战斗的 perEnemy 已归零; 若手感上觉得积分来得太晚, 回滚点就是这一行。──
  loot: {
    perEnemy: 0,
    bossBonus: 60,
  },

  // ── 掉落系数 K 与品质右移(设计文档 §5.1) ──
  drop: {
    // ★ 总产出旋钮。K = K_energy ×(1 + Σ挑战加成)× kGlobal;
    //   挑战词条(§5.3)尚未实现, 中间那项恒为 1 —— 接词条时只改 session.dropCoefficient。
    kGlobal: 1.0,
    // K → 品质权重。⚠ 设计文档 §5.1 的原表只有「常见/精良/稀有」三列, 这里按五档稀有度
    //   扩写; 史诗与传说两列是**新补的草案数值**(K ≤ 1.8 时不出传说), 实测后再调。
    qualityTable: [
      { maxK: 1.2, w: { common: 85, fine: 14, rare: 1, epic: 0, legendary: 0 } },
      { maxK: 1.8, w: { common: 74, fine: 22, rare: 3, epic: 1, legendary: 0 } },
      { maxK: 2.5, w: { common: 62, fine: 30, rare: 5, epic: 2.5, legendary: 0.5 } },
      { maxK: 3.5, w: { common: 50, fine: 36, rare: 10, epic: 3, legendary: 1 } },
      { maxK: Infinity, w: { common: 38, fine: 43, rare: 15, epic: 3, legendary: 1 } },
    ] as { maxK: number; w: Record<ItemRarity, number> }[],
  },
} as const;

// ---------------------------------------------------------------------------
// 净化粒子档位表(设计文档 §4.2)
// ---------------------------------------------------------------------------
// 分档而非连续数值, 是因为决策发生在「跨档的那一段」——
// 玩家看到「这段走完就掉进告急」会真的停下来算一算撤不撤。
//
// ⚠ 高档位刻意不给敌人「开局护盾」: RULES.combat.clearBlockOnRoundStart 会在第 1 回合
// 开始时把护盾清空, 开局塞 block 等于什么都没做。要加硬度只能走状态(力量/荆棘/再生)。
export const ENERGY_TIERS: EnergyTier[] = [
  {
    tier: 1,
    name: "充盈",
    color: "#8dcc3f",
    min: 80,
    extraEnemies: 0,
    enemyStatuses: [],
    castTickDelta: 0,
    taint: 0,
    rewardMultiplier: 1.0,
  },
  {
    tier: 2,
    name: "稳定",
    color: "#d8f329",
    min: 60,
    extraEnemies: 0,
    enemyStatuses: [{ id: "strength", stacks: 1 }],
    castTickDelta: 0,
    taint: 0,
    rewardMultiplier: 1.25,
  },
  {
    tier: 3,
    name: "衰减",
    color: "#ffd43b",
    min: 40,
    extraEnemies: 1,
    enemyStatuses: [{ id: "strength", stacks: 1 }],
    castTickDelta: 0,
    taint: 1,
    rewardMultiplier: 1.55,
  },
  {
    tier: 4,
    name: "告急",
    color: "#ff922b",
    min: 20,
    extraEnemies: 1,
    enemyStatuses: [{ id: "strength", stacks: 2 }],
    castTickDelta: -1,
    taint: 2,
    rewardMultiplier: 1.9,
  },
  {
    tier: 5,
    name: "枯竭",
    color: "#ff6b6b",
    min: 0,
    extraEnemies: 2,
    enemyStatuses: [{ id: "strength", stacks: 3 }],
    castTickDelta: -1,
    taint: 3,
    rewardMultiplier: 2.4,
  },
];
