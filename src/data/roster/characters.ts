// ★ 角色数据 ★ —— 角色**不设等级**, 每人一份固定基础面板(《角色养成设计.md》第一/三章)。
// 长期成长全部来自装备与卡组锻造, 这里的数字进游戏后不会再变。
// startingCardIds / pools 引用 cards/ 目录注册的卡牌 id(可重复, 表示多张)。

import type { Rarity, StatBlock } from "@/engine/types";
import { makeStats } from "@/engine/combat/stats";
import { basicCardId, basicStartingCardIds } from "../cards/neutral/basicCards";

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
    // 首版基准: HP 65 / 攻击 100 / 治愈力 100 / 防御 0 / 先手 20 / 闪避 15(《角色养成设计.md》3.0)。
    // 闪避 15 与怪物基础命中 5 配套 —— 空包时角色约有 10% 几率闪开怪物攻击。
    // 治愈力按 ÷5 结算(RULES.combat.healDivisor), 100 治愈力使基础卡的 50% 治疗/护盾各为 10 点。
    base: makeStats({
      maxHp: 70,
      attack: 105,
      healPower: 90,
      defense: 5,
      initiative: 20,
      dodgeRate: 15,
      critRate: 10,
      critDamage: 150,
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
        "spring-sprout",
        "wolf-sparrow",
        "whetstone",
        "rashomon",
        "crane-dance",
        "whale-kite",
        "flying-plum",
        "red-tide",
        "iron-cloak",
        "windcut",
        "thunder-run",
      ],
      uncommon: [
        "kagutsuchi",
        "blood-ruin",
        "falling-sakura",
        "declutter",
        "crow",
        "divine-eye",
        "yachiyo",
        "divine-sight",
        "sheathe",
        "shigure",
      ],
      rare: ["rift-light", "avidya", "sword-mound", "mirror-moon", "zanshin"],
    },
  },
  {
    id: "prophet",
    name: "预言家",
    emoji: "🔮",
    color: "#b28cff",
    base: makeStats({
      maxHp: 60,
      attack: 100,
      healPower: 100,
      defense: 0,
      initiative: 20,
      dodgeRate: 15,
      critRate: 10,
      critDamage: 150,
    }),
    startingCardIds: [
      basicCardId("prophet", "attack"),
      basicCardId("prophet", "attack"),
      basicCardId("prophet", "heal"),
      "countercurrent",
      "emergency-care",
    ],
    pools: {
      common: [
        "twin-stars",
        "ring-shot",
        "starfall",
        "moon-landing",
        "gravity-lens",
        "emergency-care",
        "solar-wind",
        "asteroid-belt",
        "andromeda",
        "drift",
        "astrology",
        "foresight-eye",
        "spectral-decomposition",
      ],
      uncommon: ["countercurrent", "zenith-star", "gravity-tow", "omen", "black-hole"],
      rare: ["falling-star-sequence", "domino"],
    },
  },
  {
    id: "botanist",
    name: "植物学家",
    emoji: "🌿",
    color: "#8fd67a",
    // ⚠ 占位: 面板照抄剑士的首版基准, 专属数值待设计。
    base: makeStats({
      maxHp: 65,
      attack: 90,
      healPower: 100,
      defense: 0,
      initiative: 20,
      dodgeRate: 15,
      critRate: 5,
      critDamage: 160,
    }),
    startingCardIds: [
      ...basicStartingCardIds("botanist").slice(0, 3),
      "continuous-shot",
      "poison-mushroom",
    ],
    pools: {
      common: [
        "continuous-shot",
        "thorn-lash",
        "wither-spore",
        "poison-mushroom",
        "salt-moss",
        "insect-trap",
        "twin-flower",
        "agave",
        "photosynthesis",
        "spore-cloud",
        "ivy-shelter",
        "purify-nectar",
        "guiding-crown",
        "new-leaf",
      ],
      uncommon: ["vine-entangle", "cactus-armor", "blood-vine", "chaotic-spike"],
      rare: ["recycle-shot", "root-bond"],
    },
  },
  {
    id: "alchemist",
    name: "炼金术士",
    emoji: "⚗️",
    color: "#ff8fc0",
    // ⚠ 占位: 面板照抄剑士的首版基准, 专属数值待设计。
    base: makeStats({
      maxHp: 65,
      attack: 95,
      healPower: 105,
      defense: 5,
      initiative: 20,
      dodgeRate: 15,
      critRate: 0,
      critDamage: 150,
    }),
    startingCardIds: [
      basicCardId("alchemist", "attack"),
      basicCardId("alchemist", "heal"),
      basicCardId("alchemist", "heal"),
      "ignition-reagent",
      "jade-plating",
    ],
    pools: {
      common: [
        "ignition-reagent",
        "bone-acid-rain",
        "catalytic-detonation",
        "phase-spread",
        "jade-plating",
        "thermal-recovery",
        "ember-wall",
        "universal-component",
        "reverse-disassembly",
        "unfinished-product",
      ],
      uncommon: [
        "ember-core-resonance",
        "phlogiston-blast",
        "retort-wall",
        "constant-temperature-crucible",
        "eternal-furnace-core",
      ],
      rare: ["terminal-mixture", "resonance-tuning", "buffer-solution"],
    },
  },
  {
    id: "actuary",
    name: "精算师",
    emoji: "🧾",
    color: "#f2c66d",
    // ⚠ 占位: 面板照抄首版基准, 专属数值待设计。
    base: makeStats({
      maxHp: 70,
      attack: 90,
      healPower: 110,
      defense: 5,
      initiative: 20,
      dodgeRate: 15,
      critRate: 0,
      critDamage: 150,
    }),
    startingCardIds: [
      basicCardId("actuary", "attack"),
      basicCardId("actuary", "heal"),
      basicCardId("actuary", "guard"),
      "initial-premium",
      "emergency-disbursement",
    ],
    pools: {
      common: [
        "initial-premium",
        "emergency-disbursement",
        "echo-consultation",
        "deductible-clause",
        "early-claim",
        "policy-pledge",
        "risk-reserve",
        "subrogation",
      ],
      uncommon: [],
      rare: [],
    },
  },
];
