// ============================================================================
// 挑战词条定义表 —— 纯数据, 无逻辑。运行时判定见 ./index.ts 与 ./checks.ts。
// dropBonus 直接加进掉落系数 K(explore/core/exploreRules.ts §5.1, 全加法合成), 定价档位:
//   0.3      基础 —— 几乎不要求 build, 只损失一点点操作空间
//   0.4-0.5  中等 —— 明确的节奏或卡组取舍
//   0.6-0.8  高难 —— 需要专门卡组 / 抽牌运 / 一波爆发
// 设计口径与定价理由见 design/挑战词条.md。
// ============================================================================

import type { ChallengeId } from "../types";

export interface ChallengeDef {
  id: ChallengeId;
  title: string;
  desc: string;
  dropBonus: number;
}

export const CHALLENGE_DEFS: Record<ChallengeId, ChallengeDef> = {
  // ── 基础档 0.3 ──
  mercy: {
    id: "mercy",
    title: "慈悲",
    desc: "单次攻击不造成 25 点以上的伤害",
    dropBonus: 0.3,
  },
  no_redraw: {
    id: "no_redraw",
    title: "不改初衷",
    desc: "整场战斗不得使用换牌",
    dropBonus: 0.3,
  },
  slow_start: {
    id: "slow_start",
    title: "养精蓄锐",
    desc: "第 1 回合不打出任何牌",
    dropBonus: 0.3,
  },
  no_wait: {
    id: "no_wait",
    title: "当机立断",
    desc: "整场战斗不得使用等待",
    dropBonus: 0.3,
  },
  content: {
    id: "content",
    title: "知足",
    desc: "整场不通过出牌效果额外抽牌",
    dropBonus: 0.3,
  },
  plain: {
    id: "plain",
    title: "返璞归真",
    desc: "整场只打出基础与普通稀有度的牌",
    dropBonus: 0.3,
  },
  honorable: {
    id: "honorable",
    title: "光明磊落",
    desc: "整场不得对敌人施加任何负面状态",
    dropBonus: 0.3,
  },

  // ── 中等档 0.4-0.5 ──
  restraint: {
    id: "restraint",
    title: "克制",
    desc: "每回合都保留至少 1 点法力值结束回合",
    dropBonus: 0.4,
  },
  no_discard: {
    id: "no_discard",
    title: "敝帚自珍",
    desc: "整场不得丢弃任何手牌",
    dropBonus: 0.4,
  },
  steady: {
    id: "steady",
    title: "稳扎稳打",
    desc: "整场不得打出速攻牌",
    dropBonus: 0.4,
  },
  ascending: {
    id: "ascending",
    title: "循序渐进",
    desc: "同一回合内, 每张牌的费用必须高于上一张",
    dropBonus: 0.4,
  },
  no_heal: {
    id: "no_heal",
    title: "背水一战",
    desc: "整场不得使用治疗卡牌",
    dropBonus: 0.4,
  },
  swift_win: {
    id: "swift_win",
    title: "速战速决",
    desc: "在第 2 回合结束前取胜",
    dropBonus: 0.4,
  },
  regicide: {
    id: "regicide",
    title: "擒贼擒王",
    desc: "第一个倒下的敌人必须是开场时生命上限最高的敌人",
    dropBonus: 0.4,
  },
  focus_fire: {
    id: "focus_fire",
    title: "聚焦",
    desc: "同一回合内造成的所有伤害必须集中于同一名敌人",
    dropBonus: 0.5,
  },
  low_cost: {
    id: "low_cost",
    title: "轻装上阵",
    desc: "整场不得打出费用大于 1 的牌",
    dropBonus: 0.5,
  },

  // ── 高难档 0.6-0.8 ──
  untouched: {
    id: "untouched",
    title: "及时治疗",
    desc: "战斗结束时, 所有成员当前生命 = 当前体力极限",
    dropBonus: 0.6,
  },
  lone_blade: {
    id: "lone_blade",
    title: "独当一面",
    desc: "整场只有一名成员对敌人造成伤害",
    dropBonus: 0.6,
  },
  massacre: {
    id: "massacre",
    title: "大屠杀",
    desc: "同一回合击杀所有目标",
    dropBonus: 0.8,
  },
  rotation: {
    id: "rotation",
    title: "轮转",
    desc: "每回合都至少打出 3 种归属角色不同的牌",
    dropBonus: 0.8,
  },
};

// ⚠ 刻意不做互斥/前置过滤: 冲突组合(轮转×养精蓄锐、聚焦×大屠杀、背水一战×及时治疗,
//   以及上阵不足 3 人时的轮转)照抽 —— 抽到就是少拿一份加成, 由玩家自行承担。
export const CHALLENGE_POOL = Object.keys(CHALLENGE_DEFS) as ChallengeId[];
export const CHALLENGE_PICK = 2;
export const MERCY_MAX_DAMAGE = 25;
export const RESTRAINT_MIN_MANA = 1;
export const ROTATION_MIN_OWNERS = 3;
export const SWIFT_WIN_LAST_ROUND = 2;
