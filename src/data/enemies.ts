// ★ 占位敌人数据 ★ —— 后期换成正式敌人只改这里。
// castTick: 行动间隔(时刻); script: 意图脚本(循环), 引用 moves 里的招式 id。
// 招式的 effects 复用与卡牌相同的效果系统。

import type { CardAnim, EffectDescriptor, Targeting } from "../engine/types";

export interface EnemyMove {
  id: string;
  name: string;
  emoji: string;
  kind: "attack" | "block" | "buff" | "debuff" | "special";
  targeting: Targeting;
  effects: EffectDescriptor[];
  anim?: CardAnim; // 招式动画类型(纯表现)。缺省时 UI 按效果兜底推断(见 ui/animations.ts moveAnim)。
}

export interface EnemyDef {
  id: string;
  name: string;
  emoji: string;
  maxHp: number;
  castTick: number;
  moves: EnemyMove[];
  script: string[];
}

export const ENEMIES: EnemyDef[] = [
  {
    id: "slime",
    name: "史莱姆",
    emoji: "🟢",
    maxHp: 30,
    castTick: 3,
    moves: [
      {
        id: "hit",
        name: "撞击",
        emoji: "⚔️",
        kind: "attack",
        targeting: "foe",
        effects: [{ type: "DAMAGE", amount: 6, target: "primary" }],
      },
      {
        id: "spit",
        name: "吐酸",
        emoji: "🤢",
        kind: "debuff",
        targeting: "foe",
        anim: "poison",
        effects: [
          { type: "DAMAGE", amount: 3, target: "primary" },
          { type: "APPLY_STATUS", status: "weak", stacks: 1, target: "primary" },
        ],
      },
    ],
    script: ["hit", "spit", "hit"],
  },
  {
    id: "goblin",
    name: "哥布林",
    emoji: "👺",
    maxHp: 22,
    castTick: 2,
    moves: [
      {
        id: "stab",
        name: "突刺",
        emoji: "🗡️",
        kind: "attack",
        targeting: "foe",
        effects: [{ type: "DAMAGE", amount: 5, target: "primary" }],
      },
      {
        id: "sharpen",
        name: "磨刀",
        emoji: "💪",
        kind: "buff",
        targeting: "self",
        effects: [{ type: "APPLY_STATUS", status: "strength", stacks: 2, target: "self" }],
      },
    ],
    script: ["stab", "stab", "sharpen"],
  },
  {
    id: "bat",
    name: "蝙蝠",
    emoji: "🦇",
    maxHp: 12,
    castTick: 1, // 极快: 若玩家频繁推进时刻, 它会多次行动
    moves: [
      {
        id: "bite",
        name: "撕咬",
        emoji: "🦷",
        kind: "attack",
        targeting: "foe",
        effects: [{ type: "DAMAGE", amount: 3, target: "primary" }],
      },
    ],
    script: ["bite"],
  },
  {
    id: "brute",
    name: "巨兽",
    emoji: "👹",
    maxHp: 60,
    castTick: 4, // 很慢, 但一击很重
    moves: [
      {
        id: "guard",
        name: "铁壁",
        emoji: "🛡️",
        kind: "block",
        targeting: "self",
        effects: [{ type: "GAIN_BLOCK", amount: 10, target: "self" }],
      },
      {
        id: "smash",
        name: "巨击",
        emoji: "💥",
        kind: "attack",
        targeting: "foe",
        anim: "fire",
        effects: [{ type: "DAMAGE", amount: 14, target: "primary" }],
      },
      {
        id: "roar",
        name: "咆哮",
        emoji: "📢",
        kind: "debuff",
        targeting: "none",
        anim: "lightning",
        effects: [{ type: "APPLY_STATUS", status: "vulnerable", stacks: 1, target: "allFoes" }],
      },
    ],
    script: ["guard", "smash", "roar", "smash"],
  },
];
