import type { TechBranchDef, TechCategoryDef } from "./types";

export const TECH_CATEGORIES: TechCategoryDef[] = [
  {
    id: "team-enhancement",
    name: "队伍强化",
    desc: "把长期研究转化为全队可用的训练资源。",
    order: 1,
  },
  {
    id: "settlement-economy",
    name: "据点经济",
    desc: "优化回收工艺，让每次远征带回更多价值。",
    order: 2,
  },
];

export const TECH_BRANCHES: TechBranchDef[] = [
  {
    id: "training-system",
    categoryId: "team-enhancement",
    name: "训练体系",
    desc: "扩大队伍训练点的长期供给。",
  },
  {
    id: "recycling-craft",
    categoryId: "settlement-economy",
    name: "回收工艺",
    desc: "提升换金物的回收报价。",
  },
];

export function categoryOf(id: string): TechCategoryDef | undefined {
  return TECH_CATEGORIES.find((category) => category.id === id);
}

export function branchOf(id: string): TechBranchDef | undefined {
  return TECH_BRANCHES.find((branch) => branch.id === id);
}
