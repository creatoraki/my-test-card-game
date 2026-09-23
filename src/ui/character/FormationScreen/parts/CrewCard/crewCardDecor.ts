// 编队卡的纯装饰数据: 职业英文名。只服务卡面排版, 不进 data/ 的角色定义。
// 未登记的角色退回 id 大写, 新角色不必同步改这里也能显示。

const CREW_EN_NAMES: Record<string, string> = {
  swordsman: "SWORDSMAN",
  prophet: "ORACLE",
  botanist: "BOTANIST",
  alchemist: "ALCHEMIST",
  actuary: "ACTUARY",
};

export function crewEnName(charId: string): string {
  return CREW_EN_NAMES[charId] ?? charId.toUpperCase();
}

/** 卡阵序号: 01、02 …… */
export function crewSerial(index: number): string {
  return String(index + 1).padStart(2, "0");
}
