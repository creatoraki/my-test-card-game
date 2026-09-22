// ============================================================================
// 净化粒子计价 —— 换房 / 交互 / 战斗 / 行走四类消耗的唯一计价口。
// 数值全部来自 EXPLORE_RULES; UI 的预告与实际扣费都读这里, 不要在别处写死价格。
// ============================================================================

import { CORRIDOR_CURIOS } from "../data/curios";
import { changeEnergy } from "./energy";
import { EXPLORE_RULES } from "./rules";
import type { BattleTier, ExploreState } from "./types";

function activeCurioKind(s: ExploreState) {
  const id = s.corridor?.activeObjectId;
  return id ? s.corridor?.objects.find((object) => object.id === id)?.kind : undefined;
}

/** 交互当前物件要花多少粒子: 按物件分类分档; 货商与陷阱免费; freeNodes 可免除。 */
export function interactionCost(s: ExploreState): number {
  if (s.freeNodes > 0) return 0;
  const prices = EXPLORE_RULES.energyPerInteraction;
  const kind = activeCurioKind(s);
  if (!kind) return prices.event;
  if (kind === "merchant") return prices.merchant;
  const def = CORRIDOR_CURIOS[kind];
  if (!def || def.forced) return 0;
  if (def.role === "loot" || def.role === "heal" || def.role === "service") return prices[def.role];
  return prices.event;
}

/** 换房价格: 没进过的房间按新房价, 回到到过的房间按回头路价。UI 只有房间状态时直接读它。 */
export function roomMoveCostFor(visited: boolean): number {
  const prices = EXPLORE_RULES.dungeon.energyPerRoomMove;
  return visited ? prices.revisit : prices.fresh;
}

/** 传送到指定房间要花多少粒子。 */
export function roomMoveCost(s: ExploreState, roomId: string): number {
  return roomMoveCostFor(Boolean(s.dungeon?.rooms[roomId]?.visited));
}

// 战斗消耗: 每回合 −1, 再按遭遇档位额外一次性扣除。
// ⚠ 由 store 层在 finishBattle **之后**调用 —— 掉落系数与经验倍率读的是战前能量,
//   提前扣会削掉本场自己的收益。BOSS 战不调用本函数(那一场打完即通关)。
export function spendBattleEnergy(s: ExploreState, rounds: number, tier?: BattleTier | null): void {
  const roundCost = Math.max(0, Math.round(rounds)) * EXPLORE_RULES.energyPerBattleRound;
  const tierCost = tier ? EXPLORE_RULES.energyPerBattleTier[tier] ?? 0 : 0;
  const cost = roundCost + tierCost;
  if (cost > 0) changeEnergy(s, -cost);
  s.battleEnergyMark = s.stats.energySpent;
}

/** 房间内行走消耗: 每走满一段距离由场景层调用一次。 */
export function spendWalkEnergy(s: ExploreState, amount: number): void {
  if (amount > 0) changeEnergy(s, -amount);
}
