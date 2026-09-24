import type { BattleState, EffectDescriptor } from "../types";
import type { EffectResolution } from "./effects";
import { getStatusDef } from "../statuses";
import { rngPick } from "../core/rng";

interface StripDeps {
  resolveEffects: (
    state: BattleState,
    effects: EffectDescriptor[],
    sourceId: string,
    primaryId: string | undefined,
  ) => EffectResolution;
}

function mergeResolution(target: EffectResolution, source: EffectResolution): void {
  target.missed.push(...source.missed);
  target.hit.push(...source.hit);
}

export function applyStripStatusEffect(
  state: BattleState,
  effect: EffectDescriptor,
  sourceId: string,
  targetIds: string[],
  deps: StripDeps,
): EffectResolution {
  const resolution: EffectResolution = { missed: [], hit: [] };
  const kind = effect.statusKind ?? "buff";
  const amount = Math.max(0, Math.floor(effect.amount ?? 1));
  let removedCount = 0;

  for (const id of targetIds) {
    const target = state.combatants[id];
    if (!target?.alive || amount <= 0) continue;
    const pool = target.statuses.filter((status) => {
      const def = getStatusDef(status.id);
      return status.stacks > 0 && !def?.undispellable && (kind === "all" || def?.kind === kind);
    });
    for (let i = 0; i < amount && pool.length > 0; i++) {
      const status = rngPick(state, pool);
      target.statuses = target.statuses.filter((entry) => entry !== status);
      pool.splice(pool.indexOf(status), 1);
      removedCount += 1;
      if (effect.onEachRemoved?.length)
        mergeResolution(resolution, deps.resolveEffects(state, effect.onEachRemoved, sourceId, undefined));
    }
  }

  state.lastRemovedStatusCount = removedCount;
  if (removedCount === 0 && effect.onNoneRemoved?.length)
    mergeResolution(resolution, deps.resolveEffects(state, effect.onNoneRemoved, sourceId, undefined));
  return resolution;
}
