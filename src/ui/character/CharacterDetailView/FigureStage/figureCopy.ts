// 立绘窗展示文案，与角色数值和养成规则分离。
interface FigureCopy {
  specialty: string;
  quote: string;
}

const COPY: Record<string, FigureCopy> = {
  swordsman: { specialty: "剑锋所向", quote: "在尚未抵达的明天之前，我会继续前进。" },
  prophet: { specialty: "命运回响", quote: "未来尚未落定，答案仍在前方。" },
  botanist: { specialty: "绿意新生", quote: "即使身处废墟，也会有新的萌芽。" },
  alchemist: { specialty: "万象炼成", quote: "每一次尝试，都让未知更近一步。" },
  actuary: { specialty: "胜算在握", quote: "于万千变数之中，找到通往明天的解。" },
};

export function figureCopy(characterId: string): FigureCopy {
  return COPY[characterId] ?? { specialty: "远征队员", quote: "穿过长夜，向着明天前进。" };
}
