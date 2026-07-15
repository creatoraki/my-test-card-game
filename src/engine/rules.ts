// ============================================================================
// ★ 可配置战斗规则 ★
// 这里集中放"你要自己设计得更复杂"的战斗规则。先给占位默认让游戏能跑,
// 后续调平衡/改机制主要就改这个文件, 引擎逻辑读取这些常量。
// ============================================================================

export const RULES = {
  // 资源(法力水晶)经济 —— 占位默认: 全队共享一个池, 每回合固定量, 不结转。
  // 以后可扩展成: 每角色独立池 / 结转 / 上限 / 连锁产出等。
  resource: {
    name: "mana",
    label: "法力水晶",
    perRound: 3,
    carryOver: false,
  },

  // 手牌 / 抽牌
  hand: {
    size: 5,
    drawToFullEachRound: true, // 每回合开始补牌至手牌上限
    discardLeftoversOnRoundEnd: false, // 回合结束是否弃掉剩余手牌
  },

  // 时刻(tick) / 敌人排程 —— 本作核心特色
  timeline: {
    startTick: 1, // 每回合从第 1 时刻开始
    normalCardAdvance: 1, // 普通牌推进的时刻
    fastCardAdvance: 0, // 速攻牌推进的时刻
    // 回合结束时, 本回合还没行动过的存活敌人各自补行动一次(保证每回合至少被打一次)。
    // 关掉它 → 只有玩家把时刻推进到敌人倒计时时, 敌人才会行动。
    flushEnemiesOnRoundEnd: true,
  },

  // 战斗基础数值
  combat: {
    clearBlockOnRoundStart: true, // 每回合开始清空护盾
    weakMultiplier: 0.75, // 虚弱: 造成攻击伤害 ×
    vulnerableMultiplier: 1.5, // 易伤: 受到伤害 ×
  },

  // 仇恨
  aggro: {
    baseThreat: 10,
    // "highest" 取最高仇恨(平局取靠前); "weighted" 按仇恨加权随机
    mode: "highest" as "highest" | "weighted",
  },

  // 升级: 打+的卡, 数值倍率
  upgrade: {
    amountMultiplier: 1.4,
  },

  // 角色养成 —— 等级 / 属性点 / 抽卡改造。
  // 升级不涨基础属性, 只发属性点; 属性点要么加四维, 要么抽卡扩充个人卡组。
  progression: {
    partySize: 3, // 上阵人数上限
    levelUpPoints: 5, // 每级获得的属性点
    expPerEnemy: 10, // 遭遇战经验 = 敌人数 × 该值
    expBase: 30, // 升至下一级所需 = expBase + expGrowth × (level - 1)
    expGrowth: 15,
    hpPerPoint: 3, // 每点生命 → 生命上限 +3
    attackPerPoint: 1, // 每点攻击 → 本人卡牌 DAMAGE 效果 +1
    defensePerPoint: 1, // 每点防御 → 本人卡牌 GAIN_BLOCK 效果 +1
    threatPerPoint: 2, // 每点仇恨 → 初始仇恨 +2
    drawCost: 2, // 抽一次卡消耗的属性点
    drawChoices: 3, // 每次抽卡的候选数(3 选 1)
  },
} as const;

// 升至下一级所需经验(level → level+1)。线性递增, 调曲线只动 RULES.progression。
export function expToNext(level: number): number {
  return RULES.progression.expBase + RULES.progression.expGrowth * (level - 1);
}
