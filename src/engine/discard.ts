// ============================================================================
// 弃牌唯一入口 —— 统一处理牌堆迁移、回合弃牌计数与「被弃置时」触发。
// 演出录制与快照台账在 cardFx.ts, 被动卡分发在 passive.ts。
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
import { checkEnd, ops } from "./ops";
import { withHitRecorder } from "./animHits";
import { RULES } from "./rules";
import { rngPick } from "./rng";
import { alliesOf, foesOf } from "./targeting";
import { resetCultivate } from "./cultivate";
import { addCardToHand } from "./deck";
import { cardCost } from "./cost";
import { partyHandLimit } from "./stats";
import { currentRecorder, ensureCardFxSnapshot, recordCardTrigger, snapshotHp } from "./cardFx";
import { firePassive } from "./passive";

export { withDiscardRecorder, takeDiscardSnapshot } from "./cardFx";

let flushing = false;

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

// 「被丢弃时回到手牌」: 累计一层实例层数, 再把牌从弃牌堆挪回手牌。
// 手牌已满时只累计层数, 牌留在弃牌堆 —— 手牌上限是硬约束, 不为这条触发破例。
function returnToHand(state: BattleState, card: Card): void {
  const max = card.onDiscard?.maxStacks ?? Infinity;
  card.discardStacks = Math.min(max, (card.discardStacks ?? 0) + 1);
  if (state.hand.length >= partyHandLimit(state)) {
    ops.log(state, `${card.name} 手牌已满，未能回到手牌`);
    return;
  }
  state.discard = state.discard.filter((id) => id !== card.uid);
  state.hand.push(card.uid);
  ops.log(state, `${card.name} 回到手牌（累计 ${card.discardStacks} 层）`);
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
  if (wasInHand && card) {
    resetCultivate(card);
    card.resonanceStacks = 0;
    card.marks = card.marks?.filter((mark) => mark !== "heavy");
  }
  const rule = RULES.discard.reasons[reason];
  if (rule.count) {
    state.discardsThisRound += 1;
    state.discardsThisBattle += 1;
  }
  const trigger = card?.onDiscard;
  const triggerable = card != null && trigger != null &&
    (rule.trigger || (reason === "roundEnd" && trigger.alsoOnRoundEnd));

  if (card && triggerable && trigger) {
    if (trigger.mode === "useSelf") state.pendingAutoPlays.push(uid);
    else if (trigger.mode === "returnToHand") returnToHand(state, card);
    else resolveDiscardEffects(state, card, trigger.effects ?? [], rec);
  }

  // ★ 被动卡的「每丢弃一张卡牌」只认真正的弃牌动作(manual / effect / cost),
  //   换牌、打出、回合结束回收都不是弃牌 ⇒ 与 rule.count 同一口径。
  if (rule.count) firePassive(state, { type: "cardDiscarded", cardUid: uid }, rec);
}

function resolveDiscardEffects(
  state: BattleState,
  card: Card,
  effects: import("./types").EffectDescriptor[],
  rec?: DiscardRecorder,
): void {
  if (effects.length === 0) return;
  if (state.discardResolving.includes(card.uid)) return;

  state.discardResolving.push(card.uid);
  const recorder = currentRecorder(rec);
  if (recorder) ensureCardFxSnapshot(state);
  const beforeHp = snapshotHp(state);

  const primaryId = autoTarget(state, card);
  let resolution!: EffectResolution;
  const recorded = withHitRecorder(() => {
    resolution = resolveEffects(state, effects, card.ownerCharId, primaryId);
  });
  checkEnd(state);

  state.discardResolving.pop();
  if (recorder) recordCardTrigger(state, card, beforeHp, recorder, resolution, false, recorded);
}

export function flushAutoPlays(state: BattleState, rec?: DiscardRecorder): void {
  if (flushing) return;
  flushing = true;
  const recorder = currentRecorder(rec);
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

      if (recorder) ensureCardFxSnapshot(state);
      const beforeHp = snapshotHp(state);
      const previousCardCost = state.activeCardCost;
      const previousCardStacks = state.activeCardStacks;
      const previousCardResonance = state.activeCardResonance;
      state.activeCardCost = cardCost(state, card);
      state.activeCardStacks = card.discardStacks ?? 0;
      state.activeCardResonance = card.resonanceStacks ?? 0;
      let resolution!: EffectResolution;
      let recorded: AnimHit[] = [];
      try {
        recorded = withHitRecorder(() => {
          resolution = resolveEffects(state, card.effects, card.ownerCharId, primaryId);
        });
      } finally {
        state.activeCardCost = previousCardCost;
        state.activeCardStacks = previousCardStacks;
        state.activeCardResonance = previousCardResonance;
      }
      checkEnd(state);
      if (recorder) recordCardTrigger(state, card, beforeHp, recorder, resolution, true, recorded);
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

// effects.ts 通过 ops 调用此入口，避免与本模块形成静态循环依赖。
ops.discard = moveToDiscard;
ops.flushAutoPlays = flushAutoPlays;
ops.addCardToHand = addCardToHand;
