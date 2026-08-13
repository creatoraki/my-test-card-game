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
import { checkEnd, allIds, ops } from "./ops";
import { RULES } from "./rules";
import { rngPick } from "./rng";
import { foesOf } from "./targeting";

let activeRecorder: DiscardRecorder | undefined;
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
  const foes = foesOf(state, owner);
  if (foes.length === 0) return undefined;
  if (card.onDiscard?.autoTarget === "lowestHpFoe") {
    return foes.reduce((lowest, current) => (current.hp < lowest.hp ? current : lowest)).id;
  }
  return rngPick(state, foes).id;
}

function recordTrigger(
  state: BattleState,
  card: Card,
  beforeHp: Record<string, number>,
  rec: DiscardRecorder,
): void {
  const hits: AnimHit[] = [];
  for (const id of allIds(state)) {
    const hpDelta = (beforeHp[id] ?? 0) - state.combatants[id].hp;
    if (hpDelta !== 0) hits.push({ id, hpDelta });
  }
  rec.triggers.push({
    cardUid: card.uid,
    actorId: card.ownerCharId,
    anim: card.anim,
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
  state.hand = state.hand.filter((id) => id !== uid);
  if (!state.discard.includes(uid)) state.discard.push(uid);

  const card = state.cards[uid];
  const rule = RULES.discard.reasons[reason];
  if (rule.count) {
    state.discardsThisRound += 1;
    state.discardsThisBattle += 1;
  }
  if (!card || (!rule.trigger && !(reason === "roundEnd" && card.onDiscard?.alsoOnRoundEnd))) return;
  if (state.discardResolving.includes(uid)) return;

  state.discardResolving.push(uid);
  const recorder = rec ?? activeRecorder;
  if (recorder && !discardSnapshots.has(state)) discardSnapshots.set(state, structuredClone(state));
  const beforeHp: Record<string, number> = {};
  for (const id of allIds(state)) beforeHp[id] = state.combatants[id].hp;

  const trigger = card.onDiscard;
  const effects = trigger?.mode === "useSelf" ? card.effects : trigger?.effects ?? [];
  const primaryId = autoTarget(state, card);
  resolveEffects(state, effects, card.ownerCharId, primaryId);
  checkEnd(state);

  state.discardResolving.pop();
  if (recorder) {
    recordTrigger(state, card, beforeHp, recorder);
  }
}

export function takeDiscardSnapshot(state: BattleState): BattleState | undefined {
  const snapshot = discardSnapshots.get(state);
  discardSnapshots.delete(state);
  return snapshot;
}

// effects.ts 通过 ops 调用此入口，避免与本模块形成静态循环依赖。
ops.discard = moveToDiscard;
