// ============================================================================
// ★ 可配置探索规则 ★ —— 与 engine/rules.ts 同惯例: 所有旋钮集中在这一个文件。
// 调探索层平衡(手牌上限 / 抽牌数 / 危险度档位与收益 / 场地能力代价)只改这里。
// ============================================================================

import type { DangerTier } from "./types";

export const EXPLORE_RULES = {
  handSize: 7, // 手牌上限。只约束事件卡 —— 路线牌(遭遇/BOSS/撤退)不占位
  openingDraw: 3, // 起手抽牌数
  drawPerBattle: 2, // 每场战斗胜利后抽牌数
  defaultEventDanger: 1, // 事件卡未声明 danger 时的默认值(见 data/explore.ts)

  dangerPerTier: 3, // 每 3 点危险度跳一档 ⇒ 事件卡默认 +1 ⇒ 打 3 张跳一档
  dangerMax: 15, // 危险度数值封顶(档位在第 5 档封顶, 数值仍继续累加到此上限)

  // 场地能力: 三个按钮各自把一种东西换成另一种 —— 危险度→牌 / 牌→血 / 牌→危险度下降
  abilities: {
    scout: { danger: 1, draw: 1 }, // 搜寻: 危险度 +1 → 抽 1 张
    rest: { discard: 2, healPercent: 0.25 }, // 休整: 弃 2 张 → 全队回 25% 最大 HP
    conceal: { discard: 2, danger: -1 }, // 隐匿: 弃 2 张 → 危险度 -1
  },

  // 战利品(残片): 基础产出。战斗产出会再乘上档位倍率。
  loot: {
    perEnemy: 6, // 普通战斗: 敌人数 × 该值
    bossBonus: 60, // BOSS 战额外
  },

  // BOSS 的额外缩放(在档位表之上再叠一层, 读开打瞬间的危险度)
  boss: {
    hpPerTier: 0.15, // maxHp × (1 + 0.15 × (档位-1))
    lootPerTier: 0.4, // 掉落 × (1 + 0.4 × (档位-1))
    guardFromTier: 4, // 第 4 档起追加一个护卫
  },

  // 团灭惩罚。残片全丢, 经验照发(经验在每场战斗后即时入账, 见 runStore)。
  // 若日后觉得玩家过于无所顾忌地冲高危险度, 加重从这里开始。
  wipe: {
    lootKept: 0,
  },
} as const;

// ---------------------------------------------------------------------------
// 危险度档位表
// ---------------------------------------------------------------------------
// 分档而非连续数值, 是因为决策发生在「跨档的那一手」——
// 玩家看到「再打一张就跳档」会真的停下来算一算; 连续数值只会让人麻木地点下去。
//
// ⚠ 高档位刻意不给敌人「开局护盾」: RULES.combat.clearBlockOnRoundStart 会在第 1 回合
// 开始时把护盾清空, 开局塞 block 等于什么都没做。要加硬度只能走状态(力量/荆棘/再生)。
export const DANGER_TIERS: DangerTier[] = [
  {
    tier: 1,
    name: "平静",
    color: "#7f9aa6",
    min: 0,
    extraEnemies: 0,
    enemyStatuses: [],
    castTickDelta: 0,
    rewardMultiplier: 1.0,
  },
  {
    tier: 2,
    name: "骚动",
    color: "#ffd43b",
    min: 3,
    extraEnemies: 0,
    enemyStatuses: [{ id: "strength", stacks: 1 }],
    castTickDelta: 0,
    rewardMultiplier: 1.3,
  },
  {
    tier: 3,
    name: "警戒",
    color: "#ff922b",
    min: 6,
    extraEnemies: 1,
    enemyStatuses: [{ id: "strength", stacks: 1 }],
    castTickDelta: 0,
    rewardMultiplier: 1.6,
  },
  {
    tier: 4,
    name: "危险",
    color: "#ff6b6b",
    min: 9,
    extraEnemies: 1,
    enemyStatuses: [{ id: "strength", stacks: 2 }],
    castTickDelta: -1,
    rewardMultiplier: 2.0,
  },
  {
    tier: 5,
    name: "猩红",
    color: "#c92a2a",
    min: 12,
    extraEnemies: 2,
    enemyStatuses: [{ id: "strength", stacks: 3 }],
    castTickDelta: -1,
    rewardMultiplier: 2.6,
  },
];
