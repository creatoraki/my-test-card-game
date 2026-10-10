// ============================================================================
// 霓虹游艺摊 —— 押钱币赌下一场战斗完成的挑战数(每场战斗固定抽 2 个挑战词条)。
// · 押「至少 1 个」：达成后每枚钱币升 1 级；押「2 个全部」：达成后每枚升 2 级；
// · 升级受难度上限约束(普通难度最高银币)，押注时就只收还能升级的钱币；
// · 押不中钱币没收；战败团灭、战斗中撤离时押注随远征一起作废。
// ============================================================================

import { getItemDef, makeRolledItemStack } from "@/data";
import type { ItemStack } from "@/items/types";
import { addPendingLoot } from "../session/loot/backpack";
import type { ExploreState } from "../types";
import { upgradeCoin } from "./coins";

const GOAL_LABEL: Record<1 | 2, string> = { 1: "至少完成 1 个挑战", 2: "2 个挑战全部完成" };

export function arcadeGoalLabel(goal: 1 | 2): string {
  return GOAL_LABEL[goal];
}

function coinNames(itemIds: string[]): string {
  const counts = new Map<string, number>();
  for (const id of itemIds) counts.set(id, (counts.get(id) ?? 0) + 1);
  return [...counts].map(([id, count]) => `${getItemDef(id).name} ×${count}`).join("、");
}

/** 记下押注；钱币已由选物流程从背包取走。 */
export function placeBet(s: ExploreState, goal: 1 | 2, offered: ItemStack[]): string {
  const stakes = offered.flatMap((stack) => Array.from({ length: stack.count }, () => stack.itemId));
  if (!stakes.length) return "没有押上任何钱币";
  s.arcadeBet = { goal, stakes };
  return `押上 ${coinNames(stakes)}，赌下一场战斗${GOAL_LABEL[goal]}`;
}

/** 战斗胜利后结算押注：kept = 本场未被打破的挑战数。返回写进战后摘要的一句话。 */
export function settleArcadeBet(s: ExploreState, kept: number): string | null {
  const bet = s.arcadeBet;
  if (!bet) return null;
  s.arcadeBet = null;
  if (kept < bet.goal) {
    const note = `游艺摊押注落空（完成 ${kept} 个挑战），${coinNames(bet.stakes)} 被没收`;
    s.log.push(note);
    return note;
  }
  const upgraded = bet.stakes.map((id) => upgradeCoin(s, id, bet.goal));
  addPendingLoot(s, upgraded.map((id) => makeRolledItemStack(s, id, 1)));
  const note = `游艺摊押注成功：${coinNames(bet.stakes)} 升级为 ${coinNames(upgraded)}`;
  s.log.push(note);
  return note;
}
