import { getItemDef } from "../data";
import type { EffectResolution } from "./effects";
import { resolveEffects } from "./effects";
import { withHitRecorder } from "./animHits";
import { checkEnd, ops } from "./ops";
import { currentRecorder, ensureCardFxSnapshot, recordRelicTrigger, snapshotHp } from "./cardFx";
import { MAX_RELIC_DEPTH } from "./relicBehaviors/types";
import type { BattleState, DiscardRecorder, RelicEvent } from "./types";
import type { RelicSpec } from "../items/types";

let depth = 0;

export const RELIC_TRIGGERS: readonly RelicEvent["type"][] = [
  "roundStart",
  "roundEnd",
  "cardPlayed",
  "allyAttacked",
  "enemyKilled",
  "nodeArrived",
  "itemPicked",
  "rested",
  "battleVictory",
];

/**
 * 战斗内遗物的唯一分发入口。遗物是小队级规则，因此统一由首名存活队员作为施放者。
 * every 计数写回 BattleState，递归触发与被动卡使用同一安全阀。
 */
export function fireRelic(state: BattleState, event: RelicEvent, rec?: DiscardRecorder): void {
  if (state.phase !== "player" || depth >= MAX_RELIC_DEPTH) return;
  const actorId = state.playerIds.find((id) => state.combatants[id]?.alive);
  if (!actorId) return;

  const listeners = state.relics.slice().filter((runtime) => {
    const spec = getItemDef(runtime.id).relic;
    if (!spec || spec.scope !== "battle") return false;
    const on: readonly string[] = spec.on ? (Array.isArray(spec.on) ? spec.on : [spec.on]) : [];
    return on.includes(event.type) && Boolean(spec.effects?.length);
  });
  if (!listeners.length) return;

  const recorder = currentRecorder(rec);
  const previousTargetStatuses = state.passiveEventTargetStatuses;
  depth += 1;
  try {
    for (const runtime of listeners) {
      if (state.phase !== "player") break;
      const spec = getItemDef(runtime.id).relic;
      if (!spec) continue;
      if (spec.every && spec.every > 1) {
        runtime.counter += 1;
        if (runtime.counter < spec.every) continue;
        runtime.counter = 0;
      }
      state.passiveEventTargetStatuses = event.targetStatuses ?? null;
      if (recorder) ensureCardFxSnapshot(state);
      const beforeHp = snapshotHp(state);
      let resolution!: EffectResolution;
      const recorded = withHitRecorder(() => {
        resolution = resolveEffects(state, spec.effects ?? [], actorId, event.targetId);
      });
      checkEnd(state);
      if (recorder) {
        const fxTargets = relicTargets(state, actorId, event.targetId, spec.effects ?? []);
        const recordedWithTargets = [
          ...recorded,
          ...fxTargets
            .filter((id) => !recorded.some((hit) => hit.id === id))
            .map((id) => ({ id, hpDelta: 0 })),
        ];
        recordRelicTrigger(state, runtime.id, actorId, beforeHp, recorder, resolution, recordedWithTargets);
      }
    }
  } finally {
    depth -= 1;
    state.passiveEventTargetStatuses = previousTargetStatuses;
  }
}

ops.fireRelic = fireRelic;

function relicTargets(
  state: BattleState,
  actorId: string,
  primaryId: string | undefined,
  effects: RelicSpec["effects"],
): string[] {
  const ids = new Set<string>();
  for (const effect of effects ?? []) {
    const target = effect.target ?? "primary";
    if (target === "self") ids.add(actorId);
    if (target === "primary" && primaryId) ids.add(primaryId);
    if (target === "allAllies") state.playerIds.filter((id) => state.combatants[id]?.alive).forEach((id) => ids.add(id));
    if (target === "allFoes") state.enemyIds.filter((id) => state.combatants[id]?.alive).forEach((id) => ids.add(id));
  }
  return [...ids];
}
