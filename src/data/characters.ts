// ★ 占位角色数据 ★ —— 后期换成正式角色只改这里。
// startingCardIds 引用 cards.ts 里的卡牌 id(可重复, 表示多张)。

export interface CharacterDef {
  id: string;
  name: string;
  emoji: string;
  color: string; // 占位配色(UI 用)
  maxHp: number; // 基础生命(属性点收益之外的底值)
  threat: number; // 基础仇恨
  startingCardIds: string[];
  poolCardIds: string[]; // 专属抽卡池: 编队里花属性点 3 选 1 获得(允许重复)
}

export const CHARACTERS: CharacterDef[] = [
  {
    id: "swordsman",
    name: "剑士",
    emoji: "⚔️",
    color: "#78c8ff",
    maxHp: 70,
    threat: 16,
    startingCardIds: ["whirlwind-slash", "lightning-infused", "sky-rend"],
    poolCardIds: [
      "quick-slash",
      "guard-stance",
      "shield-bash",
      "battle-cry",
      "second-wind",
      "heavy-cleave",
    ],
  },
];
