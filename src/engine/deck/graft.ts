// 嫁接 —— 给其他角色的一张手牌临时挂上培育 1。成熟后打出时所属角色攻击力 / 治愈力提高, 不会枯萎;
// 离手或打出后剥离(见 cultivate.resetCultivate)。

import type { BattleState, Card } from "../types";
import { playableHandUids } from "../cards/passiveCards";
import { log } from "../core/ops";

// 嫁接牌成熟后打出时, 所属角色在本次结算中攻击力、治愈力各提高的百分点。
export const GRAFT_STAT_BONUS_PCT = 40;

export function canGraft(card: Card | undefined, sourceId: string): card is Card {
  return Boolean(card && card.ownerCharId !== sourceId && !card.cultivate && !card.temporary);
}

// 可嫁接的手牌: 其他角色的、可以打出的、非临时卡、且本身没有培育(已嫁接的牌也算有培育)。
export function graftCandidates(state: BattleState, sourceId: string): string[] {
  return playableHandUids(state).filter((uid) => canGraft(state.cards[uid], sourceId));
}

export function applyGraft(state: BattleState, card: Card): void {
  card.cultivate = { turns: 1, mode: "append", effects: [] };
  card.cultivateLeft = 1;
  card.grafted = true;
  log(state, `${card.name} 被嫁接，获得培育 1`);
}
