// 敌人数据。招式 delay: 基础蓄力延迟(时刻); exp: 击杀经验。
// 招式的 effects 复用与卡牌相同的效果系统。
// 立绘不在此登记 —— 见 ui/enemyArt.ts, 按 id 查表(与 cardArt.ts 同约定, 数据层不碰素材)。

import type { CardAnim, EffectDescriptor, StatBlock, Targeting } from "../engine/types";
import type { DropEntry } from "../items/types";

export interface EnemyMove {
  id: string;
  name: string;
  emoji: string;
  delay: number; // 招式基础蓄力延迟 D_skill; 实际时长还要叠先手差
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
  exp: number; // 击杀经验; 战后经验 = 各敌人 exp 之和 × 能量档位倍率(见 store/runStore.resolveBattle)
  actsPerRound?: number; // 每回合行动次数上限; 缺省 1, BOSS/稀有怪可配置为 2 及以上
  // 敌人面板。未写的项为 0 —— 未写 defense 就是不减伤, 未写 dodgeRate 就是必被命中。
  // ⚠ attack 是倍率伤害的基数: 首版最弱敌人的基础伤害定在 12~15(《角色养成设计.md》3.0 与第八章)。
  stats?: Partial<StatBlock>;
  moves: EnemyMove[];
  // 掉落表(《探索模式设计.md》§5.2)。chance 是基准概率, 结算时乘统一掉落系数 K。
  //   chance 是**基准**概率, 结算时乘统一掉落系数 K; kind: "family" 的条目才吃 qualityBias。
  dropTable?: DropEntry[];
}

export const ENEMIES: EnemyDef[] = [
  {
    id: "scrap-bot",
    name: "废品机器人",
    emoji: "🤖", // 兜底: ui/enemyArt.ts 未登记立绘时才会显示
    maxHp: 30,
    exp: 10,
    stats: { attack: 14, defense: 0, initiative: 10, critDamage: 150 },
    moves: [
      {
        id: "peck",
        name: "啄击",
        emoji: "⚔️",
        delay: 3,
        kind: "attack",
        targeting: "foe",
        effects: [{ type: "DAMAGE", multiplier: 1.0, target: "primary" }],
      },
      {
        id: "spore",
        name: "喷孢子",
        emoji: "🤢",
        delay: 3,
        kind: "debuff",
        targeting: "foe",
        anim: "poison",
        effects: [
          { type: "DAMAGE", multiplier: 0.3, target: "primary" },
          { type: "APPLY_STATUS", status: "weak", stacks: 1, target: "primary" },
        ],
      },
    ],
    dropTable: [
      { kind: "item", itemId: "sorting-id-chip", chance: 0.4 },
      { kind: "item", itemId: "logic-cube", chance: 0.05 },
      { kind: "item", itemId: "standard-gear", chance: 0.05 },
      { kind: "item", itemId: "standard-battery", chance: 0.05 },
    ],
  },
  // 电线杆机器人: 技能完全复用废品机器人, 仅换立绘与名字。
  {
    id: "pole-bot",
    name: "电线杆机器人",
    emoji: "🤖", // 兜底: ui/enemyArt.ts 未登记立绘时才会显示
    maxHp: 30,
    exp: 10,
    stats: { attack: 14, defense: 0, initiative: 10, critDamage: 150 },
    moves: [
      {
        id: "peck",
        name: "啄击",
        emoji: "⚔️",
        delay: 3,
        kind: "attack",
        targeting: "foe",
        effects: [{ type: "DAMAGE", multiplier: 1.0, target: "primary" }],
      },
      {
        id: "spore",
        name: "喷孢子",
        emoji: "🤢",
        delay: 3,
        kind: "debuff",
        targeting: "foe",
        anim: "poison",
        effects: [
          { type: "DAMAGE", multiplier: 0.3, target: "primary" },
          { type: "APPLY_STATUS", status: "weak", stacks: 1, target: "primary" },
        ],
      },
    ],
    dropTable: [
      { kind: "item", itemId: "high-voltage-insulator", chance: 0.4 },
      { kind: "item", itemId: "logic-cube", chance: 0.05 },
      { kind: "item", itemId: "standard-gear", chance: 0.05 },
      { kind: "item", itemId: "standard-battery", chance: 0.05 },
    ],
  },
  // 收音机机器人: 技能完全复用废品机器人, 仅换立绘与名字。
  {
    id: "radio-bot",
    name: "收音机机器人",
    emoji: "📻", // 兜底: ui/enemyArt.ts 未登记立绘时才会显示
    maxHp: 30,
    exp: 10,
    stats: { attack: 14, defense: 0, initiative: 10, critDamage: 150 },
    moves: [
      {
        id: "peck",
        name: "啄击",
        emoji: "⚔️",
        delay: 3,
        kind: "attack",
        targeting: "foe",
        effects: [{ type: "DAMAGE", multiplier: 1.0, target: "primary" }],
      },
      {
        id: "spore",
        name: "喷孢子",
        emoji: "🤢",
        delay: 3,
        kind: "debuff",
        targeting: "foe",
        anim: "poison",
        effects: [
          { type: "DAMAGE", multiplier: 0.3, target: "primary" },
          { type: "APPLY_STATUS", status: "weak", stacks: 1, target: "primary" },
        ],
      },
    ],
    dropTable: [
      { kind: "item", itemId: "broadcast-tuning-chip", chance: 0.4 },
      { kind: "item", itemId: "logic-cube", chance: 0.05 },
      { kind: "item", itemId: "standard-gear", chance: 0.05 },
      { kind: "item", itemId: "standard-battery", chance: 0.05 },
    ],
  },
];
