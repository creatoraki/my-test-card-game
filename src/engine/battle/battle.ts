// ============================================================================
// 战斗编排 —— 公开的高层操作: createBattle / startRound / endRound 与手牌操作。
// 出牌编排在 playCard.ts, 这里统一 re-export, 对外入口保持不变。
// 所有函数直接修改传入的 BattleState(store 层负责克隆后再调用, 保证不可变更新)。
// ============================================================================

import type { AnimHit, BattleState, Enemy, EncounterModifier, FxRecorder } from "../types";
import { RULES } from "../core/battleRules";
import {
  partyDrawCount,
  partyHandLimit,
  partyManaPerRound,
  partyOpeningDrawCount,
  partyRedrawLimit,
  partyWaitLimit,
} from "../combat/stats";
import { checkEnd, log, ops } from "../core/ops";
import { STATUS_DEFS } from "../statuses";
// ★ 副作用导入: 遗物行为表、伤害管线与预言框架在加载时向 hookRegistry / ops 注册自己(见 hookRegistry.ts),
//   战斗入口必须保证它们已加载 —— 不能指望别处碰巧先 import 过。
import "../relics/relicBehaviors";
import "../bonds/bondBehaviors";
import "../damage";
import "../prophecy/prophecy";
import { allyTempoIds, purgeRoundStatuses, runAllyTempo, runOwnerTempo } from "../combat/statusLifecycle";
import { drawCards, witherCards } from "../deck/deck";
import { startCharge } from "../enemy/ai";
import { advanceTick, flushPendingActs } from "./scheduler";
import { runRelicHook } from "../relics/types";
import {
  checkChallengesOnEndTurn,
  checkChallengesOnRoundSettle,
  noteChallengeRedraw,
  noteChallengeWait,
} from "../challenges";
import { flushAutoPlays, moveToDiscard, withDiscardRecorder } from "../deck/discard";
import { firePassive, isPassive, recycleHandPassives } from "../combat/passive";
import { fireRelic } from "../relics/relics";
import { resetCultivate, tickCultivate } from "../deck/cultivate";
import { withHitRecorder } from "../core/animHits";
import { runEnemyFlee } from "./flee";
import { createBattleState } from "./battleSetup";
import type { BattleSetup as BattleSetupInput } from "./battleSetup";
import { exhaustCard } from "../deck/exhaust";
import { CARD_MARK_DEFS } from "../cards/cardMarks";
import { availableHand, cardLocked } from "../ecoArk/shared";
import { clearRoots } from "../ecoArk/resources";
import { bondManaCarry, hermitRoundEnd, openBondChoices, startBondRound } from "../bonds/bondRound";
import { playSuspendedCards } from "../bonds/bondAutoPlay";
export { releaseRoot } from "../ecoArk/resources";

export { bloodPactCostOf, canPlay, playBlockReason, playCard } from "./playCard";
export type { PlayBlock, PlayRecorder } from "./playCard";

export type { AllyInit, BattleSetup } from "./battleSetup";

export function createBattle(
  encounterId: string,
  setup: BattleSetupInput,
  seed?: number,
  mod?: EncounterModifier,
): BattleState {
  const state = createBattleState(encounterId, setup, seed, mod);
  startRound(state);
  return state;
}

// ---------------------------------------------------------------------------
// 回合开始
// ---------------------------------------------------------------------------
// 我方存活单位身上带 onRoundStart 的状态各触发一次。
function runRoundStartHooks(state: BattleState): void {
  for (const id of state.playerIds) {
    const unit = state.combatants[id];
    if (!unit?.alive) continue;
    for (const inst of [...unit.statuses]) {
      const hook = STATUS_DEFS[inst.id]?.hooks?.onRoundStart;
      if (hook) hook({ state, ownerId: id, inst, stacks: inst.stacks, ops });
    }
  }
}

