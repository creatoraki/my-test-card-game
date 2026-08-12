// ★ 角色数据 ★ —— 角色**不设等级**, 每人一份固定基础面板(《角色养成设计.md》第一/三章)。
// 长期成长全部来自装备与卡组锻造, 这里的数字进游戏后不会再变。
// startingCardIds / pools 引用 cards.ts 里的卡牌 id(可重复, 表示多张)。

import type { Rarity, StatBlock } from "../engine/types";
import { makeStats } from "../engine/stats";
import { basicStartingCardIds } from "./basicCards";

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
    // 首版基准: HP 50 / 攻击 20 / 治愈力 20 / 防御 10 / 先手 10(《角色养成设计.md》3.0)。
    // 治愈力 20 使基础卡的 50% 治疗/护盾各为 10 点, 与剑士现有辅助牌同档。
    // 小队贡献 3 手牌 + 1 抽牌 —— 三人合计应为 7 / 2。
    base: makeStats({
      maxHp: 50,
      attack: 20,
      healPower: 20,
      defense: 10,
      initiative: 10,
      critRate: 5,
      critDamage: 150,
      handLimit: 3,
      drawCount: 0, // ★ 抽牌走全队固定基准(开局 5 / 每回合 2), 角色只在有加成时才 >0
    }),
    startingCardIds: [...basicStartingCardIds("swordsman"), "crane-form", "buzz"],
    pools: {
      common: [
        "snowflake",
        "buzz",
        "whetstone",
        "mirage",
        "firefly",
        "gale",
      ],
      uncommon: ["swallow-return", "crane-form"],
      rare: ["swarm", "declutter", "rift-light"],
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
      initiative: 10,
      critRate: 5,
      critDamage: 150,
      handLimit: 3,
      drawCount: 0, // ★ 抽牌走全队固定基准(开局 5 / 每回合 2), 角色只在有加成时才 >0
    }),
    startingCardIds: basicStartingCardIds("prophet"),
    // ⚠ 专属抽卡池待设计: 三档都空 ⇒ 锻造抽卡对本角色暂时抽不出东西(forgeDraw 会直接返回)。
    pools: { common: [], uncommon: [], rare: [] },
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
      initiative: 10,
      critRate: 5,
      critDamage: 150,
      handLimit: 3,
      drawCount: 0, // ★ 抽牌走全队固定基准(开局 5 / 每回合 2), 角色只在有加成时才 >0
    }),
    startingCardIds: basicStartingCardIds("botanist"),
    // ⚠ 专属抽卡池待设计: 三档都空 ⇒ 锻造抽卡对本角色暂时抽不出东西(forgeDraw 会直接返回)。
    pools: { common: [], uncommon: [], rare: [] },
  },
];
