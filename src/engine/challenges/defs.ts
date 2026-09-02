// ============================================================================
// 挑战词条定义表 —— 纯数据, 无逻辑。运行时判定见 ./index.ts。
// dropBonus 直接加进掉落系数 K(explore/rules.ts §5.1, 全加法合成), 定价档位:
//   0.3      基础 —— 几乎不要求 build, 只损失一点点操作空间
//   0.4-0.5  中等 —— 明确的节奏或卡组取舍
//   0.6-0.8  高难 —— 需要专门卡组 / 抽牌运 / 一波爆发
// ============================================================================

import type { ChallengeId } from "../types";

export interface ChallengeDef {
  id: ChallengeId;
  title: string;
  icon: string;
  desc: string;
  dropBonus: number;
}

export const CHALLENGE_DEFS: Record<ChallengeId, ChallengeDef> = {
  // ── 基础档 0.3 ──
  mercy: {
    id: "mercy",
    title: "慈悲",
    icon: "🕊",
    desc: "单次攻击不造成 25 点以上的伤害",
    dropBonus: 0.3,
  },
  no_redraw: {
    id: "no_redraw",
    title: "不改初衷",
    icon: "🎴",
    desc: "整场战斗不得使用换牌",
    dropBonus: 0.3,
  },
  slow_start: {
    id: "slow_start",
    title: "养精蓄锐",
    icon: "😴",
    desc: "第 1 回合不打出任何牌",
    dropBonus: 0.3,
  },

  // ── 中等档 0.4-0.5 ──
  restraint: {
    id: "restraint",
    title: "克制",
    icon: "⛓",
    desc: "每回合都保留至少 1 点法力值结束回合",
    dropBonus: 0.4,
  },
  focus_fire: {
    id: "focus_fire",
    title: "聚焦",
    icon: "🔻",
    desc: "同一回合内造成的所有伤害必须集中于同一名敌人",
    dropBonus: 0.5,
  },
  low_cost: {
    id: "low_cost",
    title: "轻装上阵",
    icon: "🪶",
    desc: "整场不得打出费用大于 1 的牌",
    dropBonus: 0.5,
  },

  // ── 高难档 0.6-0.8 ──
  untouched: {
    id: "untouched",
    title: "及时治疗",
    icon: "❤️",
    desc: "战斗结束时, 所有成员当前生命 = 当前体力极限",
    dropBonus: 0.6,
  },
  tempo: {
    id: "tempo",
    title: "抢拍",
    icon: "⏱",
    desc: "每回合都在敌人第一次行动前用完法力水晶",
    dropBonus: 0.6,
  },
  blitz: {
    id: "blitz",
    title: "唯快不破",
    icon: "⚡",
    desc: "整场只打出速攻牌, 不得打出普通牌",
    dropBonus: 0.7,
  },
  massacre: {
    id: "massacre",
    title: "大屠杀",
    icon: "☠",
    desc: "同一回合击杀所有目标",
    dropBonus: 0.8,
  },
  rotation: {
    id: "rotation",
    title: "轮转",
    icon: "🔄",
    desc: "每回合都至少打出 3 种归属角色不同的牌",
    dropBonus: 0.8,
  },
};

// ⚠ 刻意不做互斥/前置过滤: 冲突组合(轮转×养精蓄锐、聚焦×大屠杀、克制×抢拍,
//   以及上阵不足 3 人时的轮转)照抽 —— 抽到就是少拿一份加成, 由玩家自行承担。
export const CHALLENGE_POOL: ChallengeId[] = [
  "restraint",
  "massacre",
  "mercy",
  "rotation",
  "blitz",
  "slow_start",
  "untouched",
  "no_redraw",
  "low_cost",
  "focus_fire",
  "tempo",
];
export const CHALLENGE_PICK = 2;
export const MERCY_MAX_DAMAGE = 25;
export const RESTRAINT_MIN_MANA = 1;
export const ROTATION_MIN_OWNERS = 3;
