// 敌人数据。招式 delay: 基础蓄力延迟(时刻); exp: 击杀经验。
// 招式的 effects 复用与卡牌相同的效果系统。
// 招式 weight 控制抽取相对权重, hitBonus 是该招 DAMAGE 效果的命中修正(百分点)。
// 立绘不在此登记 —— 见 ui/enemyArt.ts, 按 id 查表(与 cardArt.ts 同约定, 数据层不碰素材)。

import type { CardAnim, EffectDescriptor, EnemyAiScript, StatBlock, Targeting } from "../engine/types";
import type { DropEntry } from "../items/types";

export interface EnemyMove {
  id: string;
  name: string;
  emoji: string;
  delay: number; // 招式基础蓄力延迟 D_skill; 实际时长还要叠先手差
  kind: "attack" | "block" | "buff" | "debuff" | "special";
  targeting: Targeting;
  targetPick?: "random" | "highestShield";
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
  ai?: EnemyAiScript;
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
        weight: 2,
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
          { type: "APPLY_STATUS", status: "weak", stacks: 2, target: "primary" },
        ],
      },
      {
        id: "scrap-overload",
        name: "超载灌注",
        emoji: "🪨",
        delay: 4,
        kind: "debuff",
        targeting: "foe",
        weight: 1,
        hitBonus: 0,
        anim: "buff",
        effects: [{ type: "MARK_CARDS", mark: "heavy", markPick: "handRandom", amount: 1 }],
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
      {
        id: "pole-paralyze",
        name: "麻痹电流",
        emoji: "💫",
        delay: 5,
        kind: "debuff",
        targeting: "foe",
        weight: 1,
        hitBonus: 0,
        anim: "lightning",
        effects: [
          { type: "DAMAGE", multiplier: 0.4, target: "primary" },
          { type: "APPLY_STATUS", status: "stun", stacks: 1, target: "primary" },
        ],
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
      {
        id: "radio-jam",
        name: "干扰噪波",
        emoji: "📡",
        delay: 4,
        kind: "debuff",
        targeting: "foe",
        weight: 1,
        hitBonus: 0,
        anim: "shot",
        effects: [
          { type: "DAMAGE", multiplier: 0.3, target: "primary" },
          { type: "APPLY_STATUS", status: "vulnerable", stacks: 2, target: "primary" },
        ],
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
        delay: 8,
        kind: "attack",
        targeting: "foe",
        weight: 1,
        hitBonus: 0,
        anim: "shot",
        effects: [{ type: "DAMAGE", multiplier: 1.8, target: "primary" }],
      },
      {
        id: "sweep-shred",
        name: "破盾旋刃",
        emoji: "🛡️",
        delay: 4,
        kind: "attack",
        targeting: "foe",
        weight: 1,
        hitBonus: 0,
        anim: "slash",
        effects: [
          {
            type: "DAMAGE",
            multiplier: 0.8,
            target: "primary",
            damageBonus: { when: "targetHasShield", multiplier: 0.8 },
          },
        ],
      },
    ],
  },
  {
    id: "maintenance-spider",
    name: "维修蜘蛛",
    emoji: "🕷️", // 兜底: ui/enemyArt.ts 未登记立绘时才会显示
    maxHp: 28,
    exp: 12,
    // 支援位: 自身输出偏低(attack 12), 靠治疗与护盾把同场机械的有效血量拉起来。
    // 先手 22 略高于清运小怪 —— 支援要抢在挨打之后、下一波攻势之前补上。
    stats: { attack: 12, defense: 1, initiative: 22, critDamage: 150 },
    moves: [
      {
        id: "spider-bite",
        name: "机械撕咬",
        emoji: "⚔️",
        delay: 3,
        kind: "attack",
        targeting: "foe",
        weight: 2,
        hitBonus: 0,
        anim: "slash",
        effects: [{ type: "DAMAGE", multiplier: 0.8, target: "primary" }],
      },
      {
        id: "spider-weld",
        name: "焊接修复",
        emoji: "💚",
        delay: 5,
        kind: "buff",
        // targeting: "ally" 时 AI 把 primary 简化成自身(见 engine/ai.ts), 真正的落点
        // 由 effects 的 target 决定 —— lowestHpAlly 会挑受伤最重的同场机械(可能是它自己)。
        targeting: "ally",
        weight: 1,
        hitBonus: 0,
        anim: "heal",
        // 敌人没有 healPower, 故用 amount 走固定治疗(multiplier 会被算成 0)。
        effects: [{ type: "HEAL", amount: 10, target: "lowestHpAlly" }],
      },
      {
        id: "spider-plating",
        name: "应急镀层",
        emoji: "🛡️",
        delay: 4,
        kind: "block",
        targeting: "ally",
        weight: 1,
        hitBonus: 0,
        anim: "shield",
        effects: [{ type: "GAIN_SHIELD", amount: 12, target: "randomAlly" }],
      },
    ],
    dropTable: [
      { kind: "item", itemId: "bronze-bear", chance: 0.4 },
      { kind: "item", itemId: "self-healing-wire", chance: 0.4 },
      { kind: "item", itemId: "logic-cube", chance: 0.05 },
      { kind: "item", itemId: "standard-gear", chance: 0.05 },
      { kind: "item", itemId: "standard-battery", chance: 0.05 },
    ],
  },
  {
    id: "traffic-light-bot",
    name: "红绿灯机器人",
    emoji: "🚦", // 兜底: ui/enemyArt.ts 未登记立绘时才会显示
    maxHp: 35,
    exp: 14,
    // 纯控制位: 三招全是负面, 伤害倍率刻意压得很低(0.3/0.4/0),
    // 威胁来自易伤放大同场输出、眩晕打断节奏与沉重标记堵手牌, 而不是它自己的伤害。
    stats: { attack: 13, defense: 0, initiative: 18, critDamage: 150 },
    moves: [
      {
        id: "signal-yellow",
        name: "黄灯警示",
        emoji: "🟡",
        delay: 4,
        kind: "debuff",
        targeting: "foe",
        weight: 2,
        hitBonus: 0,
        anim: "shot",
        effects: [
          { type: "DAMAGE", multiplier: 0.3, target: "primary" },
          { type: "APPLY_STATUS", status: "vulnerable", stacks: 2, target: "primary" },
        ],
      },
      {
        id: "signal-red",
        name: "红灯禁行",
        emoji: "🔴",
        delay: 5,
        kind: "debuff",
        targeting: "foe",
        weight: 1,
        hitBonus: 0,
        anim: "lightning",
        effects: [
          { type: "DAMAGE", multiplier: 0.4, target: "primary" },
          { type: "APPLY_STATUS", status: "stun", stacks: 1, target: "primary" },
        ],
      },
      {
        id: "signal-restrict",
        name: "限行标记",
        emoji: "🚧",
        delay: 5,
        kind: "debuff",
        targeting: "foe",
        weight: 1,
        hitBonus: 0,
        anim: "buff",
        // 无伤害的纯堵牌招: 2 张手牌费用 +1 且打出后移除, 比 scrap-overload 更重,
        // 相应地蓄力也更长(5 对 4)。
        effects: [{ type: "MARK_CARDS", mark: "heavy", markPick: "handRandom", amount: 2 }],
      },
    ],
    dropTable: [
      { kind: "item", itemId: "bronze-bear", chance: 0.4 },
      // 暂无专属材料, 复用电线杆机器人的高压绝缘节(同为供电/线路系单位)。
      { kind: "item", itemId: "high-voltage-insulator", chance: 0.4 },
      { kind: "item", itemId: "logic-cube", chance: 0.05 },
      { kind: "item", itemId: "standard-gear", chance: 0.05 },
      { kind: "item", itemId: "standard-battery", chance: 0.05 },
    ],
  },
  {
    id: "scrap-mountain-guardian",
    name: "垃圾山的守护者",
    emoji: "🤖", // 兜底: ui/enemyArt.ts 未登记立绘时才会显示
    maxHp: 150,
    exp: 80,
    actsPerRound: 2,
    stats: { attack: 18, defense: 2, initiative: 20, critDamage: 150 },
    ai: {
      openingMoveId: "guardian-recycle",
      recycleMoveId: "guardian-recycle",
      shredMoveId: "guardian-shred",
      hammerMoveId: "guardian-hammer",
      breatherMoveIds: ["guardian-press", "guardian-slam"],
      breatherWeights: { "guardian-press": 60, "guardian-slam": 40 },
      successors: {
        "guardian-recycle": { "guardian-shred": 30, "guardian-hammer": 10, "guardian-press": 30, "guardian-slam": 30 },
        "guardian-shred": { "guardian-hammer": 20, "guardian-press": 30, "guardian-slam": 35, "guardian-recycle": 15 },
        "guardian-hammer": { "guardian-shred": 25, "guardian-press": 30, "guardian-slam": 30, "guardian-recycle": 15 },
        "guardian-press": { "guardian-shred": 25, "guardian-hammer": 30, "guardian-slam": 25, "guardian-recycle": 20 },
        "guardian-slam": { "guardian-shred": 20, "guardian-hammer": 30, "guardian-press": 20, "guardian-recycle": 30 },
      },
      thresholds: { soloShield: 20, partyShield: 45, nearZeroShield: 8, imbalanceRatio: 1.5, concentration: 60 },
      hammerOverride: 90,
      hammerCooldown: 1,
      recycleInsurance: 2,
      brittleShredBias: 1.5,
    },
    moves: [
      {
        id: "guardian-recycle",
        name: "护盾回收",
        emoji: "🛡️",
        delay: 5,
        kind: "buff",
        targeting: "self",
        anim: "buff",
        effects: [
          { type: "DRAIN_SHIELD", target: "allFoes", amount: 30 },
          { type: "APPLY_STATUS", status: "chargedShell", stacks: 1, target: "self" },
        ],
      },
      {
        id: "guardian-shred",
        name: "碎片倾泻",
        emoji: "🔩",
        delay: 6,
        kind: "attack",
        targeting: "foe",
        anim: "shot",
        effects: [
          {
            type: "DAMAGE",
            multiplier: 0.75,
            target: "allFoes",
            damageBonus: { when: "targetHasNoShield", multiplier: 0.35 },
          },
        ],
      },
      {
        id: "guardian-hammer",
        name: "充能重锤",
        emoji: "🔨",
        delay: 5,
        kind: "attack",
        targeting: "foe",
        targetPick: "highestShield",
        anim: "slash",
        effects: [{ type: "DAMAGE", multiplier: 1.8, target: "primary" }],
      },
      {
        id: "guardian-press",
        name: "压块封锁",
        emoji: "🧱",
        delay: 3,
        kind: "debuff",
        targeting: "foe",
        anim: "buff",
        effects: [
          { type: "DAMAGE", multiplier: 0.35, target: "primary" },
          { type: "APPLY_STATUS", status: "weak", stacks: 2, target: "primary" },
        ],
      },
      {
        id: "guardian-slam",
        name: "守卫重击",
        emoji: "⚔️",
        delay: 4,
        kind: "attack",
        targeting: "foe",
        anim: "slash",
        effects: [{ type: "DAMAGE", multiplier: 1.0, target: "primary" }],
      },
    ],
  },
];
