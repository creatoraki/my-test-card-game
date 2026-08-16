// ============================================================================
// ★ 可配置探索规则 ★ —— 与 engine/rules.ts 同惯例: 所有旋钮集中在这一个文件。
// 调探索层平衡(轮数 / 桥接数 / 揭示时长 / 能量档位与收益)只改这里。
//
// ⚠ 上一版的「区域危险度 DANGER_TIERS」与「残片」已废弃, 难度轴只保留净化粒子一条
//   (设计文档 §4.1 明确禁止再引入第二条并行难度数值)。
// ⚠ 上一版的「每段 −10 粒子」「战斗额外扣 4/7/10」「避战代价」口径也已废弃(设计文档 §4.2):
//   现在只有「每结算 1 个节点 −3」与「每进行 1 个战斗回合 −1」两项。
//   后者需要战斗引擎侧的回合钩子, 随战斗签一起实现, 目前尚未接入。
// ============================================================================

import type { ItemRarity } from "../items/types";
import type { BattleTier, EnergyTier } from "./types";

export const EXPLORE_RULES = {
  // ── 路由图规模(设计文档 §2.1 / §9.3) ──
  laneCount: 5, // 5 条通道 / 5 个入口
  segmentsPerRound: 4, // 4 个推进段横向拼接
  // 每段内桥接可占用的横向位置数。★ 上限由「整张图必须一屏内完整可见」倒推而来(§9.3),
  // 生成器显式按它校验, 不允许 UI 去截断。
  rowsPerSegment: 4,

  // 轮次 → 每段桥接数区间与揭示时长(设计文档 §2.2 的表)。
  // bridges[i] = 第 i 个推进段的 [下限, 上限]。**沿推进方向递增** ——
  // 这是「记忆置信度随深度递减」的唯一实现手段(§2.2): 第 1 段几乎必然记得住, 越往后越模糊。
  // 每行末尾的注释是该轮次的全图桥接总数区间, 必须落在设计文档给的 8-13 里。
  // ⚠ 揭示时长下限 2000ms 是硬底线(§11.3): 新图形是 4 段拼接, 旧的 800ms 下限已不适用。
  rounds: {
    early: {
      untilRound: 2,
      revealMs: 3000,
      bridges: [
        [2, 2],
        [2, 2],
        [2, 3],
        [2, 3],
      ],
    }, // 全图 8-10 根
    mid: {
      untilRound: 4,
      revealMs: 2500,
      bridges: [
        [2, 3],
        [2, 3],
        [3, 3],
        [3, 3],
      ],
    }, // 全图 10-12 根
    late: {
      untilRound: 6,
      revealMs: 2000,
      bridges: [
        [2, 3],
        [3, 3],
        [3, 4],
        [3, 3],
      ],
    }, // 全图 11-13 根
  },

  // ── 净化粒子(设计文档 §4.2) ──
  startingEnergy: 100,
  energyMax: 100,
  // ★ 唯一的固定消耗: 每结算 1 个节点事件按**推进段分档** —— 第 1-4 段依次 3 / 3 / 4 / 5。
  //   前两段维持原价 3, 深段阶梯上调: 越往深走, 单节点代价越高(与「记忆置信度随深度
  //   递减」同向, 双轴一起加压)。下标 = 推进段号 - 1, 段号越界时取最后一档兜底。
  energyPerNodeBySegment: [3, 3, 4, 5],
  // 每进行 1 个战斗回合 −1。⚠ 尚未接入战斗引擎, 留常量供战斗回合钩子引用。
  energyPerBattleRound: 1,

  // ── 推进战斗档位表(设计文档 §3.1) ──
  // index = 轮次 - 1, 直接决定本轮推进战斗档位。
  battleTierByRound: ["light", "medium", "medium", "heavy", "heavy", "boss"] as readonly BattleTier[],

  eventPool: {
    recentWindowRounds: 1,
    // 风险事件(带 risk 标记的 hazard 池): **位置完全随机** —— 不再限制推进段,
    // 只保留全图数量下限 minCount, 防止极端情况下整张图毫无风险。
    hazard: { minCount: 2 },
    battleNodes: { count: 2, depth: [2, 4] as readonly [number, number] },
    // 空节点(什么都不发生, 能量照扣): 每张图固定 N 个, 从空节点池随机抽取、锁在不同深段。
    emptyNodes: { count: 2 },
  },

  // ── 未知节点(设计: 每张图固定隐藏 N 个节点, 走到以后才知道是什么) ──
  // 全图随机抽取, 与节点类型/深段无关; 走到(落地)后揭示真实事件。
  hiddenNodesPerBoard: 3,

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
    // ★ 总产出旋钮。K =(K_energy + Σ挑战加成 + 同花加成)× kGlobal ——
    //   **全加法合成**(§5.1)。挑战加成由 engine/challenges.ts 判定, 同花加成来自战斗签快照。
    kGlobal: 1.0,
    // K → 品质权重。⚠ 阈值已按新的 K 分布整体下移: K_energy 压平到 1.00-1.60 后,
    //   旧的 1.2/1.8/2.5/3.5 分档会让无加成局面长期停在第一档(§13-10)。
    qualityTable: [
      { maxK: 1.05, w: { common: 85, fine: 14, rare: 1, epic: 0, legendary: 0 } },
      { maxK: 1.3, w: { common: 74, fine: 22, rare: 3, epic: 1, legendary: 0 } },
      { maxK: 1.7, w: { common: 62, fine: 30, rare: 5, epic: 2.5, legendary: 0.5 } },
      { maxK: 2.4, w: { common: 50, fine: 36, rare: 10, epic: 3, legendary: 1 } },
      { maxK: Infinity, w: { common: 38, fine: 43, rare: 15, epic: 3, legendary: 1 } },
    ] as { maxK: number; w: Record<ItemRarity, number> }[],
  },
} as const;

