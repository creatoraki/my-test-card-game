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
  /** 多级节点的当前等级与上限；缺省即单级节点（商店升级树）。 */
  level?: number;
  maxLevel?: number;
  /** 覆盖默认状态文案，例如多级节点满级时的「已满级」。 */
  stateLabel?: string;
  /** 覆盖默认状态描述，例如多级节点的「可研究下一级」。 */
  stateDescription?: string;
  /** 覆盖操作按钮文案，例如「研究下一级」。 */
  actionLabel?: string;
}

export interface TechnologyCore {
  name: string;
  x: number;
  y: number;
  icon: ReactNode;
}

/** 科技板顶部的分类页签；不传 tabs 的调用方不渲染这一行。 */
export interface TechnologyTab {
  id: string;
  label: string;
  desc?: string;
  badge?: string;
}

export const TECHNOLOGY_STATE_LABEL: Record<TechnologyState, string> = {
  done: "已解锁",
  available: "可解锁",
  lacking: "材料不足",
  locked: "未解锁",
};

/** 节点状态文案：多级节点由调用方用 stateLabel 覆盖。 */
export function technologyStateLabel(node: TechnologyNode): string {
  return node.stateLabel ?? TECHNOLOGY_STATE_LABEL[node.state];
}

/** 多级节点的等级读数，单级节点返回 null。 */
export function technologyLevelText(node: TechnologyNode): string | null {
  if (!node.maxLevel || node.maxLevel <= 1) return null;
  return `Lv.${node.level ?? 0}/${node.maxLevel}`;
}
