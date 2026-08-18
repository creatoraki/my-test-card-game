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
    // 首版基准: HP 50 / 攻击 20 / 治愈力 20 / 防御 10 / 先手 20(《角色养成设计.md》3.0)。
    // 治愈力 20 使基础卡的 50% 治疗/护盾各为 10 点, 与剑士现有辅助牌同档。
    // 手牌上限由 RULES.hand.baseHandLimit 统一提供，角色只保留可叠加的局部修正。
    base: makeStats({
      maxHp: 50,
      attack: 20,
      healPower: 20,
      defense: 10,
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
      "buzz",
    ],
    pools: {
      common: [
        "snowflake",
        "buzz",
        "whetstone",
        "mirage",
        "firefly",
        "gale",
        "selfless-guard",
        "autumn-rain",
        "torafuri",
        "cloud-veil",
        "yoroidoshi",
        "quick-guard",
        "demon-edge",
        "crane-dance",
        "wolf-sparrow",
      ],
      uncommon: [
        "swallow-return",
        "crane-form",
        "still-water",
        "spring-sprout",
        "zanshin",
        "issen",
        "falling-sakura",
        "condensed-frost",
      ],
      rare: [
        "swarm",
        "declutter",
        "rift-light",
        "light-blade",
        "buzhou-mountain",
        "moon-shadow",
        "scatter",
        "thousand-mountain-snow",
        "divine-eye",
      ],
    },
  },
  {
    id: "prophet",
    name: "预言家",
    emoji: "🔮",
    color: "#b28cff",
    // ⚠ 占位: 面板照抄剑士的首版基准, 专属数值待设计。
    base: makeStats({
      maxHp: 50,
      attack: 20,
      healPower: 20,
      defense: 10,
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
      "prayer",
      "emergency-treatment"
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
      attack: 20,
      healPower: 20,
      defense: 10,
      initiative: 20,
      critRate: 5,
      critDamage: 150,
      handLimit: 0,
      drawCount: 0, // ★ 抽牌走全队固定基准(开局 5 / 每回合 2), 角色只在有加成时才 >0
    }),
    startingCardIds: [
      ...basicStartingCardIds("botanist").slice(0, 3),
      "continuous-shot",
      "twin-flower",
    ],
    pools: {
      common: ["continuous-shot", "recycle-shot", "twin-flower", "agave", "photosynthesis"],
      // 植物学家的罕见卡池尚未设计。
      uncommon: [],
      // 植物学家的稀有卡池尚未设计。
      rare: [],
    },
  },
];