function recoverNotoCards(state: BattleState): void {
  for (const card of Object.values(state.cards)) {
    if (!card.notoPending) continue;
    const canRecover = state.discard.includes(card.uid) && state.hand.length < partyHandLimit(state);
    card.notoPending = false;
    if (!canRecover) {
      log(state, `${card.name} 纳刀取回失败`);
      continue;
    }
    state.discard = state.discard.filter((uid) => uid !== card.uid);
    state.hand.push(card.uid);
    card.marks ??= [];
    if (!card.marks.includes("noto")) card.marks.push("noto");
    resetCultivate(card);
    log(state, `${card.name} 已从弃牌堆取回，进入纳刀状态`);
  }
}

export function startRound(state: BattleState): void {
  state.round += 1;
  const bondExtraDraw = startBondRound(state);
  state.tick = RULES.timeline.startTick;
  purgeRoundStatuses(state);
  clearRoots(state);
  tickCultivate(state);
  state.redrawsThisRound = 0;
  state.waitsThisRound = 0;
  state.deferredTickAdvance = 0;
  state.challengeFocusTargetId = null;
  state.attackedThisRound = [];
  state.echoGainedThisRound = false;
  state.discardsThisRound = 0;
  state.lastDiscardBatch = 0;
  state.lastDiscardBatchFast = 0;
  state.lastRecoverBatchFast = 0;
  state.lastDiscardBatchCost = 0;
  state.lastConvertBatch = 0;
  state.pendingAutoPlays = [];
  state.waterfallPlay = false;
  state.playedThisRound = [];
  state.lastPlayedCard = null;
  log(state, `—— 第 ${state.round} 回合(第 ${state.tick} 时刻)——`);

  const rn = RULES.resource.name;
  const leftover = state.round > 1 ? state.resources[rn] ?? 0 : 0;
  state.resources[rn] = partyManaPerRound(state) +
    (RULES.resource.carryOver ? leftover : bondManaCarry(state, leftover));

  for (const id of state.enemyIds) {
    const e = state.combatants[id] as Enemy;
    if (!e.alive) continue;
    e.ap += e.apPerRound;
    startCharge(state, id, true);
  }

  // 状态的回合开始钩子(罗生门等)。★ 必须排在抽牌之前 —— 它们大多是"回合开始时抽牌"。
  runRoundStartHooks(state);
  // 倒吊人 9: 上回合悬置的牌先于抽牌自动打出。
  playSuspendedCards(state);
  if (state.phase !== "player") return;

  // 第 1 回合抽开局张数(5), 之后每回合抽小队抽牌数(2), 均抽到手牌上限为止。隐者 3 补上回合末弃置的张数。
  const limit = partyHandLimit(state);
  const want = (state.round === 1 ? partyOpeningDrawCount(state) : partyDrawCount(state)) + bondExtraDraw;
  drawCards(state, Math.max(0, Math.min(want, limit - state.hand.length)));
  firePassive(state, { type: "roundStart" });
  recoverNotoCards(state);
  fireRelic(state, { type: "roundStart" });
  runRelicHook(state, "onRoundStart");

  checkEnd(state);
}

// ---------------------------------------------------------------------------
// 手牌操作(出牌编排见 playCard.ts)
// ---------------------------------------------------------------------------
export function redrawHandCard(state: BattleState, uid: string): boolean {
  if (
    state.pendingChoice ||
    state.phase !== "player" ||
    state.redrawsThisRound >= partyRedrawLimit(state) ||
    !state.hand.includes(uid) || cardLocked(state, uid)
  )
    return false;
  const card = state.cards[uid];
  if (!card) return false;

  moveToDiscard(state, uid, "redraw");
  state.redrawsThisRound += 1;
  drawCards(state, 1);
  noteChallengeRedraw(state);
  log(state, `${card.name} 已换牌`);
  return true;
}

// 待机: 什么都不做, 只推进时刻 —— 敌人因此可能走到行动点。每回合限 partyWaitLimit 次。
export function waitTick(state: BattleState, rec?: FxRecorder): boolean {
  if (state.pendingChoice || state.phase !== "player" || state.waitsThisRound >= partyWaitLimit(state)) return false;
  state.waitsThisRound += 1;
  noteChallengeWait(state);
  runRelicHook(state, "onWait");
  log(state, `⏳ 待机 —— 推进 ${RULES.timeline.waitAdvance} 时刻`);
  // 倒吊人 9 的悬置选择: 先等玩家选完(或放弃)再推进, 见 choiceResolve.settleDeferredAdvance。
  if (state.pendingChoice) {
    state.deferredTickAdvance = RULES.timeline.waitAdvance;
    return true;
  }
  withDiscardRecorder(rec, () => advanceTick(state, RULES.timeline.waitAdvance, rec));
  return true;
}

