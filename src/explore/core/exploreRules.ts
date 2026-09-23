// ============================================================================
// ★ 可配置探索规则 ★ —— 与 engine/rules.ts 同惯例: 所有旋钮集中在这一个文件。
// 调探索层平衡(房间图 / 粒子消耗 / 能量档位与收益)只改这里。
//
// ⚠ 上一版的「区域危险度 DANGER_TIERS」与「残片」已废弃, 难度轴只保留净化粒子一条
//   (设计文档 §4.1 明确禁止再引入第二条并行难度数值)。
// ⚠ 房间制下的粒子消耗: 换房(新房/回头路分价)、交互(按物件分类分档)、战斗(每回合 + 按档位加扣)、
//   房间内行走(每走一屏 −1)。计价函数统一在 explore/energyCost.ts; 补充来源有净化粒子罐与粒子净化站。
// ============================================================================

import type { ItemRarity } from "@/items/types";
import type { BattleTier, EnergyTier } from "../types";

export const EXPLORE_RULES = {
  // ── 净化粒子(设计文档 §4.2) ──
  startingEnergy: 100,
  energyMax: 100,
  // ★ 每交互 1 个事件的消耗, 按物件分类分档(见 explore/energyCost.ts interactionCost):
  //   物品奖励最贵, 治疗次之, 服务最便宜, 货商免费; 陷阱强制触发不收费。
  //   event 是非物件交互(迎战黑影)的兜底价。「隐匿通道」这类效果仍可免除这一份(见 ExploreState.freeNodes)。
  energyPerInteraction: { loot: 4, heal: 3, service: 2, merchant: 0, event: 2 },
  // 每进行 1 个战斗回合 −1。战斗结算时按 battle.round 一次性扣除(见 runStore.resolveBattle
  // 与 explore/energyCost.spendBattleEnergy), 胜负都扣; **最后一战 BOSS 战豁免** ——
  // 那一场打完远征就结束了, 再扣只是在通关瞬间制造一次无用的档位跌落。
  energyPerBattleRound: 1,
  // 回合消耗之外, 按遭遇档位额外一次性扣除(BOSS 战同样豁免)。
  energyPerBattleTier: { t1: 0, t2: 2, t3: 4, t4: 6, t5: 0 } as Record<BattleTier, number>,
  // 房间内行走: 每累计走过这么多设计像素 −1 粒子(一屏宽度)。
  walk: { pxPerEnergy: 1920 },

  // ── 房间图(设计: 一张地图 = 一张房间网格图, 没有层) ──
  dungeon: {
    // 换房消耗: 进没去过的房间 −5, 回已到过的房间 −3。★ 这是房间制的主压力来源之一。
    energyPerRoomMove: { fresh: 5, revisit: 3 },
    // 非起点、非 BOSS 房中埋伏黑影的比例(至少 1 间)。
    battleRoomRatio: 0.22,
    // 生成树之外额外接通的相邻房间数比例 —— 制造回环与近路。
    loopEdgeRatio: 0.2,
    // 每间房交互物总数下限/上限(含货商、治疗、陷阱)；起始房只固定一个临时祝福匣。
    curiosPerRoom: [1, 2] as const,
    // 治疗交互: 每间非起点房独立掷骰, 命中投放 1 个。
    healChance: 0.2,
    // 陷阱房: 在战斗房之外的普通房中按比例投放(可为 0 间), 进房立即触发陷阱、必须指定执行者应对。
    trapRoomRatio: 0.15,
    // 每间房最多的传送门数量(至少 1 扇, 由连通性保证)。
    maxExits: 3,
    merchants: {
      smallMapMaxRooms: 8,
      small: [1, 1] as const,
      large: [1, 2] as const,
    },
  },

  ambush: {
    minEnergy: 20,
    guaranteedEnergy: 40,
    chanceMin: 0.05,
    chanceMax: 0.35,
    checkIntervalMs: 2000,
    tierWeights: [
      { tier: "t1", weight: 80 },
      { tier: "t2", weight: 20 },
    ] as const,
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
    // 回复型食谱的体力极限回复上限。
    recipeLimitMax: 20,
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
//   粒子污染按档位 −1 层提高敌方攻击伤害与格挡, 与力量 buff 分开显示。
// 能量档位只把对应的 BUFF/状态层数带入战斗；每层的实际攻击与格挡加成由 engine/statuses 的过载定义。
export const ENERGY_TIERS: EnergyTier[] = [
  {
    tier: 1,
    name: "充盈",
    color: "#31fa67",
    min: 80,
    enemyStatuses: [],
    rewardMultiplier: 1.0,
  },
  {
    tier: 2,
    name: "稳定",
    color: "#fcd50a",
    min: 60,
    enemyStatuses: [{ id: "overload", stacks: 1 }],
    rewardMultiplier: 1.1,
  },
  {
    tier: 3,
    name: "衰减",
    color: "#0888fc",
    min: 40,
    enemyStatuses: [{ id: "overload", stacks: 2 }],
    rewardMultiplier: 1.2,
  },
  {
    tier: 4,
    name: "告急",
    color: "#df46fc",
    min: 20,
    enemyStatuses: [{ id: "overload", stacks: 3 }],
    rewardMultiplier: 1.35,
  },
  {
    tier: 5,
    name: "枯竭",
    color: "#fd0531",
    min: 0,
    enemyStatuses: [{ id: "overload", stacks: 4 }],
    rewardMultiplier: 1.6,
  },
];
