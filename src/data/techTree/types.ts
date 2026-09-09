import type { TechCost } from "../techCost";

export interface TechCategoryDef {
  id: string;
  name: string;
  desc: string;
  order: number;
}

export interface TechBranchDef {
  id: string;
  categoryId: string;
  name: string;
  desc: string;
}

export interface TechNodeDef {
  id: string;
  branchId: string;
  categoryId: string;
  name: string;
  desc: string;
  effectPerLevel: string;
  maxLevel: number;
  requires: string[];
  x: number;
  y: number;
  costs: TechCost[];
}

export type TechNodeState = "maxed" | "available" | "lacking" | "locked";

export interface TechTreeState {
  levels: Record<string, number>;
}
