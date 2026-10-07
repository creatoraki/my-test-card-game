// ============================================================================
// 带演出录制的待选结算 —— 选手牌 / 弃牌堆 / 抽牌堆 / 小队增益的统一收尾入口。
// ★ 出牌留下待选时, playCard 不推进时刻(记在 deferredTickAdvance);
//   选择完成或放弃后在这里补推进, 敌人行动因此一定排在选牌结算之后。
// ★ 选牌的后续效果(黑洞的伤害 / 护盾等)在这里录成命中明细, UI 据此补播出牌动画。
// ============================================================================

import type { AnimHit, BattleState, FxRecorder } from "../types";
import { allIds, checkEnd } from "../core/ops";
import { fillMissingHits, withHitRecorder } from "../core/animHits";
import { snapshotHp, takeDiscardSnapshot, withDiscardRecorder } from "../cards/cardFx";
import { advanceTick } from "./scheduler";
import { cancelPendingChoice, resolvePendingChoice } from "./battleChoices";
import { flushArkCardPlayed } from "../ecoArk/sentry";
import { flushAutoPlays } from "../deck/discard";
import { beginArkAttack, finishArkAttack } from "../ecoArk/guard";

export interface ChoiceRecorder extends FxRecorder {
  // 选牌后续效果的命中(含只吃护盾的目标); 没有后续效果时不写。
  cardHits?: AnimHit[];
  // 后续效果结算后、敌人行动前的快照。
  cardSnapshot?: BattleState;
  sourceCardUid?: string;
  actorId?: string;
}

function snapshotShield(state: BattleState): Record<string, number> {
  const shields: Record<string, number> = {};
  for (const id of allIds(state)) shields[id] = state.combatants[id].shield;
  return shields;
}

// 选择完成(或放弃)后补上出牌时暂缓的时刻推进。仍有待选(连续选择)时继续等待。
export function settleDeferredAdvance(state: BattleState, rec?: FxRecorder): void {
  if (state.pendingChoice) return;
  const adv = state.deferredTickAdvance;
  state.deferredTickAdvance = 0;
  delete state.ark.deferredAttack;
  withDiscardRecorder(rec, () => {
    flushArkCardPlayed(state, rec);
    flushAutoPlays(state, rec);
  });
  if (state.pendingChoice) {
    state.deferredTickAdvance = adv;
    return;
  }
  if (adv <= 0 || state.phase !== "player") return;
  withDiscardRecorder(rec, () => advanceTick(state, adv, rec));
}

export function resolveChoiceRecorded(state: BattleState, uid: string, rec?: ChoiceRecorder): boolean {
  const choice = state.pendingChoice;
  if (!choice) return false;
  const followUp = choice.kind === "pickHandCard" ? choice.followUp ?? [] : [];
  const beforeHp = snapshotHp(state);
  const beforeShield = snapshotShield(state);
  let ok = false;
  const deferred = state.ark.deferredAttack;
  const sourceCard = deferred ? state.cards[deferred.cardUid] : undefined;
  const recorded = withHitRecorder(() => {
    withDiscardRecorder(rec, () => {
      if (sourceCard) beginArkAttack(state, sourceCard, deferred);
      try { ok = resolvePendingChoice(state, uid); }
      finally { if (sourceCard) finishArkAttack(state); }
    });
  });
  if (!ok) return false;
  checkEnd(state);
  if (rec) {
    if (choice.kind === "pickHandCard" && followUp.length > 0 && !state.pendingChoice) {
      const shielded = allIds(state).filter((id) => state.combatants[id].shield > (beforeShield[id] ?? 0));
      rec.cardHits = fillMissingHits(state, beforeHp, [...recorded], shielded);
      rec.sourceCardUid = choice.sourceCardUid;
      rec.actorId = choice.ownerCharId;
    }
    rec.cardSnapshot = takeDiscardSnapshot(state) ?? structuredClone(state);
  }
  settleDeferredAdvance(state, rec);
  return true;
}

export function cancelChoiceRecorded(state: BattleState, rec?: FxRecorder): boolean {
  if (!cancelPendingChoice(state)) return false;
  settleDeferredAdvance(state, rec);
  return true;
}
