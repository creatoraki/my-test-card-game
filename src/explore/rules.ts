// ============================================================================
// ★ 可配置探索规则 ★ —— 与 engine/rules.ts 同惯例: 所有旋钮集中在这一个文件。
// 调探索层平衡(轮数 / 桥接数 / 揭示时长 / 能量档位与收益)只改这里。
//
// ⚠ 上一版的「区域危险度 DANGER_TIERS」与「残片」已废弃, 难度轴只保留净化粒子一条
//   (设计文档 §4.1 明确禁止再引入第二条并行难度数值)。
// ⚠ 上一版的「每段 −10 粒子」「战斗额外扣 4/7/10」「避战代价」口径也已废弃(设计文档 §4.2):
//   房间制下只有「每移动 1 个房间 −5」「每交互 1 个事件 −2」「每进行 1 个战斗回合 −1」三项。
//   后者由 runStore.resolveBattle 在战斗结算后接入(读 battle.round), BOSS 战豁免。
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
  // ★ 每交互 1 个事件的固定消耗。房间制下不再按推进段分档 ——
  //   压力改由「每换一个房间 −5」承担, 交互本身保持廉价, 鼓励把一个房间搜干净再走。
  //   「隐匿通道」这类效果仍可免除这一份(见 ExploreState.freeNodes)。
  energyPerInteraction: 2,
  // 每进行 1 个战斗回合 −1。战斗结算时按 battle.round 一次性扣除(见 runStore.resolveBattle
  // 与 explore/session.spendBattleEnergy), 胜负都扣; **最后一战 BOSS 战豁免** ——
  // 那一场打完远征就结束了, 再扣只是在通关瞬间制造一次无用的档位跌落。
  energyPerBattleRound: 1,

  // ── 房间图(设计: 一张地图 = 一张房间网格图, 没有层) ──
  dungeon: {
    // 每移动 1 个房间 −5。★ 这是房间制的主压力来源: 走回头路是有代价的。
    energyPerRoomMove: 5,
    // 非起点、非 BOSS 房中埋伏黑影的比例(至少 1 间)。
    battleRoomRatio: 0.22,
    // 生成树之外额外接通的相邻房间数比例 —— 制造回环与近路。
    loopEdgeRatio: 0.2,
    // 每个房间的可交互物数量区间(起始房固定 1 件, BOSS 房也按区间随机)。
    curiosPerRoom: [1, 3] as const,
    merchants: {
      smallMapMaxRooms: 8,
      small: [1, 1] as const,
      large: [1, 2] as const,
    },
  },

  // ── 推进战斗档位权重(设计文档 §3.1) ──
  // index = **当前房间的深度**(距起始房间的步数)。越深越难; 深度超出表长时取最后一档。
  // BOSS 房不读这张表 —— 那一场固定 t5。
  battleTierWeights: [
    [{ tier: "t1", weight: 100 }],
    [
      { tier: "t1", weight: 30 },
      { tier: "t2", weight: 70 },
    ],
    [
      { tier: "t2", weight: 40 },
      { tier: "t3", weight: 60 },
    ],
    [
      { tier: "t2", weight: 30 },
      { tier: "t3", weight: 30 },
      { tier: "t4", weight: 40 },
    ],
    [
      { tier: "t2", weight: 50 },
      { tier: "t3", weight: 30 },
      { tier: "t4", weight: 20 },
    ],
    [{ tier: "t5", weight: 100 }],
  ] as readonly { tier: BattleTier; weight: number }[][],
  treasureEncounter: {
    chance: 0.15,
    tiers: ["t1", "t2", "t3"] as readonly BattleTier[],
  },

  eventPool: {
    recentWindowRounds: 1,
    // 风险事件(带 risk 标记的 hazard 池): **位置完全随机** —— 不再限制推进段,
    // 只保留全图数量下限 minCount, 防止极端情况下整张图毫无风险。
    hazard: { minCount: 2 },
    battleNodes: { count: 2, depth: [2, 4] as readonly [number, number] },
    // 空节点(什么都不发生, 能量照扣): 每张图固定 N 个, 从空节点池随机抽取、锁在不同深段。
    emptyNodes: { count: 2 },
    // 挑战节点(跨轮契约, 见 explore/types.ts TrialDef): 每张图 0-1 个, 按 chance 掷一次。
    // ⚠ maxRound 是**硬约束**而不是手感旋钮: 挑战要靠「下一轮的推进战斗打完」来结算奖励,
    //   最后一轮(BOSS 轮)打完远征就结束了, 根本等不到那一拍 —— 故最后一轮一律不投放。
    trialNodes: {
      chance: 0.6,
      count: 1,
      maxRound: 5,
      // 倒计时按**战斗场次**走(房间制没有轮次): 接下后第 N 场战斗打完即结算。
      battles: 2,
      depth: [1, 4] as readonly [number, number],
    },
  },

  // ── 未知节点(设计: 每张图固定隐藏 N 个节点, 走到以后才知道是什么) ──
  // 全图随机抽取, 与节点类型/深段无关; 走到(落地)后揭示真实事件。
  hiddenNodesPerBoard: 3,

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

  boons: {
    healDewAmount: 5,
    cardOfferCap: 1,
  },

  picnic: {
    maxFoods: 4,
    limitPerFood: 5,
    emptyHeal: 10,
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
// 能量档位只把对应的 BUFF/状态层数带入战斗；每层的实际伤害与闪避效果由 engine/statuses.ts 定义。
export const ENERGY_TIERS: EnergyTier[] = [
  {
    tier: 1,
    name: "充盈",
    color: "#8dcc3f",
    min: 80,
    enemyStatuses: [],
    rewardMultiplier: 1.0,
  },
  {
    tier: 2,
    name: "稳定",
    color: "#d8f329",
    min: 60,
    enemyStatuses: [{ id: "overload", stacks: 1 }],
    rewardMultiplier: 1.1,
  },
  {
    tier: 3,
    name: "衰减",
    color: "#ffd43b",
    min: 40,
    enemyStatuses: [{ id: "overload", stacks: 2 }],
    rewardMultiplier: 1.2,
  },
  {
    tier: 4,
    name: "告急",
    color: "#ff922b",
    min: 20,
    enemyStatuses: [{ id: "overload", stacks: 3 }],
    rewardMultiplier: 1.35,
  },
  {
    tier: 5,
    name: "枯竭",
    color: "#ff6b6b",
    min: 0,
    enemyStatuses: [{ id: "overload", stacks: 4 }],
    rewardMultiplier: 1.6,
  },
];
