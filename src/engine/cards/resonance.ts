// 共鸣 —— 打出共鸣牌时强化手牌中费用更低的共鸣牌; 余韵把本卡的强化次数传给最低费的另一张共鸣牌。
// 共振晶簇(resonanceAmplifier)在手中时, 被共鸣强化的每张牌额外获得对应次数。

import type { BattleState, Card } from "../types";
import { log } from "../core/ops";
import { playableHandUids } from "./passiveCards";

function resonanceAmplifier(state: BattleState): number {
  return state.hand.reduce((sum, uid) => sum + (state.cards[uid]?.resonanceAmplifier ?? 0), 0);
}

// 余韵目标: 手牌中费用最低的另一张共鸣牌, 同费取最靠左的一张。
function lingeringTarget(state: BattleState, card: Card): Card | undefined {
  let best: Card | undefined;
  for (const uid of playableHandUids(state)) {
    const handCard = state.cards[uid];
    if (!handCard?.resonance || handCard.uid === card.uid) continue;
    if (!best || handCard.cost < best.cost) best = handCard;
  }
  return best;
}

// 在本卡离开手牌、效果结算完成之后调用。state.activeCardResonance 仍是本卡打出时的强化次数。
export function applyResonanceOnPlay(state: BattleState, card: Card, faceCost: number): void {
  if (!card.resonance) return;
  const perCard = 1 + resonanceAmplifier(state);
  for (const uid of playableHandUids(state)) {
    const handCard = state.cards[uid];
    if (handCard?.resonance && handCard.cost < faceCost)
      handCard.resonanceStacks = (handCard.resonanceStacks ?? 0) + perCard;
  }
  const carried = state.activeCardResonance;
  if (!card.lingering || carried <= 0) return;
  const target = lingeringTarget(state, card);
  if (!target) return;
  target.resonanceStacks = (target.resonanceStacks ?? 0) + carried;
  log(state, `余韵：${target.name} 获得 ${carried} 次共鸣强化`);
}
