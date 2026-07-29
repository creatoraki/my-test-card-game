// ============================================================================
// ★ 可配置战斗 / 养成规则 ★
// 口径来自《角色养成设计.md》。该文档第八章列的 6 项"待确认数值"在这里先落一版草案,
// 调平衡只改本文件, 引擎逻辑一律读这些常量。标 ⚠草案 的是我推的、等你定稿的数字。
// ============================================================================

import type { Rarity } from "./types";

export const RULES = {
  // 资源(法力水晶) —— 全队共享一个池, 每回合固定量, 不结转。
  // 首版基准: 3 点(《角色养成设计.md》第六章)。
  resource: {
    name: "mana",
    label: "法力水晶",
    perRound: 3,
    carryOver: false,
  },

  // 手牌 / 抽牌 —— ★ 不再是定值。
  // 小队手牌上限 = Σ上阵角色 handLimit + partyBonusHandLimit
  // 小队抽牌数   = Σ上阵角色 drawCount + partyBonusDrawCount
  hand: {
    // ⚠ 调试期补偿: 设计的首版基准是"三名角色合计 7 手牌 / 2 抽牌", 但目前只有剑士
    //   一名角色(3 / 1), 单人上阵会憋死。三名角色到位后**把这两项归 0**。
    partyBonusHandLimit: 4,
    partyBonusDrawCount: 1,
    minHandLimit: 1,
    // 第 1 回合抽满至手牌上限, 之后每回合只抽 drawCount 张(抽到上限为止)。
    openingDrawToFull: true,
    discardLeftoversOnRoundEnd: false,
  },

  // 时刻(tick) / 敌人排程 —— 本作核心特色
  timeline: {
    startTick: 1,
    normalCardAdvance: 1,
    fastCardAdvance: 0,
    // 回合结束时, 本回合还没行动过的存活敌人各自补行动一次。
    flushEnemiesOnRoundEnd: true,
  },

  // 战斗结算 —— 顺序固定为: 命中 → 暴击 → 防御 → 格挡 → 护盾 → HP
  combat: {
    clearShieldOnRoundStart: true, // 每回合开始清空护盾
    weakMultiplier: 0.75, // 虚弱: 造成攻击伤害 ×
    vulnerableMultiplier: 1.5, // 易伤: 受到伤害 ×

    defenseConstant: 50, // 减伤 = 防御力 / (防御力 + 该常量)
    baseHitChance: 100, // P_base
    hitFloorPct: 5, // 最终命中概率下限
    hitCeilPct: 100, // 最终命中概率上限
    // 暴击率 / 闪避率 / 格挡率 / 异常抗性 的**最终值**硬上限。命中率与精准不受限。
    probCapPct: 70,
    blockReduction: 0.5, // 格挡成功后本次伤害 ×
  },

  // 探索负重 —— 背包固定 32 格; 每占 1 格, 命中/闪避/暴击各 −1 个百分点,
  // 实际惩罚 P = 已占格数 ×(1 − 小队负重适应)。⚠ 背包属 P1, 现在 W 恒为 0。
  burden: {
    backpackSlots: 32,
    penaltyPerSlot: 1,
  },

  // 角色养成 —— ★ 无等级、无属性点。角色面板固定, 经验只用于锻造个人卡组。
  progression: {
    partySize: 3, // 上阵人数上限
    expPerEnemy: 10, // 遭遇战经验 = 敌人数 × 该值
    awakenCost: 150, // 冬眠仓解封一名休眠队员消耗的居民积分
  },

  // 卡组锻造 —— 经验的唯一去处(《角色养成设计.md》第四章)。⚠ 全部为草案数值。
  deck: {
    levelMax: 5,
    // 升到下一级所需经验: 下标 0 = 1→2 级。长度应为 levelMax − 1。
    upgradeCost: [60, 120, 200, 300],
    // 每级抽卡时的稀有度权重(先摇稀有度, 再从该角色对应稀有度的专属池里出候选)。
    // 下标 = 卡组等级 − 1。若该稀有度池为空, 抽取时自动降级到更低稀有度。
    rarityWeights: [
      { common: 90, uncommon: 10, rare: 0 },
      { common: 80, uncommon: 18, rare: 2 },
      { common: 70, uncommon: 25, rare: 5 },
      { common: 60, uncommon: 30, rare: 10 },
      { common: 50, uncommon: 35, rare: 15 },
    ] as Record<Rarity, number>[],
    // 稀有度限携: 单个角色的个人卡组内, 每种稀有度最多携带的张数。
    // ⚠ 硬约束 —— 不能被卡组等级 / 装备 / 模组提高。
    rarityCap: { common: 20, uncommon: 6, rare: 3 } as Record<Rarity, number>,

    initialMinSize: 8, // 个人卡组的初始最小张数下限
    minSizeFloor: 5, // 下限最低可降到几张
    // 把最小下限降 1 所需经验: 下标 0 = 第一次降低。成本递增。
    lowerMinSizeCost: [80, 160, 240],

    drawCost: 30, // 抽一次卡消耗的经验
    drawChoices: 3, // 每次抽卡的候选数(3 选 1)
    removeCost: 20, // 删一张卡消耗的经验
  },

  // 升级: 打+的卡, 数值倍率
  upgrade: {
    amountMultiplier: 1.4,
  },
} as const;

// 把概率类属性(暴击/闪避/格挡/异常抗性)的最终值截到硬上限。
export function capProb(v: number): number {
  return Math.max(0, Math.min(RULES.combat.probCapPct, v));
}

// 卡组从 level 升到 level+1 所需经验; 已满级返回 null。
export function deckUpgradeCost(level: number): number | null {
  return RULES.deck.upgradeCost[level - 1] ?? null;
}

// 把最小卡组下限从 current 再降 1 所需经验; 已到底返回 null。
export function lowerMinSizeCost(current: number): number | null {
  if (current <= RULES.deck.minSizeFloor) return null;
  const step = RULES.deck.initialMinSize - current; // 已经降过几次
  return RULES.deck.lowerMinSizeCost[step] ?? null;
}
