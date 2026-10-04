// ============================================================================
// 精算师的规则查询 —— 只读 BattleState, 不产生副作用。
// 急诊判定、回响新增上限、手牌中被动卡的规则改写都从这里查, 避免各处按卡牌 id 写特判。
// ============================================================================

import type { BattleState, Combatant } from "../types";

export const ACTUARY_ID = "actuary";

// 手牌中改写规则的被动卡(持有期间生效, 不走被动事件)。
export const COMMISSION_CARD_ID = "commission";
export const NO_CLAIM_BONUS_CARD_ID = "no-claim-bonus";
export const CONTINGENCY_PLAN_CARD_ID = "contingency-plan";

export function hasStatus(cmb: Combatant | undefined, statusId: string): boolean {
  return Boolean(cmb?.statuses.some((status) => status.id === statusId && status.stacks > 0));
}

// 存活的精算师单位(盈余的持有者)。
export function actuaryOf(state: BattleState): Combatant | undefined {
  const actuary = state.combatants[ACTUARY_ID];
  return actuary?.alive && actuary.team === "player" ? actuary : undefined;
}

// 手牌中某张被动卡的张数。被动卡持在手中才生效, 回合结束收进弃牌堆。
export function handPassiveCount(state: BattleState, cardId: string): number {
  return state.hand.filter((uid) => {
    const card = state.cards[uid];
    return card?.cardType === "passive" && card.id === cardId;
  }).length;
}

// 假装受伤: 本回合视为已受到攻击(只服务急诊判定, 不触发增值)。
export function feignsInjury(state: BattleState, id: string): boolean {
  return hasStatus(state.combatants[id], "feignInjury");
}

// 本回合受到过敌方直接攻击, 或带有假装受伤。
export function countsAsAttacked(state: BattleState, id: string): boolean {
  return state.attackedThisRound.includes(id) || feignsInjury(state, id);
}

export function anyAllyCountsAsAttacked(state: BattleState): boolean {
  return state.attackedThisRound.length > 0 || state.playerIds.some((id) => feignsInjury(state, id));
}

// 应急预案: 持有期间, 任一队友满足急诊即视为所有急诊都满足。
export function emergencyPartyWide(state: BattleState): boolean {
  return handPassiveCount(state, CONTINGENCY_PLAN_CARD_ID) > 0;
}

// 共保体: 本场战斗回响每回合新增人数不受限制。
export function echoUncapped(state: BattleState): boolean {
  return state.playerIds.some((id) => hasStatus(state.combatants[id], "coinsurance"));
}

// 偿付能力: 溢额全额入账, 盈余上限翻倍。
export function solvencyActive(state: BattleState): boolean {
  return state.playerIds.some((id) => hasStatus(state.combatants[id], "solvency"));
}
