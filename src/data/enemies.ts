// 敌人数据。castTick: 行动间隔(时刻); script: 意图脚本(循环), 引用 moves 里的招式 id。
// 招式的 effects 复用与卡牌相同的效果系统。
// 立绘不在此登记 —— 见 ui/enemyArt.ts, 按 id 查表(与 cardArt.ts 同约定, 数据层不碰素材)。

import type { CardAnim, EffectDescriptor, StatBlock, Targeting } from "../engine/types";

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
  castTick: number; // 技能基础延迟 D_skill; 实际间隔还要叠先手差(见 engine/stats.enemyActDelay)
  // 敌人面板。未写的项为 0 —— 未写 defense 就是不减伤, 未写 dodgeRate 就是必被命中。
  // ⚠ attack 是倍率伤害的基数: 首版最弱敌人的基础伤害定在 12~15(《角色养成设计.md》3.0 与第八章)。
  stats?: Partial<StatBlock>;
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
    stats: { attack: 12, initiative: 10, critDamage: 150 },
    moves: [
      {
        id: "peck",
        name: "啄击",
        emoji: "⚔️",
        kind: "attack",
        targeting: "foe",
        effects: [{ type: "DAMAGE", multiplier: 1.0, target: "primary" }],
      },
      {
        id: "spore",
        name: "喷孢子",
        emoji: "🤢",
        kind: "debuff",
        targeting: "foe",
        anim: "poison",
        effects: [
          { type: "DAMAGE", multiplier: 0.3, target: "primary" },
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
    stats: { attack: 14, defense: 5, initiative: 10, critDamage: 150 },
    moves: [
      {
        id: "peck",
        name: "啄击",
        emoji: "⚔️",
        kind: "attack",
        targeting: "foe",
        effects: [{ type: "DAMAGE", multiplier: 1.0, target: "primary" }],
      },
      {
        id: "spore",
        name: "喷孢子",
        emoji: "🤢",
        kind: "debuff",
        targeting: "foe",
        anim: "poison",
        effects: [
          { type: "DAMAGE", multiplier: 0.3, target: "primary" },
          { type: "APPLY_STATUS", status: "weak", stacks: 1, target: "primary" },
        ],
      },
    ],
    script: ["peck", "spore", "peck"],
  },
  // 电线杆机器人: 技能完全复用废品机器人(招式/脚本/节奏逐字相同), 仅换立绘与名字。
  {
    id: "pole-bot",
    name: "电线杆机器人",
    emoji: "🤖", // 兜底: ui/enemyArt.ts 未登记立绘时才会显示
    maxHp: 30,
    castTick: 3,
    stats: { attack: 14, defense: 5, initiative: 10, critDamage: 150 },
    moves: [
      {
        id: "peck",
        name: "啄击",
        emoji: "⚔️",
        kind: "attack",
        targeting: "foe",
        effects: [{ type: "DAMAGE", multiplier: 1.0, target: "primary" }],
      },
      {
        id: "spore",
        name: "喷孢子",
        emoji: "🤢",
        kind: "debuff",
        targeting: "foe",
        anim: "poison",
        effects: [
          { type: "DAMAGE", multiplier: 0.3, target: "primary" },
          { type: "APPLY_STATUS", status: "weak", stacks: 1, target: "primary" },
        ],
      },
    ],
    script: ["peck", "spore", "peck"],
  },
  // 收音机机器人: 技能完全复用废品机器人(招式/脚本/节奏逐字相同), 仅换立绘与名字。
  {
    id: "radio-bot",
    name: "收音机机器人",
    emoji: "📻", // 兜底: ui/enemyArt.ts 未登记立绘时才会显示
    maxHp: 30,
    castTick: 3,
    stats: { attack: 14, defense: 5, initiative: 10, critDamage: 150 },
    moves: [
      {
        id: "peck",
        name: "啄击",
        emoji: "⚔️",
        kind: "attack",
        targeting: "foe",
        effects: [{ type: "DAMAGE", multiplier: 1.0, target: "primary" }],
      },
      {
        id: "spore",
        name: "喷孢子",
        emoji: "🤢",
        kind: "debuff",
        targeting: "foe",
        anim: "poison",
        effects: [
          { type: "DAMAGE", multiplier: 0.3, target: "primary" },
          { type: "APPLY_STATUS", status: "weak", stacks: 1, target: "primary" },
        ],
      },
    ],
    script: ["peck", "spore", "peck"],
  },
];
