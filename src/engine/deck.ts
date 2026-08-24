// 抽牌堆 / 手牌 / 弃牌堆 / 消耗堆 的操作。共享牌库: 抽空时把弃牌洗回抽牌堆。

import type { BattleState } from "./types";
import { shuffle } from "./rng";
import { log } from "./ops";
import { partyHandLimit } from "./stats";
import { registerPollutedCardDraw } from "./pollution";
import { resetCultivate } from "./cultivate";
import { makeCard } from "../data";

// 抽 n 张(受小队手牌上限限制)。抽牌堆空则把弃牌堆洗回。
export function drawCards(state: BattleState, n: number): void {
  let drawn = 0;
  const limit = partyHandLimit(state);
  for (let i = 0; i < n; i++) {
    if (state.hand.length >= limit) break;
    if (state.draw.length === 0) {
      if (state.discard.length === 0) break; // 无牌可抽
      state.draw = shuffle(state, state.discard);
      state.discard = [];
      log(state, "🔀 弃牌堆洗回抽牌堆");
    }
    const uid = state.draw.shift()!;
    state.hand.push(uid);
    const card = state.cards[uid];
    if (card) {
      resetCultivate(card);
      registerPollutedCardDraw(state, card);
    }
    drawn++;
  }
  if (drawn > 0) log(state, `🃏 抽了 ${drawn} 张牌`);
}

export function addCardToHand(state: BattleState, cardId: string, ownerCharId?: string): void {
  if (state.hand.length >= partyHandLimit(state)) return;
  const card = makeCard(cardId);
  if (ownerCharId) card.ownerCharId = ownerCharId;
  state.cards[card.uid] = card;
  state.hand.push(card.uid);
  resetCultivate(card);
  log(state, `${card.name} 加入手牌`);
}
