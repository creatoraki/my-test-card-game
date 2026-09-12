import type { ReactNode } from "react";

export type TechnologyState = "done" | "available" | "lacking" | "locked";

export interface TechnologyNode {
  id: string;
  name: string;
  x: number;
  y: number;
  requires: string[];
  state: TechnologyState;
  icon: ReactNode;
  category: string;
  description: string;
  prerequisite: string;
  effects: { label: string; value?: string; symbol?: string }[];
  materials: { itemId: string; name: string; have: number; need: number }[];
  /** 调用方提供真实消耗摘要，公共组件不推断游戏规则。 */
  costLabel: string;
}

export interface TechnologyCore {
  name: string;
  x: number;
  y: number;
  icon: ReactNode;
}

export const TECHNOLOGY_STATE_LABEL: Record<TechnologyState, string> = {
  done: "已解锁",
  available: "可解锁",
  lacking: "材料不足",
  locked: "未解锁",
};
