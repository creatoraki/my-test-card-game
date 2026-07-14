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
    id: "warden",
    name: "看守者",
    emoji: "🛡️",
    color: "#6ea8fe",
    maxHp: 70,
    threat: 16, // 坦克, 天生高仇恨
    startingCardIds: ["strike", "strike", "guard", "taunt", "bash"],
  },
  {
    id: "gunner",
    name: "游侠",
    emoji: "🏹",
    color: "#ffd43b",
    maxHp: 52,
    threat: 10,
    startingCardIds: ["shot", "shot", "quickshot", "poisonarrow", "focus"],
  },
  {
    id: "medic",
    name: "医护",
    emoji: "💉",
    color: "#69db7c",
    maxHp: 48,
    threat: 8,
    startingCardIds: ["heal", "shieldspell", "regenspell", "shieldspell"],
  },
  {
    id: "mage",
    name: "术士",
    emoji: "🔮",
    color: "#da77f2",
    maxHp: 46,
    threat: 9,
    startingCardIds: ["fireball", "frost", "spark", "energize"],
  },
];
