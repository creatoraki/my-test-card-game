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
} as const;
