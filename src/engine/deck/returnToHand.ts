import type { BattleState, Card } from "../types";
import { partyHandLimit } from "../combat/stats";
import { resetCultivate } from "./cultivate";
import { runRelicHook } from "../relics/types";

/** 已离手的牌实际回手时统一派发事件，抽牌和生成新牌不属于回手。 */
export function returnCardToHand(state: BattleState, card: Card, costDelta = 0): boolean {
  if (state.hand.includes(card.uid) || state.hand.length >= partyHandLimit(state)) return false;
  state.discard = state.discard.filter((uid) => uid !== card.uid);
  state.hand.push(card.uid);
  resetCultivate(card);
  const info = { card, costDelta };
  runRelicHook(state, "onCardReturned", info);
  if (info.costDelta > 0) {
    card.costStacks = (card.costStacks ?? 0) + info.costDelta;
    if (!card.marks?.includes("returnTax")) (card.marks ??= []).push("returnTax");
  }
  return true;
}
