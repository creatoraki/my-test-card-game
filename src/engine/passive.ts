// ============================================================================
// 被动卡 —— 无费用、不可打出、持在手中按事件自动结算, 回合结束自动收进弃牌堆。
// 本模块是被动卡的唯一真相点: 类型判定、可打出手牌过滤、事件分发与回合结束回收。
// ============================================================================

import type { BattleState, Card, DiscardRecorder, PassiveEvent } from "./types";
import type { EffectResolution } from "./effects";
import { resolveEffects } from "./effects";
import { checkEnd, ops } from "./ops";
import { withHitRecorder } from "./animHits";
import { currentRecorder, ensureCardFxSnapshot, recordCardTrigger, snapshotHp } from "./cardFx";

// 被动触发里再产生弃牌/抽牌 ⇒ 又触发被动。安全阀与 flushAutoPlays 同类。
const MAX_PASSIVE_DEPTH = 8;
let depth = 0;

export function isPassive(card: Pick<Card, "cardType"> | undefined): boolean {
  return card?.cardType === "passive";
}

// 手牌中"能被打出"的那部分 —— 费用比较、瀑布判定、标记/转换候选池一律走这里,
// 被动卡不参与任何费用与出牌口径的计算。
export function playableHandUids(state: BattleState): string[] {
  return state.hand.filter((uid) => !isPassive(state.cards[uid]));
}

export function handPassiveUids(state: BattleState): string[] {
  return state.hand.filter((uid) => isPassive(state.cards[uid]));
}

// 分发一次被动事件: 手牌里每张监听该事件的被动卡各结算一次, 各录一条演出步。
export function firePassive(state: BattleState, event: PassiveEvent, rec?: DiscardRecorder): void {
  if (state.phase !== "player") return;
  if (depth >= MAX_PASSIVE_DEPTH) return;
  // ★ 取快照遍历: 被动效果会改手牌(丢弃/抽牌/加牌), 直接遍历 state.hand 会漏卡或重复。
  const listeners = handPassiveUids(state).filter((uid) => {
    const trigger = state.cards[uid]?.passive?.on;
    return Array.isArray(trigger) ? trigger.includes(event.type) : trigger === event.type;
  });
  if (listeners.length === 0) return;

  const recorder = currentRecorder(rec);
  const previousEventUid = state.passiveEventCardUid;
  const previousTargetStatuses = state.passiveEventTargetStatuses;
  depth += 1;
  try {
    for (const uid of listeners) {
      const card = state.cards[uid];
      // 结算途中这张被动卡自己可能已离开手牌(被自己的效果丢弃) ⇒ 不再生效。
      if (!card?.passive || !state.hand.includes(uid) || state.phase !== "player") continue;
      state.passiveEventCardUid = event.cardUid ?? null;
      state.passiveEventTargetStatuses = event.targetStatuses ?? null;
      if (recorder) ensureCardFxSnapshot(state);
      const beforeHp = snapshotHp(state);
      const effects = card.passive.effectsByTrigger?.[event.type] ?? card.passive.effects;
      let resolution!: EffectResolution;
      const recorded = withHitRecorder(() => {
        resolution = resolveEffects(state, effects, card.ownerCharId, undefined);
      });
      checkEnd(state);
      if (recorder) recordCardTrigger(state, card, beforeHp, recorder, resolution, false, recorded);
    }
  } finally {
    depth -= 1;
    state.passiveEventCardUid = previousEventUid;
    state.passiveEventTargetStatuses = previousTargetStatuses;
  }
}

// 回合结束把手牌里的被动卡收进弃牌堆。★ 走 "passiveEnd" 理由 ⇒ 不计弃牌数、
// 不触发这张卡自己的「被丢弃时」、也不触发其它被动卡的 cardDiscarded。
export function recycleHandPassives(state: BattleState, rec?: DiscardRecorder): void {
  for (const uid of handPassiveUids(state)) {
    const card = state.cards[uid];
    if (card?.exhaust) {
      state.hand = state.hand.filter((id) => id !== uid);
      if (!state.exhaust.includes(uid)) state.exhaust.push(uid);
    } else {
      ops.discard(state, uid, "passiveEnd", rec);
    }
  }
}

ops.firePassive = firePassive;
