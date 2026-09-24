// 常青 —— 已成熟的常青牌留在手牌中时, 每回合开始结算一次常青效果(千年古树)。

import type { BattleState } from "../types";
import { resolveEffects } from "../effects/effects";
import { cultivateReady } from "./cultivate";

export function runEvergreen(state: BattleState): void {
  for (const uid of [...state.hand]) {
    const card = state.cards[uid];
    const effects = card?.cultivate?.evergreen?.effects;
    if (!card || !effects?.length || !cultivateReady(card)) continue;
    if (!state.combatants[card.ownerCharId]?.alive) continue;
    resolveEffects(state, effects, card.ownerCharId, undefined);
  }
}
