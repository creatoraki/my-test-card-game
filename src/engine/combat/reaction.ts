// 反应态 —— 单位同时带有灼烧与中毒(来源不限)。炼金术士的反应牌在本卡施加状态之后判定。

import type { Combatant } from "../types";

function hasStacks(combatant: Combatant, statusId: string): boolean {
  return combatant.statuses.some((status) => status.id === statusId && status.stacks > 0);
}

export function isReacting(combatant: Combatant | undefined): boolean {
  return Boolean(combatant?.alive && hasStacks(combatant, "burn") && hasStacks(combatant, "poison"));
}
