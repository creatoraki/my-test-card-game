// ============================================================================
// 弃牌唯一入口 —— 统一处理牌堆迁移、回合弃牌计数与「被弃置时」触发。
// ============================================================================

import type {
  AnimHit,
  BattleState,
  Card,
  DiscardReason,
  DiscardRecorder,
} from "./types";
import { resolveEffects } from "./effects";
import type { EffectResolution } from "./effects";
import { checkEnd, allIds, ops } from "./ops";
import { RULES } from "./rules";
import { rngPick } from "./rng";
import { alliesOf, foesOf } from "./targeting";
import { resetCultivate } from "./cultivate";

let activeRecorder: DiscardRecorder | undefined;
let flushing = false;
const discardSnapshots = new WeakMap<BattleState, BattleState>();

export function withDiscardRecorder<T>(rec: DiscardRecorder | undefined, fn: () => T): T {
  const previous = activeRecorder;
  activeRecorder = rec;
  try {
    return fn();
  } finally {
    activeRecorder = previous;
  }
}

function autoTarget(state: BattleState, card: Card): string | undefined {
  const owner = state.combatants[card.ownerCharId];
  if (!owner) return undefined;
  if (card.targeting === "self") return card.ownerCharId;
  const candidates = card.targeting === "foe" ? foesOf(state, owner) : card.targeting === "ally" ? alliesOf(state, owner) : [];
  if (candidates.length === 0) return undefined;
  if (card.targeting === "foe" && card.onDiscard?.autoTarget === "lowestHpFoe") {
    return candidates.reduce((lowest, current) => (current.hp < lowest.hp ? current : lowest)).id;
  }
  return rngPick(state, candidates).id;
}

function recordTrigger(
  state: BattleState,
  card: Card,
  beforeHp: Record<string, number>,
  rec: DiscardRecorder,
  resolution: EffectResolution,
  autoPlay = false,
): void {
  const hits: AnimHit[] = [];
  for (const id of allIds(state)) {
    const hpDelta = (beforeHp[id] ?? 0) - state.combatants[id].hp;
    const missed = resolution.missed.includes(id) && !resolution.hit.includes(id);
    if (hpDelta !== 0 || missed) hits.push({ id, hpDelta, missed });
  }
  rec.steps.push({
    kind: "discard",
    cardUid: card.uid,
    actorId: card.ownerCharId,
    anim: card.anim,
    autoPlay,
    hits,
    snapshot: structuredClone(state),
  });
}

export function moveToDiscard(
  state: BattleState,
  uid: string,
  reason: DiscardReason,
  rec?: DiscardRecorder,
): void {
  const wasInHand = state.hand.includes(uid);
  state.hand = state.hand.filter((id) => id !== uid);
  if (!state.discard.includes(uid)) state.discard.push(uid);

  const card = state.cards[uid];
  if (wasInHand && card) resetCultivate(card);
  const rule = RULES.discard.reasons[reason];
  if (rule.count) {
    state.discardsThisRound += 1;
    state.discardsThisBattle += 1;
  }
  const trigger = card?.onDiscard;
  if (!card || !trigger) return;
  if (!rule.trigger && !(reason === "roundEnd" && trigger.alsoOnRoundEnd)) return;
  if (trigger?.mode === "useSelf") {
    state.pendingAutoPlays.push(uid);
    return;
  }
  const effects = trigger.effects ?? [];
  if (trigger.mode === "custom" && effects.length === 0) return;
  if (state.discardResolving.includes(uid)) return;

  state.discardResolving.push(uid);
  const recorder = rec ?? activeRecorder;
  if (recorder && !discardSnapshots.has(state)) discardSnapshots.set(state, structuredClone(state));
  const beforeHp: Record<string, number> = {};
  for (const id of allIds(state)) beforeHp[id] = state.combatants[id].hp;

  const primaryId = autoTarget(state, card);
  const resolution = resolveEffects(state, effects, card.ownerCharId, primaryId);
  checkEnd(state);

  state.discardResolving.pop();
  if (recorder) {
    recordTrigger(state, card, beforeHp, recorder, resolution);
  }
}

export function flushAutoPlays(state: BattleState, rec?: DiscardRecorder): void {
  if (flushing) return;
  flushing = true;
  const recorder = rec ?? activeRecorder;
  let flushed = 0;
  try {
    while (state.pendingAutoPlays.length > 0 && flushed < 32) {
      const uid = state.pendingAutoPlays.shift();
      if (!uid) continue;
      const card = state.cards[uid];
      if (!card || state.phase !== "player") {
        state.pendingAutoPlays.length = 0;
        return;
      }

      const primaryId = autoTarget(state, card);
      if (!primaryId) {
        state.pendingAutoPlays.length = 0;
        return;
      }

      if (recorder && !discardSnapshots.has(state)) discardSnapshots.set(state, structuredClone(state));
      const beforeHp: Record<string, number> = {};
      for (const id of allIds(state)) beforeHp[id] = state.combatants[id].hp;
      const resolution = resolveEffects(state, card.effects, card.ownerCharId, primaryId);
      checkEnd(state);
      if (recorder) recordTrigger(state, card, beforeHp, recorder, resolution, true);
      flushed += 1;
    }
    if (state.pendingAutoPlays.length > 0) {
      state.pendingAutoPlays.length = 0;
      state.log.push({ round: state.round, tick: state.tick, text: "弃牌自动出牌达到安全上限，已停止继续结算" });
    }
  } finally {
    flushing = false;
  }
}

export function takeDiscardSnapshot(state: BattleState): BattleState | undefined {
  const snapshot = discardSnapshots.get(state);
  discardSnapshots.delete(state);
  return snapshot;
}

// effects.ts 通过 ops 调用此入口，避免与本模块形成静态循环依赖。
ops.discard = moveToDiscard;
ops.flushAutoPlays = flushAutoPlays;
