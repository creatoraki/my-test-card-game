// 敌人数据。castTick: 行动间隔(时刻); script: 意图脚本(循环), 引用 moves 里的招式 id。
// 招式的 effects 复用与卡牌相同的效果系统。
// 立绘不在此登记 —— 见 ui/enemyArt.ts, 按 id 查表(与 cardArt.ts 同约定, 数据层不碰素材)。

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
    id: "weird-bird",
    name: "怪异的鸟",
    emoji: "🐦", // 兜底: ui/enemyArt.ts 未登记立绘时才会显示
    maxHp: 30,
    castTick: 3,
    moves: [
      {
        id: "peck",
        name: "啄击",
        emoji: "⚔️",
        kind: "attack",
        targeting: "foe",
        effects: [{ type: "DAMAGE", amount: 6, target: "primary" }],
      },
      {
        id: "spore",
        name: "喷孢子",
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
    script: ["peck", "spore", "peck"],
  },
  {
    id: "scrap-bot",
    name: "废品机器人",
    emoji: "🤖", // 兜底: ui/enemyArt.ts 未登记立绘时才会显示
    maxHp: 30,
    castTick: 3,
    moves: [
      {
        id: "peck",
        name: "啄击",
        emoji: "⚔️",
        kind: "attack",
        targeting: "foe",
        effects: [{ type: "DAMAGE", amount: 6, target: "primary" }],
      },
      {
        id: "spore",
        name: "喷孢子",
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
    script: ["peck", "spore", "peck"],
  },
];
