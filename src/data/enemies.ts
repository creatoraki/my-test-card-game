// 敌人数据。招式 delay: 基础蓄力延迟(时刻); exp: 击杀经验。
// 招式的 effects 复用与卡牌相同的效果系统。
// 招式 weight 控制抽取相对权重, hitBonus 是该招 DAMAGE 效果的命中修正(百分点)。
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
  weight?: number; // 抽招相对权重; 缺省 1, ≤0 表示不会被抽到
  hitBonus?: number; // 该招所有 DAMAGE 效果的命中修正(百分点); 缺省 0
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
        weight: 1,
        hitBonus: 0,
        effects: [{ type: "DAMAGE", multiplier: 1.0, target: "primary" }],
      },
      {
        id: "spore",
        name: "喷孢子",
        emoji: "🤢",
        delay: 3,
        kind: "debuff",
        targeting: "foe",
        weight: 1,
        hitBonus: 0,
        anim: "poison",
        effects: [
          { type: "DAMAGE", multiplier: 0.3, target: "primary" },
          { type: "APPLY_STATUS", status: "weak", stacks: 1, target: "primary" },
        ],
      },
    ],
    dropTable: [
      { kind: "item", itemId: "bronze-bear", chance: 0.4 },
      { kind: "item", itemId: "sorting-id-chip", chance: 0.4 },
      { kind: "item", itemId: "logic-cube", chance: 0.05 },
      { kind: "item", itemId: "standard-gear", chance: 0.05 },
      { kind: "item", itemId: "standard-battery", chance: 0.05 },
    ],
  },
  {
    id: "pole-bot",
    name: "电线杆机器人",
    emoji: "🤖", // 兜底: ui/enemyArt.ts 未登记立绘时才会显示
    maxHp: 40,
    exp: 15,
    stats: { attack: 15, defense: 0, initiative: 20, critDamage: 150 },
    moves: [
      {
        id: "pole-smash",
        name: "高压重击",
        emoji: "⚔️",
        delay: 4,
        kind: "attack",
        targeting: "foe",
        weight: 2,
        hitBonus: 0,
        anim: "slash",
        effects: [{ type: "DAMAGE", multiplier: 1.1, target: "primary" }],
      },
      {
        id: "pole-arc",
        name: "电弧放电",
        emoji: "⚡",
        delay: 6,
        kind: "attack",
        targeting: "foe",
        weight: 1,
        hitBonus: 0,
        anim: "lightning",
        effects: [{ type: "DAMAGE", multiplier: 0.5, target: "allFoes" }],
      },
    ],
    dropTable: [
      { kind: "item", itemId: "bronze-bear", chance: 0.4 },
      { kind: "item", itemId: "high-voltage-insulator", chance: 0.4 },
      { kind: "item", itemId: "logic-cube", chance: 0.05 },
      { kind: "item", itemId: "standard-gear", chance: 0.05 },
      { kind: "item", itemId: "standard-battery", chance: 0.05 },
    ],
  },
  {
    id: "radio-bot",
    name: "收音机机器人",
    emoji: "📻", // 兜底: ui/enemyArt.ts 未登记立绘时才会显示
    maxHp: 25,
    exp: 10,
    stats: { attack: 14, defense: 0, initiative: 20, critDamage: 150 },
    moves: [
      {
        id: "radio-peck",
        name: "电波啄击",
        emoji: "⚔️",
        delay: 3,
        kind: "attack",
        targeting: "foe",
        weight: 2,
        hitBonus: 0,
        anim: "shot",
        effects: [{ type: "DAMAGE", multiplier: 1.0, target: "primary" }],
      },
      {
        id: "radio-charge",
        name: "天线充能",
        emoji: "🛡️",
        delay: 5,
        kind: "block",
        targeting: "ally",
        weight: 1,
        hitBonus: 0,
        anim: "shield",
        effects: [{ type: "GAIN_SHIELD", amount: 15, target: "self" }],
      },
    ],
    dropTable: [
      { kind: "item", itemId: "bronze-bear", chance: 0.4 },
      { kind: "item", itemId: "broadcast-tuning-chip", chance: 0.4 },
      { kind: "item", itemId: "logic-cube", chance: 0.05 },
      { kind: "item", itemId: "standard-gear", chance: 0.05 },
      { kind: "item", itemId: "standard-battery", chance: 0.05 },
    ],
  },
  {
    id: "sweep-drone",
    name: "清扫无人机",
    emoji: "🛸", // 兜底: ui/enemyArt.ts 未登记立绘时才会显示
    maxHp: 30,
    exp: 12,
    stats: { attack: 14, defense: 0, initiative: 25, critDamage: 150 },
    moves: [
      {
        id: "sweep-bump",
        name: "清扫撞击",
        emoji: "⚔️",
        delay: 3,
        kind: "attack",
        targeting: "foe",
        weight: 2,
        hitBonus: 0,
        anim: "slash",
        effects: [{ type: "DAMAGE", multiplier: 0.5, target: "primary" }],
      },
      {
        id: "sweep-burst",
        name: "高压清扫",
        emoji: "💥",
        delay: 6,
        kind: "attack",
        targeting: "foe",
        weight: 1,
        hitBonus: 0,
        anim: "shot",
        effects: [{ type: "DAMAGE", multiplier: 1.0, target: "primary" }],
      },
    ],
  },
];
