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
  // ★ 唯一的固定消耗: 每结算 1 个节点事件 −3。**刻意不随深度递增** ——
  //   刹车由「不可逆 + 深段高方差 + 记忆置信度递减」三条结构性因素承担(§2.3.3)。
  energyPerNode: 3,
  // 每进行 1 个战斗回合 −1。⚠ 尚未接入战斗引擎, 留常量供接战斗签时引用。
  energyPerBattleRound: 1,

  // ── 推进战斗档位表(设计文档 §3.1) ──
  // index = 轮次 - 1。老虎机战斗签接上之前, 本表直接决定本轮打哪一场。
  battleTierByRound: ["light", "medium", "medium", "heavy", "heavy", "boss"] as readonly BattleTier[],

  eventPool: {
    recentWindowRounds: 1,
    hazard: { minDeep: 5, minSegment: 3 },
    battleNodes: { count: 2, depth: [2, 4] as readonly [number, number] },
  },

  // ── 战斗签: 老虎机(设计文档 §2.4) ──
  slot: {
    // ⚠ 硬性 8。三连概率 = 1 / 符号数², 8 个符号 ⇒ 1.6%; 若 BOSS 轮只放 3-4 种条件,
    //   三连率会跳到 6-11%, 同花加成的基线就与普通轮不一致了(§2.4.4)。改它必须连同下面
    //   两个加成一起改。
    symbolCount: 8,
    reelCount: 3,
    // 同花加成, **加法**并入 K(§5.1)。对子约三分之一的战斗会出现, 所以只能是 +0.50 这个量级;
    // +1.00 会把「掉落翻倍」变成新基线, 反过来让没中对子的三分之二感觉像被惩罚。三连 1.6% 才配 +1.50。
    pairBonus: 0.5,
    tripleBonus: 1.5,
    // 一个符号经过定格线的时长。★ **这是「勉强可读」(§2.4.3)的唯一旋钮**, 与上面两个加成直接耦合:
    //   人类按键精度约 ±60ms, 150ms 的符号间距 ⇒ 主动瞄准某个符号时单槽命中约 40-50%。
    //   调大 = 更可读 = 三连率上升 ⇒ 必须同步下调 tripleBonus; 调小 = 退化成纯抽奖, 关卡零技巧。
    //   将来的「转轮减速」无障碍选项也是动这个数, 且规则必须写在选项旁边, 不能静默惩罚(§11.3)。
    symbolMs: 150,
    // 三条轮子的相位偏移。★ 必须两两不同且不是 symbolMs 的整数倍 ——
    //   同相滚动时玩家「同一时刻按三次」必出三连, 同花加成当场作废。
    reelOffsetMs: [0, 370, 730] as readonly number[],
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
// ⚠ 惩罚已按新回报重新定价: K_energy 全程只有 +0.60(旧版 +1.40), 旧的
//   「力量 +3 / 追加 2 名敌人」会让低档位变成纯亏, 玩家会本能地一个节点都不探索。
//   故追加敌人上限 2→1、力量上限 +3→+2。
// ⚠ 高档位刻意不给敌人「开局护盾」: RULES.combat.clearBlockOnRoundStart 会在第 1 回合
//   开始时把护盾清空, 开局塞 block 等于什么都没做。要加硬度只能走状态(力量/荆棘/再生)。
export const ENERGY_TIERS: EnergyTier[] = [
  {
    tier: 1,
    name: "充盈",
    color: "#8dcc3f",
    min: 80,
    extraEnemies: 0,
    enemyStatuses: [],
    castTickDelta: 0,
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
    rewardMultiplier: 1.1,
  },
  {
    tier: 3,
    name: "衰减",
    color: "#ffd43b",
    min: 40,
    extraEnemies: 0,
    enemyStatuses: [{ id: "strength", stacks: 1 }],
    castTickDelta: 0,
    rewardMultiplier: 1.2,
  },
  {
    tier: 4,
    name: "告急",
    color: "#ff922b",
    min: 20,
    extraEnemies: 1,
    enemyStatuses: [{ id: "strength", stacks: 1 }],
    castTickDelta: -1, // 敌方先手 +1
    rewardMultiplier: 1.35,
  },
  {
    tier: 5,
    name: "枯竭",
    color: "#ff6b6b",
    min: 0,
    extraEnemies: 1,
    enemyStatuses: [{ id: "strength", stacks: 2 }],
    castTickDelta: -2, // 敌方先手 +2
    rewardMultiplier: 1.6,
  },
];
