// ============================================================================
// 星契 —— 常驻卡牌增益: 这张牌的所属者变为预言家, 并可以用星辉替代法力水晶。
// 候选规则(烙印): 优先其他角色的非应星牌; 没有时退回预言家自己的非应星牌。
// ============================================================================

import type { BattleState, Card } from "../types";
import { ops } from "../core/ops";
import { starPayable } from "../cards/cost";
import { playableHandUids } from "../cards/passiveCards";
import { prophetIdOf } from "./prophetUnit";

export const STAR_PACT_MARK = "starPact";

export function starPactCandidates(state: BattleState): string[] {
  const prophetId = prophetIdOf(state);
  if (!prophetId) return [];
  const eligible = playableHandUids(state).filter((uid) => {
    const card = state.cards[uid];
    return card != null && !starPayable(card);
  });
  const foreign = eligible.filter((uid) => state.cards[uid]?.ownerCharId !== prophetId);
  return foreign.length > 0 ? foreign : eligible;
}

export function grantStarPact(state: BattleState, card: Card): boolean {
  const prophetId = prophetIdOf(state);
  if (!prophetId) return false;
  card.marks ??= [];
  if (!card.marks.includes(STAR_PACT_MARK)) card.marks.push(STAR_PACT_MARK);
  const transferred = card.ownerCharId !== prophetId;
  card.ownerCharId = prophetId;
  const prophet = state.combatants[prophetId];
  ops.log(state, `${card.name} 获得星契${transferred ? `，归属转为${prophet.name}` : ""}`);
  return true;
}
