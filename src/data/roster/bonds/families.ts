// 羁绊系别 —— 定向重铸(选系别)与地图掉落偏向(每张图偏向 2 个系别)都读这里。

import type { BondFamily } from "./types";

export interface BondFamilyDef {
  id: BondFamily;
  name: string;
  theme: string;
}

export const BOND_FAMILIES: BondFamilyDef[] = [
  { id: "blade", name: "锋刃", theme: "输出方式" },
  { id: "bulwark", name: "壁垒", theme: "生存方式" },
  { id: "chrono", name: "时序", theme: "时刻轴" },
  { id: "flow", name: "流转", theme: "牌与法力" },
  { id: "etch", name: "蚀刻", theme: "增益与减益" },
  { id: "karma", name: "因果", theme: "代价与回报" },
];

export function bondFamilyName(id: BondFamily): string {
  return BOND_FAMILIES.find((family) => family.id === id)?.name ?? "";
}

// 地图掉落偏向: 装备掉落时 60% 在偏向系别内随机, 40% 全池随机(加权展开见 index.mapBondPool)。
const MAP_BOND_FAMILIES: Record<string, BondFamily[]> = {
  tutorial: ["blade", "bulwark"],
  "neon-city": ["blade", "bulwark"],
  "eco-ark": ["etch", "karma"],
  "ember-heat-well": ["chrono", "flow"],
};

export function mapBondFamilies(mapId: string | undefined): BondFamily[] {
  return (mapId && MAP_BOND_FAMILIES[mapId]) || [];
}
