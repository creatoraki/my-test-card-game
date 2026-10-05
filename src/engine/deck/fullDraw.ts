import type { BattleState, Card, EffectDescriptor } from "../types";
import { RULES } from "../core/battleRules";
import { pierceOf, removePierce } from "../combat/pierce";

export interface FullDrawState {
  hitIds: string[];
  removed: Record<string, number>;
}

export function emptyFullDraw(): FullDrawState {
  return { hitIds: [], removed: {} };
}

function fullDrawTargetIds(state: BattleState, card: Card, primaryId?: string): string[] {
  if (card.targeting === "allFoes")
    return state.enemyIds.filter((id) => state.combatants[id]?.alive);
  return primaryId && state.combatants[primaryId]?.alive && state.combatants[primaryId].team === "enemy"
    ? [primaryId]
    : [];
}

export function resolveFullDraw(state: BattleState, card: Card, primaryId?: string): void {
  state.fullDraw = emptyFullDraw();
  const volley = card.volley;
  if (!volley || volley.threshold <= 0) return;

  const hitIds: string[] = [];
  const removed: Record<string, number> = {};
  for (const id of fullDrawTargetIds(state, card, primaryId)) {
    if (pierceOf(state, id) < volley.threshold) continue;
    const amount = volley.consumeAll ? pierceOf(state, id) : volley.threshold;
    const actual = removePierce(state, id, amount);
    if (actual <= 0) continue;
    hitIds.push(id);
    removed[id] = actual;
  }

  state.fullDraw = { hitIds, removed };
}

export function fullDrawGateMatches(state: BattleState, gate: NonNullable<EffectDescriptor["fullDraw"]>): boolean {
  return gate === "hit" ? state.fullDraw.hitIds.length > 0 : state.fullDraw.hitIds.length === 0;
}

export function filterFullDrawTargets(
  state: BattleState,
  effect: EffectDescriptor,
  targetIds: string[],
): string[] {
  const filter = effect.fullDrawTargets;
  if (!filter) return targetIds;
  const hit = new Set(state.fullDraw.hitIds);
  return targetIds.filter((id) => filter === "hit" ? hit.has(id) : !hit.has(id));
}

export function fullDrawHits(state: BattleState): number {
  return state.fullDraw.hitIds.length;
}

export function fullDrawBigHits(state: BattleState): number {
  return Object.values(state.fullDraw.removed).filter(
    (removed) => removed >= RULES.pierce.bigHarvest,
  ).length;
}