// ---------------------------------------------------------------------------
// 净化粒子档位表(设计文档 §4.2)
// ---------------------------------------------------------------------------
// 分档而非连续数值, 是因为决策发生在「跨档的那一步」——
// 玩家看到「再推进一个节点就掉进告急」会真的停下来算一算还要不要深潜。
//
// ⚠ 惩罚已按新回报重新定价: K_energy 全程只有 +0.60(旧版 +1.40)。
//   粒子污染按档位 −1 层提高敌方攻击伤害与闪避, 与力量 buff 分开显示。
// ⚠ 护盾现已跨回合保留，开局护盾是可用的硬度手段；本次不调整高档位数值。
export const ENERGY_TIERS: EnergyTier[] = [
  {
    tier: 1,
    name: "充盈",
    color: "#8dcc3f",
    min: 80,
    extraEnemies: 0,
    enemyStatuses: [],
    moveDelayDelta: 0,
    rewardMultiplier: 1.0,
  },
  {
    tier: 2,
    name: "稳定",
    color: "#d8f329",
    min: 60,
    extraEnemies: 0,
    enemyStatuses: [{ id: "pollution", stacks: 1 }],
    moveDelayDelta: 0,
    rewardMultiplier: 1.1,
  },
  {
    tier: 3,
    name: "衰减",
    color: "#ffd43b",
    min: 40,
    extraEnemies: 0,
    enemyStatuses: [{ id: "pollution", stacks: 2 }],
    moveDelayDelta: 0,
    rewardMultiplier: 1.2,
  },
  {
    tier: 4,
    name: "告急",
    color: "#ff922b",
    min: 20,
    extraEnemies: 1,
    enemyStatuses: [{ id: "pollution", stacks: 3 }],
    moveDelayDelta: -1, // 敌方先手 +1
    rewardMultiplier: 1.35,
  },
  {
    tier: 5,
    name: "枯竭",
    color: "#ff6b6b",
    min: 0,
    extraEnemies: 1,
    enemyStatuses: [{ id: "pollution", stacks: 4 }],
    moveDelayDelta: -2, // 敌方先手 +2
    rewardMultiplier: 1.6,
  },
];
