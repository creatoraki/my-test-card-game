import type { TechCost } from "../techCost";
import type { TechNodeDef } from "./types";

export const TECH_TREE_CANVAS = { width: 900, height: 480 } as const;

const cost = (loot: number, materials: TechCost["materials"]): TechCost => ({
  loot,
  materials,
});

export const TECH_NODES: TechNodeDef[] = [
  {
    id: "training-points",
    branchId: "training-system",
    categoryId: "team-enhancement",
    name: "训练点强化",
    desc: "强化训练体系，为小队提供可反复投入的训练点。",
    effectPerLevel: "每级 +1 训练点",
    maxLevel: 10,
    requires: [],
    x: 500,
    y: 240,
    costs: [
      cost(300, [{ itemId: "green-crystal", count: 3 }]),
      cost(600, [{ itemId: "green-crystal", count: 5 }]),
      cost(900, [{ itemId: "green-crystal", count: 8 }]),
      cost(1200, [
        { itemId: "green-crystal", count: 8 },
        { itemId: "blue-crystal", count: 3 },
      ]),
      cost(1500, [
        { itemId: "green-crystal", count: 10 },
        { itemId: "blue-crystal", count: 4 },
      ]),
      cost(1800, [
        { itemId: "green-crystal", count: 12 },
        { itemId: "blue-crystal", count: 5 },
      ]),
      cost(2100, [
        { itemId: "green-crystal", count: 14 },
        { itemId: "blue-crystal", count: 6 },
      ]),
      cost(2400, [
        { itemId: "green-crystal", count: 16 },
        { itemId: "blue-crystal", count: 8 },
        { itemId: "red-crystal", count: 2 },
      ]),
      cost(2700, [
        { itemId: "green-crystal", count: 18 },
        { itemId: "blue-crystal", count: 10 },
        { itemId: "red-crystal", count: 3 },
      ]),
      cost(3000, [
        { itemId: "green-crystal", count: 20 },
        { itemId: "blue-crystal", count: 12 },
        { itemId: "red-crystal", count: 4 },
      ]),
    ],
  },
  {
    id: "scrap-price",
    branchId: "recycling-craft",
    categoryId: "settlement-economy",
    name: "回收溢价",
    desc: "改良回收工艺，提高换金物的居民积分售价。",
    effectPerLevel: "每级换金物售价 +10%",
    maxLevel: 5,
    requires: [],
    x: 500,
    y: 240,
    costs: [
      cost(400, [{ itemId: "green-crystal", count: 3 }]),
      cost(800, [{ itemId: "green-crystal", count: 5 }]),
      cost(1200, [
        { itemId: "green-crystal", count: 8 },
        { itemId: "blue-crystal", count: 3 },
      ]),
      cost(1600, [
        { itemId: "green-crystal", count: 10 },
        { itemId: "blue-crystal", count: 5 },
      ]),
      cost(2000, [
        { itemId: "green-crystal", count: 12 },
        { itemId: "blue-crystal", count: 8 },
        { itemId: "red-crystal", count: 2 },
      ]),
    ],
  },
];