export function discardHandCard(state: BattleState, uid: string, rec?: FxRecorder): boolean {
  if (state.pendingChoice || state.phase !== "player" || !state.hand.includes(uid) || cardLocked(state, uid)) return false;
  const card = state.cards[uid];
  if (!card) return false;

  moveToDiscard(state, uid, "manual", rec);
  log(state, `${card.name} 已丢弃`);
  flushAutoPlays(state, rec);
  checkEnd(state);
  openBondChoices(state);
  return true;
}

// ---------------------------------------------------------------------------
// 结束回合
// ---------------------------------------------------------------------------
// 我方拍点(DOT/HOT)。带记录器时先结算全队, 再按掉血/回血各录一帧。
function runAllyTempoRecorded(state: BattleState, rec?: FxRecorder): void {
  if (!rec) {
    runAllyTempo(state);
    return;
  }
  const hits: AnimHit[] = [];
  for (const id of allyTempoIds(state)) {
    if (!state.combatants[id]?.alive) continue;
    hits.push(...withHitRecorder(() => runOwnerTempo(state, id)));
  }
  if (!hits.length) return;

  const snapshot = structuredClone(state);
  const hurtHits = hits.filter((hit) => hit.hpDelta > 0);
  if (hurtHits.length) {
    rec.steps.push({ kind: "tempo", ownerId: hurtHits[0].id, hits: hurtHits, snapshot });
  }
  const healHits = hits.filter((hit) => hit.hpDelta <= 0);
  if (healHits.length) {
    rec.steps.push({ kind: "tempo", ownerId: healHits[0].id, hits: healHits, snapshot });
  }
}

export function endRound(state: BattleState, rec?: FxRecorder): void {
  if (state.pendingChoice || state.phase !== "player") return;
  withDiscardRecorder(rec, () => {
    checkChallengesOnEndTurn(state);

    // 回合结束推进时刻, 让所有尚未发动的蓄力招式依次结算。
    flushPendingActs(state, rec);
    if (state.phase !== "player") return;

    runAllyTempoRecorded(state, rec);
    checkEnd(state);
    if (state.phase !== "player") return;
    checkChallengesOnRoundSettle(state);

    if (RULES.hand.discardLeftoversOnRoundEnd) {
      for (const cardUid of [...state.hand]) {
        if (!isPassive(state.cards[cardUid])) moveToDiscard(state, cardUid, "roundEnd");
      }
    }
    // 隐者 3 / 9: 从手牌最后一张开始弃置, 下回合开始补抽。
    hermitRoundEnd(state, rec);
    firePassive(state, { type: "roundEnd" }, rec);
    fireRelic(state, { type: "roundEnd" }, rec);
    runRelicHook(state, "onRoundEnd");
    // 手牌里剩下的被动卡自动收进弃牌堆 —— 不计弃牌数、不触发任何弃牌联动。
    recycleHandPassives(state, rec);
    witherCards(state);
    for (const uid of availableHand(state)) {
      const card = state.cards[uid];
      if (!card?.voidCard) continue;
      state.hand = state.hand.filter((handUid) => handUid !== uid);
      exhaustCard(state, uid);
      log(state, `${card.name} 因虚无进入消耗堆`);
    }
    flushAutoPlays(state, rec);
    for (const card of Object.values(state.cards)) {
      card.marks = card.marks?.filter((markId) => !CARD_MARK_DEFS[markId]?.expiresOnRoundEnd);
      card.costStacks = 0;
    }
    runEnemyFlee(state, rec);
    if (state.phase !== "player") return;
    startRound(state);
  });
}

export { resolvePendingChoice, cancelPendingChoice } from "./battleChoices";
export { resolveChoiceRecorded, cancelChoiceRecorded } from "./choiceResolve";
export type { ChoiceRecorder } from "./choiceResolve";
