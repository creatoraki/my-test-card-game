// ★ 角色数据 ★ —— 角色**不设等级**, 每人一份固定基础面板(《角色养成设计.md》第一/三章)。
// 长期成长全部来自装备与卡组锻造, 这里的数字进游戏后不会再变。
// startingCardIds / pools 引用 cards.ts 里的卡牌 id(可重复, 表示多张)。

import type { Rarity, StatBlock } from "../engine/types";
import { makeStats } from "../engine/stats";

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
    // 首版基准: HP 50 / 攻击 20 / 防御 10 / 先手 10(《角色养成设计.md》3.0)。
    // 小队贡献 3 手牌 + 1 抽牌 —— 三人合计应为 7 / 2。
    base: makeStats({
      maxHp: 50,
      attack: 20,
      defense: 10,
      initiative: 10,
      critRate: 5,
      critDamage: 150,
      handLimit: 3,
      drawCount: 1,
    }),
    startingCardIds: ["whirlwind-slash", "lightning-infused", "sky-rend"],
    pools: {
      common: [
        "quick-slash",
        "guard-stance",
        "shield-bash",
        "battle-cry",
        "second-wind",
        "heavy-cleave",
      ],
      uncommon: ["focused-edge", "riposte-stance"],
      rare: ["executioner"],
    },
  },
];
