// 抽牌堆 / 手牌 / 弃牌堆 / 消耗堆 的操作。共享牌库: 抽空时把弃牌洗回抽牌堆。

import type { BattleState, Card } from "../types";
import { shuffle } from "../core/rng";
import { log, ops } from "../core/ops";
import { partyHandLimit } from "../combat/stats";
import { registerPollutedCardDraw } from "../combat/pollution";
import { cultivateWitherSoon, notifyCultivateStage, resetCultivate } from "./cultivate";
import { makeCard } from "@/data";
import { runRelicHook } from "../relics/types";
import { exhaustCard } from "./exhaust";
import { availableHand, cardLocked } from "../ecoArk/shared";

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
      runRelicHook(state, "onShuffle");
    }
    const uid = state.draw.shift()!;
    state.hand.push(uid);
    const card = state.cards[uid];
    if (card) {
      resetCultivate(card);
      registerPollutedCardDraw(state, card);
    }
    drawn++;
    // 每抽到一张牌就分发一次被动事件(天眼等) —— 经 ops 间接调用, 避免与 passive.ts 循环。
    ops.firePassive(state, { type: "cardDrawn", cardUid: uid });
    runRelicHook(state, "onCardDrawn", uid);
  }
  if (drawn > 0) log(state, `🃏 抽了 ${drawn} 张牌`);
}

ops.draw = drawCards;

export function addCardToHand(state: BattleState, cardId: string, ownerCharId?: string): void {
  if (state.hand.length >= partyHandLimit(state)) return;
  const card = makeCard(cardId);
  if (ownerCharId) card.ownerCharId = ownerCharId;
  state.cards[card.uid] = card;
  state.hand.push(card.uid);
  resetCultivate(card);
  log(state, `${card.name} 加入手牌`);
}

export function addCardCopyToHand(state: BattleState, sourceCard: Card): void {
  if (state.hand.length >= partyHandLimit(state)) return;
  const copy = makeCard(sourceCard.id, sourceCard.upgraded);
  Object.assign(copy, structuredClone(sourceCard), {
    uid: copy.uid,
    temporary: true,
    exhaust: true,
    voidCard: true,
    discardStacks: undefined,
    costStacks: undefined,
    notoPending: undefined,
    resonanceStacks: undefined,
  });
  state.cards[copy.uid] = copy;
  state.hand.push(copy.uid);
  resetCultivate(copy);
  log(state, `${sourceCard.name} 的复制卡加入手牌`);
}

export function replaceHandCard(
  state: BattleState,
  uid: string,
  cardId: string,
  ownerCharId?: string,
): string | undefined {
  const index = state.hand.indexOf(uid);
  if (index < 0 || cardLocked(state, uid)) return undefined;
  const replacement = makeCard(cardId);
  if (ownerCharId) replacement.ownerCharId = ownerCharId;
  state.cards[replacement.uid] = replacement;
  state.hand[index] = replacement.uid;
  resetCultivate(replacement);
  return replacement.uid;
}

// 枯萎: 成熟第 2 个回合结束仍在手牌中的培育牌移出本场战斗, 原位置替换为枯萎的果实。
export const WITHERED_FRUIT_ID = "withered-fruit";

export function witherCards(state: BattleState): void {
  for (const uid of availableHand(state)) {
    const card = state.cards[uid];
    if (!card || !cultivateWitherSoon(card)) continue;
    const replacementUid = replaceHandCard(state, uid, WITHERED_FRUIT_ID, card.ownerCharId);
    if (!replacementUid) continue;
    exhaustCard(state, uid);
    log(state, `${card.name} 枯萎，变为枯萎的果实`);
    notifyCultivateStage(state, card, "withered");
  }
}
