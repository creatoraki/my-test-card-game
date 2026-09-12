import type { BattleState, Card } from "./types";
import { baseEffectsOf } from "./cardEffects";
import { cardCost } from "./cost";
import { resolveEffects, type EffectResolution } from "./effects";
import { ops } from "./ops";
import { playableHandUids } from "./passiveCards";

const emptyResolution = (): EffectResolution => ({ missed: [], hit: [] });

function hasWaterfallEffect(card: Card): boolean {
  return baseEffectsOf(card).some((effect) => effect.condition === "waterfall");
}

export function waterfallHolds(state: BattleState, card: Card): boolean {
  const cost = cardCost(state, card);
  return playableHandUids(state)
    .filter((uid) => uid !== card.uid)
    .every((uid) => {
      const other = state.cards[uid];
      return other != null && cost > cardCost(state, other);
    });
}

export function consumeZenithStar(state: BattleState, card: Card): boolean {
  if (!hasWaterfallEffect(card)) return false;
  const owner = state.combatants[card.ownerCharId];
  const buff = owner?.statuses.find((status) => status.id === "zenithStar" && status.stacks > 0);
  if (!owner || !buff) return false;
  ops.applyStatus(state, owner.id, "zenithStar", -1);
  return true;
}

export function prepareWaterfallEncore(
  state: BattleState,
  card: Card,
  primaryId?: string,
): EffectResolution {
  if (!state.waterfallPlay) return emptyResolution();
  const owner = state.combatants[card.ownerCharId];
  const buff = owner?.statuses.find((status) => status.id === "gravityLens" && status.stacks > 0);
  if (!buff) return emptyResolution();
  const effects = baseEffectsOf(card).filter(
    (effect) => effect.condition === "waterfall" && effect.type === "PLAY_STAT_BONUS",
  );
  return effects.length ? resolveEffects(state, effects, card.ownerCharId, primaryId) : emptyResolution();
}

export function resolveWaterfallEncore(
  state: BattleState,
  card: Card,
  primaryId?: string,
): EffectResolution {
  const owner = state.combatants[card.ownerCharId];
  const buff = owner?.statuses.find((status) => status.id === "gravityLens" && status.stacks > 0);
  if (!buff) return emptyResolution();
  const allEffects = baseEffectsOf(card).filter((effect) => effect.condition === "waterfall");
  if (allEffects.length === 0) return emptyResolution();
  ops.applyStatus(state, owner!.id, "gravityLens", -1);
  const effects = allEffects.filter((effect) => effect.type !== "PLAY_STAT_BONUS");
  if (effects.length === 0) return emptyResolution();
  return resolveEffects(state, effects, card.ownerCharId, primaryId);
}

export function fireWaterfallHooks(state: BattleState): void {
  for (const ownerId of state.playerIds) {
    const owner = state.combatants[ownerId];
    if (!owner?.alive) continue;
    const drift = owner.statuses.find((status) => status.id === "drift" && status.stacks > 0);
    const shield = drift?.data?.shield ?? 0;
    if (drift && shield > 0) ops.gainShield(state, drift.sourceId, ownerId, shield);
  }
}
