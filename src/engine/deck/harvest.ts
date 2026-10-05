// 采收 —— 终结技: 出牌结算前读取主目标全部穿孔层数 X(本卡效果经计数 harvestPierce* 读取),
// 本卡效果结算完后再移除这 X 层。伤害仍吃到这 X 层穿孔的增伤; 目标在结算中死亡时 X 仍按读取值计算。

import type { BattleState, Card } from "../types";
import { pierceOf, removePierce } from "../combat/pierce";
import { log } from "../core/ops";

export function beginHarvest(state: BattleState, card: Card, primaryId: string | undefined): void {
  state.harvest = null;
  if (!card.harvest || !primaryId) return;
  const target = state.combatants[primaryId];
  if (!target || target.team === state.combatants[card.ownerCharId]?.team) return;
  state.harvest = { targetId: primaryId, stacks: pierceOf(target) };
}

export function finishHarvest(state: BattleState): void {
  const harvest = state.harvest;
  state.harvest = null;
  if (!harvest || harvest.stacks <= 0) return;
  const removed = removePierce(state, harvest.targetId, harvest.stacks);
  const target = state.combatants[harvest.targetId];
  if (removed > 0 && target) log(state, `${target.emoji} ${target.name} 被采收 ${removed} 层穿孔`);
}

export function harvestedPierce(state: BattleState): number {
  return state.harvest?.stacks ?? 0;
}
