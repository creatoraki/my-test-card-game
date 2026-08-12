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

  // 手牌 / 抽牌
  // 小队手牌上限 = Σ上阵角色 handLimit + partyBonusHandLimit
  // 小队每回合抽牌数 = partyBonusDrawCount(全队基准) + Σ上阵角色 drawCount
  // 开局(第 1 回合)抽牌数 = openingDrawCount + Σ上阵角色 drawCount
  hand: {
    // ⚠ 调试期补偿: 手牌上限设计首版基准是"三名角色合计 7 手牌", 目前角色不齐,
    //   靠这个全队修正兜底; 三名角色到位后**归 0**。
    partyBonusHandLimit: 4,
    // ★ 抽牌走固定基准: 角色 drawCount 目前一律 0, 只有装备/成长才加成。
    openingDrawCount: 5, // 开局抽 5 张
    partyBonusDrawCount: 2, // 之后每回合抽 2 张
    minHandLimit: 1,
    discardLeftoversOnRoundEnd: false,
  },

  discard: {
    reasons: {
      manual: { trigger: true, count: true },
      effect: { trigger: true, count: true },
      cost: { trigger: true, count: true },
      redraw: { trigger: false, count: false },
      roundEnd: { trigger: false, count: false },
      play: { trigger: false, count: false },
    },
  },

  // 时刻(tick) / 敌人排程 —— 本作核心特色
  timeline: {
    startTick: 1,
    normalCardAdvance: 1,
    fastCardAdvance: 0,
    waitAdvance: 1,
    waitsPerRound: 1,
    // 回合结束时, 本回合还没行动过的存活敌人各自补行动一次。
    flushEnemiesOnRoundEnd: true,
  },

  // 战斗结算 —— 顺序固定为: 命中 → 暴击 → 防御 → 格挡 → 护盾 → HP
  combat: {
    clearShieldOnRoundStart: true, // 每回合开始清空护盾
    weakMultiplier: 0.75, // 虚弱: 造成攻击伤害 ×
    sharpMultiplier: 1.15, // 锋利: 造成攻击伤害 ×
    vulnerableMultiplier: 1.5, // 易伤: 受到伤害 ×

    defenseConstant: 30, // 减伤 = 防御力 / (防御力 + 该常量)
    baseHitChance: 100, // P_base
    hitFloorPct: 5, // 最终命中概率下限
    hitCeilPct: 100, // 最终命中概率上限
    // 暴击率 / 闪避率 / 格挡率 / 异常抗性 的**最终值**硬上限。命中率与精准不受限。
    probCapPct: 70,
    blockReduction: 0.5, // 格挡成功后本次伤害 ×
  },

  // 探索负重 —— 背包固定 24 格; 每占 1 格, 命中/闪避/暴击各 −1 个百分点,
  // 实际惩罚 P = 已占格数 ×(1 − 小队负重适应)。⚠ 背包属 P1, 现在 W 恒为 0。
  burden: {
    backpackSlots: 24,
    penaltyPerSlot: 1,
  },

  // 角色养成 —— ★ 无等级、无属性点。角色面板固定, 经验只用于锻造个人卡组。
  progression: {
    partySize: 3, // 上阵人数上限
    expPerEnemy: 10, // 敌人 exp 的参考基准值, 实际结算读取 EnemyDef.exp
    awakenCost: 150, // 冬眠仓解封一名休眠队员消耗的居民积分
  },

  // 卡组锻造 —— 经验的唯一去处(《角色养成设计.md》第四章)。⚠ 全部为草案数值。
  deck: {
    levelMax: 6,
    // 升到下一级所需经验: 下标 0 = 1→2 级。长度应为 levelMax − 1。
    upgradeCost: [100, 300, 500, 800, 1200],
    // 每级抽卡时的稀有度权重(先摇稀有度, 再从该角色对应稀有度的专属池里出候选)。
    // 下标 = 卡组等级 − 1。若该稀有度池为空, 抽取时自动降级到更低稀有度。
    rarityWeights: [
      { common: 80, uncommon: 20, rare: 0 },
      { common: 75, uncommon: 25, rare: 0 },
      { common: 68, uncommon: 27, rare: 5 },
      { common: 60, uncommon: 30, rare: 10 },
      { common: 50, uncommon: 35, rare: 15 },
      { common: 40, uncommon: 40, rare: 20 },
    ] as Record<Rarity, number>[],
    // 稀有度限携: 单个角色的个人卡组内, 每种稀有度最多携带的张数。
    // ⚠ 硬约束 —— 不能被卡组等级 / 装备 / 模组提高。
    rarityCap: { common: 20, uncommon: 6, rare: 3 } as Record<Rarity, number>,

    initialMinSize: 8, // 个人卡组的初始最小张数下限
    minSizeFloor: 5, // 下限最低可降到几张
    // 把最小下限降 1 所需经验: 下标 0 = 第一次降低。成本递增。
    lowerMinSizeCost: [80, 160, 240],

    drawCostBase: 50, // 今日第一次扩充卡组消耗的经验, 之后按次数递增
    drawChoices: 3, // 每次抽卡的候选数(3 选 1)
    removeCostBase: 100, // 今日第一次精简卡组消耗的经验
    removeCostStep: 50, // 精简卡组每日每次递增的经验
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

// 该卡组等级的稀有度相对权重。level 会被夹到 [1, levelMax]。
export function deckRarityWeights(level: number): Record<Rarity, number> {
  const index = Math.max(0, Math.min(RULES.deck.levelMax, Math.floor(level)) - 1);
  return RULES.deck.rarityWeights[index] ?? RULES.deck.rarityWeights[0];
}

// 归一化成百分比的抽取概率；空卡池不计入分母，与实际抽卡降级口径一致。
export function deckRarityChances(
  level: number,
  hasPool: Record<Rarity, boolean> = { common: true, uncommon: true, rare: true },
): Record<Rarity, number> {
  const weights = deckRarityWeights(level);
  const rarities: Rarity[] = ["common", "uncommon", "rare"];
  const total = rarities.reduce((sum, rarity) => sum + (hasPool[rarity] ? weights[rarity] : 0), 0);
  if (total <= 0) return { common: 0, uncommon: 0, rare: 0 };
  return {
    common: hasPool.common ? (weights.common / total) * 100 : 0,
    uncommon: hasPool.uncommon ? (weights.uncommon / total) * 100 : 0,
    rare: hasPool.rare ? (weights.rare / total) * 100 : 0,
  };
}

// 今日第 usedToday+1 次扩充所需经验。不封顶。
export function drawCostToday(usedToday: number): number {
  return RULES.deck.drawCostBase * (Math.max(0, usedToday) + 1);
}

// 今日第 usedToday+1 次精简所需经验。不封顶。
export function removeCostToday(usedToday: number): number {
  return RULES.deck.removeCostBase + RULES.deck.removeCostStep * Math.max(0, usedToday);
}

// 把最小卡组下限从 current 再降 1 所需经验; 已到底返回 null。
export function lowerMinSizeCost(current: number): number | null {
  if (current <= RULES.deck.minSizeFloor) return null;
  const step = RULES.deck.initialMinSize - current; // 已经降过几次
  return RULES.deck.lowerMinSizeCost[step] ?? null;
}
