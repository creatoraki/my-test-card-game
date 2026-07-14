// ★ 占位角色数据 ★ —— 后期换成正式角色只改这里。
// startingCardIds 引用 cards.ts 里的卡牌 id(可重复, 表示多张)。

export interface CharacterDef {
  id: string;
  name: string;
  emoji: string;
  color: string; // 占位配色(UI 用)
  maxHp: number;
  threat: number; // 初始仇恨
  startingCardIds: string[];
}

export const CHARACTERS: CharacterDef[] = [
  {
    id: "swordsman",
    name: "剑士",
    emoji: "⚔️",
    color: "#78c8ff",
    maxHp: 70,
    threat: 16,
    startingCardIds: [
      "strike",
      "strike",
      "guard",
      "taunt",
      "bash",
      "shot",
      "shot",
      "quickshot",
      "poisonarrow",
      "focus",
      "heal",
      "shieldspell",
      "regenspell",
      "shieldspell",
      "fireball",
      "frost",
      "spark",
      "energize",
    ],
  },
];
