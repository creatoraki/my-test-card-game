import type { BattleState, Card, CultivateStage, Targeting } from "../types";
import { STATUS_DEFS } from "../core/hookRegistry";
import { ctxFor } from "../core/ops";

// 培育计数: N..1 生长中; 0 成熟; -1 成熟且即将枯萎(本回合结束仍在手牌中就枯萎, 见 deck.witherCards)。
// 嫁接牌停在 0, 一直保持成熟。
export type CultivatePhase = "growing" | "mature";

function cultivateLeftOf(card: Card): number | null {
  if (!card.cultivate) return null;
  return card.cultivateLeft ?? card.cultivate.turns;
}

export function cultivateStage(card: Card): CultivatePhase | null {
  const left = cultivateLeftOf(card);
  if (left == null) return null;
  return left <= 0 ? "mature" : "growing";
}

// 嫁接牌成熟后停在成熟: 不会枯萎。
export function neverWithers(card: Card): boolean {
  return Boolean(card.grafted);
}

// 嫁接只挂在实例上, 离手 / 打出后连同临时培育一起剥离。
function stripGraft(card: Card): void {
  delete card.cultivate;
  delete card.cultivateLeft;
  delete card.grafted;
}

export function resetCultivate(card: Card): void {
  if (card.grafted) {
    stripGraft(card);
    return;
  }
  if (card.cultivate) card.cultivateLeft = card.cultivate.turns;
}

export function notifyCultivateStage(state: BattleState, card: Card, stage: CultivateStage): void {
  for (const id of state.playerIds) {
    const owner = state.combatants[id];
    if (!owner?.alive) continue;
    for (const inst of [...owner.statuses])
      STATUS_DEFS[inst.id]?.hooks?.onCultivateStage?.(ctxFor(state, id, inst), card, stage);
  }
}

// 推进培育计数。成熟牌最多被回合开始推进到"即将枯萎"(-1), 不会再往下走。
export function advanceCultivate(state: BattleState, card: Card, delta: number): void {
  if (!card.cultivate || delta <= 0) return;
  const amount = Math.floor(delta);
  for (let i = 0; i < amount; i++) {
    const left = cultivateLeftOf(card)!;
    if (left <= -1) break;
    if (left <= 0 && neverWithers(card)) break;
    card.cultivateLeft = left - 1;
    if (left === 1) notifyCultivateStage(state, card, "mature");
  }
}

export function cultivateReady(card: Card): boolean {
  return cultivateStage(card) === "mature";
}

// 成熟的第 2 个回合: 卡面高亮提示, 回合结束仍在手牌中就枯萎。
export function cultivateWitherSoon(card: Card): boolean {
  const left = cultivateLeftOf(card);
  return left != null && left < 0 && !neverWithers(card);
}

// 催熟只推进生长中的牌; 成熟牌不可选(避免把牌往枯萎推)。
export function cultivateCanAdvance(card: Card): boolean {
  return cultivateStage(card) === "growing";
}

export function effectiveTargeting(card: Card): Targeting {
  return cultivateReady(card) ? card.cultivateTargeting ?? card.targeting : card.targeting;
}

export function tickCultivate(state: BattleState): void {
  for (const uid of state.hand) {
    const card = state.cards[uid];
    if (card?.cultivate) advanceCultivate(state, card, 1);
  }
}
