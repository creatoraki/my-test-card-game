// ★ 角色数据 ★ —— 角色**不设等级**, 每人一份固定基础面板(《角色养成设计.md》第一/三章)。
// 长期成长全部来自装备与卡组锻造, 这里的数字进游戏后不会再变。
// startingCardIds / pools 引用 cards/ 目录注册的卡牌 id(可重复, 表示多张)。

import type { Rarity, StatBlock } from "../engine/types";
import { makeStats } from "../engine/stats";
import { basicCardId, basicStartingCardIds } from "./basicCards";

export interface CharacterDef {
  id: string;
  name: string;
  emoji: string;
  color: string; // 占位配色(UI 用)
  base: StatBlock; // 固定基础面板
  startingCardIds: string[];
  // 专属抽卡池, 按稀有度分开: 锻造抽卡时先按卡组等级摇稀有度, 再从对应池里出候选。
  // 某档为空时, 抽取会自动降级到更低稀有度(见 townStore.forgeDraw)。
  pools: Record<Rarity, string[]>;
}

export const CHARACTERS: CharacterDef[] = [
  {
    id: "swordsman",
    name: "剑士",
    emoji: "⚔️",
    color: "#78c8ff",
    // 首版基准: HP 50 / 攻击 100 / 治愈力 100 / 防御 0 / 先手 20(《角色养成设计.md》3.0)。
    // 治愈力按 ÷5 结算(RULES.combat.healDivisor), 100 治愈力使基础卡的 50% 治疗/护盾各为 10 点。
    // 手牌上限由 RULES.hand.baseHandLimit 统一提供，角色只保留可叠加的局部修正。
    base: makeStats({
      maxHp: 50,
      attack: 100,
      healPower: 100,
      defense: 0,
      initiative: 20,
      critRate: 5,
      critDamage: 150,
      handLimit: 0,
      drawCount: 0, // ★ 抽牌走全队固定基准(开局 5 / 每回合 2), 角色只在有加成时才 >0
    }),
    startingCardIds: [
      basicCardId("swordsman", "attack"),
      basicCardId("swordsman", "attack"),
      basicCardId("swordsman", "guard"),
      "snowflake",
      "fallen-leaf",
    ],
    pools: {
      common: [
        "snowflake",
        "fallen-leaf",
        "phantom-moon",
        "gale",
        "whetstone",
        "crow",
        "divine-eye",
      ],
      uncommon: [
        "blood-ruin",
        "falling-sakura",
        "spring-sprout",
        "wolf-sparrow",
        "rashomon",
        "crane-dance",
        "whale-kite",
      ],
      rare: ["kagutsuchi", "rift-light", "declutter"],
    },
  },
  {
    id: "prophet",
    name: "预言家",
    emoji: "🔮",
    color: "#b28cff",
    base: makeStats({
      maxHp: 50,
      attack: 100,
      healPower: 100,
      defense: 0,
      initiative: 20,
      critRate: 5,
      critDamage: 150,
      handLimit: 0,
      drawCount: 0, // ★ 抽牌走全队固定基准(开局 5 / 每回合 2), 角色只在有加成时才 >0
    }),
    startingCardIds: [
      basicCardId("prophet", "attack"),
      basicCardId("prophet", "attack"),
      basicCardId("prophet", "heal"),
      "star-shatter",
      "gravity-lens"
    ],
    pools: {
      common: [
        "star-shatter",
        "starfall",
        "gravity-lens",
        "twin-stars",
        "ring-shot",
        "celestial-verdict",
        "star-curtain",
        "brand",
        "prayer",
        "aurora",
        "asteroid-belt",
        "stellar-wind",
        "emergency-treatment",
        "astrometry",
        "star-disc",
      ],
      uncommon: ["astrology"],
      rare: ["traveling-lamp"],
    },
  },
  {
    id: "botanist",
    name: "植物学家",
    emoji: "🌿",
    color: "#8fd67a",
    // ⚠ 占位: 面板照抄剑士的首版基准, 专属数值待设计。
    base: makeStats({
      maxHp: 50,
      attack: 100,
      healPower: 100,
      defense: 0,
      initiative: 20,
      critRate: 5,
      critDamage: 150,
      handLimit: 0,
      drawCount: 0, // ★ 抽牌走全队固定基准(开局 5 / 每回合 2), 角色只在有加成时才 >0
    }),
    startingCardIds: [
      ...basicStartingCardIds("botanist").slice(0, 3),
      "continuous-shot",
      "poison-mushroom",
    ],
    pools: {
      common: [
        "continuous-shot",
        "recycle-shot",
        "twin-flower",
        "agave",
        "photosynthesis",
        "thorn-lash",
        "spore-cloud",
        "insect-trap",
        "salt-moss",
        "root-bond",
        "poison-mushroom",
        "ivy-shelter",
        "wither-spore",
        "purify-nectar",
        "guiding-crown",
        "new-leaf",
        "chaotic-spike",
      ],
      uncommon: ["vine-entangle", "cactus-armor", "blood-vine"],
      // 植物学家的稀有卡池尚未设计。
      rare: [],
    },
  },
  {
    id: "alchemist",
    name: "炼金术士",
    emoji: "⚗️",
    color: "#ff8fc0",
    // ⚠ 占位: 面板照抄剑士的首版基准, 专属数值待设计。
    base: makeStats({
      maxHp: 50,
      attack: 100,
      healPower: 100,
      defense: 0,
      initiative: 20,
      critRate: 5,
      critDamage: 150,
      handLimit: 0,
      drawCount: 0, // ★ 抽牌走全队固定基准(开局 5 / 每回合 2), 角色只在有加成时才 >0
    }),
    startingCardIds: [
      basicCardId("alchemist", "attack"),
      basicCardId("alchemist", "heal"),
      basicCardId("alchemist", "heal"),
      "point-gold-shot",
      "jade-plating",
    ],
    pools: {
      common: [
        "point-gold-shot",
        "bone-acid-rain",
        "catalytic-detonation",
        "phase-spread",
        "jade-plating",
        "retort-wall",
        "dissolve-double",
        "universal-component",
        "reverse-disassembly",
        "constant-temperature-crucible",
      ],
      uncommon: [
        "ember-core-resonance",
        "unfinished-product",
      ],
      rare: ["terminal-mixture", "resonance-tuning"],
    },
  },
];
