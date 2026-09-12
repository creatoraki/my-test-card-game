// ============================================================================
// 战斗编排 —— 公开的高层操作: createBattle / playCard / endRound。
// 所有函数直接修改传入的 BattleState(store 层负责克隆后再调用, 保证不可变更新)。
// ============================================================================

import type {
  AnimHit,
  BattleState,
  Card,
  Enemy,
  EncounterModifier,
  FxRecorder,
} from "./types";
import { RULES } from "./rules";
import {
  addMod,
  partyDrawCount,
  partyHandLimit,
  partyManaPerRound,
  partyOpeningDrawCount,
  partyRedrawLimit,
  partyWaitLimit,
} from "./stats";
import { applyStatus, checkEnd, ctxFor, log, ops } from "./ops";
import { STATUS_DEFS } from "./statuses";
import { allyTempoIds, runAllyTempo, runOwnerTempo } from "./statusLifecycle";
import { drawCards } from "./deck";
import { resolveEffects } from "./effects";
import { baseEffectsOf } from "./cardEffects";
import { cardCost, manaCostOf, starlightPayment } from "./cost";
import { startCharge } from "./ai";
import { advanceTick, flushPendingActs } from "./scheduler";
import { runRelicHook } from "./relicBehaviors/types";

import {
  checkChallengesOnEndTurn,
  checkMassacreOnRoundSettle,
  noteChallengePlay,
  noteChallengeRedraw,
} from "./challenges";
import { flushAutoPlays, moveToDiscard, takeDiscardSnapshot, withDiscardRecorder } from "./discard";
import { KEYWORD_DEFS } from "./keywords";
import { CARD_MARK_DEFS } from "./cardMarks";
import { firePassive, isPassive, playableHandUids, recycleHandPassives } from "./passive";
import { fireRelic } from "./relics";
import { cultivateReady, effectiveTargeting, resetCultivate, tickCultivate } from "./cultivate";
import { withHitRecorder } from "./animHits";
import { runEnemyFlee } from "./flee";
import {
  consumeZenithStar,
  fireWaterfallHooks,
  prepareWaterfallEncore,
  resolveWaterfallEncore,
  waterfallHolds,
} from "./waterfall";
import { createBattleState } from "./battleSetup";
import type { BattleSetup as BattleSetupInput } from "./battleSetup";

// 出牌记录器: 收集出牌后触发的敌人行动动画帧, 并回传"出牌后/敌人行动前"的快照。
export interface PlayRecorder {
  steps: FxRecorder["steps"];
  cardMissedTargets: string[];
  cardKeywordTriggers?: Record<string, number>;
  cardSnapshot?: BattleState;
  // 本次出牌真实影响到的单位与逐段明细(见 animHits.ts)。UI 据此飘字与播音效 ——
  // 不要再从卡牌定义反推目标: lowestHpAlly / randomAlly / 培育追加效果都推不出来。
  cardHits?: AnimHit[];
}

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
  state.tick = RULES.timeline.startTick;
  tickCultivate(state);
  state.redrawsThisRound = 0;
  state.waitsThisRound = 0;
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
  state.resources[rn] = partyManaPerRound(state) + (RULES.resource.carryOver ? state.resources[rn] ?? 0 : 0);

  for (const id of state.enemyIds) {
    const e = state.combatants[id] as Enemy;
    if (!e.alive) continue;
    e.actsThisRound = 0;
    startCharge(state, id);
  }

  // 状态的回合开始钩子(罗生门等)。★ 必须排在抽牌之前 —— 它们大多是"回合开始时抽牌"。
  runRoundStartHooks(state);

  // 第 1 回合抽开局张数(5), 之后每回合抽小队抽牌数(2), 均抽到手牌上限为止。
  const limit = partyHandLimit(state);
  const want = state.round === 1 ? partyOpeningDrawCount(state) : partyDrawCount(state);
  drawCards(state, Math.max(0, Math.min(want, limit - state.hand.length)));
  firePassive(state, { type: "roundStart" });
  recoverNotoCards(state);
  fireRelic(state, { type: "roundStart" });
  runRelicHook(state, "onRoundStart");

  checkEnd(state);
}

// ---------------------------------------------------------------------------
// 打出一张牌
// ---------------------------------------------------------------------------
function isValidPrimary(state: BattleState, card: Card, primaryId?: string): boolean {
  if (!primaryId) return false;
  const t = state.combatants[primaryId];
  if (!t || !t.alive) return false;
  const targeting = effectiveTargeting(card);
  if (targeting === "foe") return t.team === "enemy";
  if (targeting === "ally") return t.team === "player";
  return true;
}

// null = 可以打；mana = 只差法力；other = 结构性不可用。
export type PlayBlock = null | "mana" | "other";

export function playBlockReason(state: BattleState, uid: string): PlayBlock {
  const card = state.cards[uid];
  if (!card || state.phase !== "player" || !state.hand.includes(uid)) return "other";
  if (isPassive(card)) return "other"; // 被动卡不可打出, 只在手中生效
  const owner = state.combatants[card.ownerCharId];
  if (!owner || !owner.alive) return "other";
  if (owner.statuses.some((status) => status.id === "stun" && status.stacks > 0)) return "other";
  if (state.pendingChoice) return "other";
  return (state.resources[RULES.resource.name] ?? 0) >= manaCostOf(state, card) ? null : "mana";
}

export function canPlay(state: BattleState, uid: string): boolean {
  return playBlockReason(state, uid) === null;
}

export function redrawHandCard(state: BattleState, uid: string): boolean {
  if (
    state.pendingChoice ||
    state.phase !== "player" ||
    state.redrawsThisRound >= partyRedrawLimit(state) ||
    !state.hand.includes(uid)
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
  log(state, `⏳ 待机 —— 推进 ${RULES.timeline.waitAdvance} 时刻`);
  withDiscardRecorder(rec, () => advanceTick(state, RULES.timeline.waitAdvance, rec));
  return true;
}

export function discardHandCard(state: BattleState, uid: string, rec?: FxRecorder): boolean {
  if (state.pendingChoice || state.phase !== "player" || !state.hand.includes(uid)) return false;
  const card = state.cards[uid];
  if (!card) return false;

  moveToDiscard(state, uid, "manual", rec);
  log(state, `${card.name} 已丢弃`);
  flushAutoPlays(state, rec);
  checkEnd(state);
  return true;
}

// 撤回本次出牌期间写进面板的 PLAY_STAT_BONUS。★ 逐条按相反数写回 mods 再清台账,
// 与写入端严格对称 —— 出牌开始与出牌结束各调一次(后者兜底异常路径)。
function revertPlayStatMods(state: BattleState): void {
  for (const entry of state.playStatMods) {
    const target = state.combatants[entry.targetId];
    if (target) addMod(target, entry.stat, -entry.amount, entry.pct);
  }
  state.playStatMods = [];
}

export function playCard(
  state: BattleState,
  uid: string,
  primaryId?: string,
  recOrOpts?: PlayRecorder | { discardPicks?: string[] },
  options?: { discardPicks?: string[] },
): boolean {
  const rec = recOrOpts && "steps" in recOrOpts ? recOrOpts : undefined;
  const playOptions = recOrOpts && "discardPicks" in recOrOpts ? recOrOpts : options;
  if (!canPlay(state, uid)) return false;
  const card = state.cards[uid];
  const cardMarksAtPlay = [...(card.marks ?? [])];
  const owner = state.combatants[card.ownerCharId];
  const targeting = effectiveTargeting(card);
  if ((targeting === "foe" || targeting === "ally") && !isValidPrimary(state, card, primaryId))
    return false;

  const faceCost = cardCost(state, card);
  const starPayment = starlightPayment(state, card);
  const manaPayment = faceCost - starPayment;
  // 瀑布只看"能打出的手牌" —— 被动卡无费用, 不参与任何费用比较。
  const hasWaterfallEffect = baseEffectsOf(card).some((effect) => effect.condition === "waterfall");
  state.waterfallPlay = hasWaterfallEffect &&
    (waterfallHolds(state, card) || consumeZenithStar(state, card));
  state.activeCardStarSpent = starPayment;
  if (starPayment > 0) applyStatus(state, owner.id, "starlight", -starPayment);
  state.resources[RULES.resource.name] -= manaPayment;
  state.hand = state.hand.filter((x) => x !== uid);
  state.pendingDiscardPicks = [...(playOptions?.discardPicks ?? [])];
  state.activeCardUid = uid;
  log(state, `${owner.emoji} ${owner.name} 打出 ${card.name}`);
  const discardRecorder = rec;
  const cardMissed = new Set<string>();
  const cardHit = new Set<string>();
  const mergeCardResolution = (resolution: ReturnType<typeof resolveEffects>) => {
    resolution.missed.forEach((id) => cardMissed.add(id));
    resolution.hit.forEach((id) => cardHit.add(id));
  };
  // 本次出牌真实打到/治到了谁, 每个目标分了几段 —— 逐段由 ops.dealDamage / ops.heal 上报。
  // ⚠ 刻意不做「快照前后 HP 差」的兜底扫描: 弃牌联动与自动出牌在结算过程中也会改 HP,
  //   而它们各自会产出独立的动画步(见 discard.ts), 兜底扫描会让同一笔伤害飘两次。
  //   引擎里 HP 的写入口只有 dealDamage / heal(markDead 与 maxHp 修正除外), 记录器已经全覆盖。
  const cardHits = withHitRecorder(() => {
    withDiscardRecorder(discardRecorder, () => {
      state.playValueBonusPct = 0;
      revertPlayStatMods(state);
      state.activeCardCost = faceCost;
      state.activeCardStacks = card.discardStacks ?? 0;
      state.activeCardResonance = card.resonanceStacks ?? 0;
      state.lastAimConsumed = 0;
      try {
        runRelicHook(state, "beforeCardEffects", card, primaryId);
        for (const markId of cardMarksAtPlay) {
          const preEffects = CARD_MARK_DEFS[markId]?.preEffects;
          if (preEffects?.length) mergeCardResolution(resolveEffects(state, preEffects, card.ownerCharId, primaryId));
        }
        const cultivated = cultivateReady(card);
        const cultivateMode = card.cultivate?.mode ?? "append";
        const baseEffects = baseEffectsOf(card);
        mergeCardResolution(prepareWaterfallEncore(state, card, primaryId));
        mergeCardResolution(resolveEffects(state, baseEffects, card.ownerCharId, primaryId));
        if (state.waterfallPlay) {
          mergeCardResolution(resolveWaterfallEncore(state, card, primaryId));
          fireWaterfallHooks(state);
        }

        if (cultivated && cultivateMode !== "replace")
          mergeCardResolution(resolveEffects(state, card.cultivate!.effects, card.ownerCharId, primaryId));
        if (
          state.pendingChoice?.kind === "recoverFromDiscard" &&
          state.pendingChoice.sourceCardUid === card.ownerCharId
        ) {
          state.pendingChoice.sourceCardUid = uid;
        }
        resetCultivate(card);
        const fastPlays = state.playedThisRound.filter((played) => played.cardType === "fast").length;
        const returnsToHand = card.playReturn?.when === "fastPlaysThisRound" &&
          fastPlays >= card.playReturn.atLeast &&
          state.hand.length < partyHandLimit(state);
        if (card.exhaust) state.exhaust.push(uid);
        else if (returnsToHand) {
          state.hand.push(uid);
          card.costStacks = (card.costStacks ?? 0) + 1;
          log(state, `${card.name} 返回手牌，费用增加 ${card.playReturn?.costDelta ?? 0}`);
        } else moveToDiscard(state, uid, "play");

        for (const ref of card.keywords ?? []) {
          const def = KEYWORD_DEFS[ref.id];
          if (!def) continue;
          const ctx = { primaryId, hitIds: [...cardHit], baseEffects };
          const times = def.triggers(state, card, ctx);
          if (rec) {
            (rec.cardKeywordTriggers ??= {})[ref.id] =
              (rec.cardKeywordTriggers[ref.id] ?? 0) + times;
          }
          const effectTimes = Math.min(times, ref.maxTriggers ?? Infinity);
          for (let i = 0; i < effectTimes; i++)
            mergeCardResolution(resolveEffects(state, ref.effects, card.ownerCharId, primaryId));
          if (times > 0 && ref.onceEffects?.length)
            mergeCardResolution(resolveEffects(state, ref.onceEffects, card.ownerCharId, primaryId));
          def.onTriggered?.(state, card, ctx, times);
        }
        if (card.resonance) {
          for (const handUid of playableHandUids(state)) {
            const handCard = state.cards[handUid];
            if (handCard?.resonance && handCard.cost < faceCost)
              handCard.resonanceStacks = (handCard.resonanceStacks ?? 0) + 1;
          }
        }
        for (const markId of cardMarksAtPlay) {
          const mark = CARD_MARK_DEFS[markId];
          if (mark) mergeCardResolution(resolveEffects(state, mark.effects, card.ownerCharId, primaryId));
        }
        card.marks = [];
        if (!returnsToHand) card.discardStacks = 0; // 累计层数只在"未打出"期间有效, 打出即清零
        firePassive(state, { type: "cardPlayed", cardUid: uid }, rec);
        card.resonanceStacks = 0;
        state.waterfallPlay = false;
        state.playValueBonusPct = 0;
        // ⚠ 必须在 flushAutoPlays 之前撤回: 自动出牌是另一张牌的结算, 不该继承本卡的临时面板。
        revertPlayStatMods(state);
        runRelicHook(state, "afterCardPlay", card);
        const ownerStatuses = state.combatants[card.ownerCharId]?.statuses ?? [];
        for (const inst of [...ownerStatuses])
          STATUS_DEFS[inst.id]?.hooks?.onCardPlayed?.(ctxFor(state, card.ownerCharId, inst), card);
        if (rec) rec.cardMissedTargets = [...cardMissed].filter((id) => !cardHit.has(id));
        fireRelic(state, { type: "cardPlayed", targetId: primaryId }, rec);
        // 无明只覆盖本张牌及其卡上标记；弃牌触发的自动出牌不应消费预选队列。
        state.pendingDiscardPicks = [];
        flushAutoPlays(state, rec);
      } finally {
        state.activeCardCost = null;
        state.activeCardStarSpent = 0;
        state.activeCardStacks = 0;
        state.activeCardResonance = 0;
        state.activeCardUid = null;
        state.pendingDiscardPicks = [];
      }
    });
  });
  // 只吃护盾/状态、没有 HP 变化的目标不在这里补 —— 它们由 UI 侧的 fxTargets 兜底闪特效。
  if (rec) rec.cardHits = cardHits;

  const played = {
    uid: card.uid,
    cost: faceCost,
    cardType: card.cardType,
    ownerCharId: card.ownerCharId,
  };
  state.lastPlayedCard = played;
  state.playedThisRound.push(played);
  noteChallengePlay(state, card, faceCost);

  checkEnd(state);

  // 记录"出牌结算后、敌人行动前"的快照, 供 UI 先展示出牌结果再逐个播放敌人行动。
  if (rec) rec.cardSnapshot = takeDiscardSnapshot(state) ?? structuredClone(state);

  if (state.phase === "player") {
    const adv =
      card.cardType === "normal" ? RULES.timeline.normalCardAdvance : RULES.timeline.fastCardAdvance;
    if (adv > 0) withDiscardRecorder(rec, () => advanceTick(state, adv, rec));
  }

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
    checkMassacreOnRoundSettle(state);

    if (RULES.hand.discardLeftoversOnRoundEnd) {
      for (const cardUid of [...state.hand]) {
        if (!isPassive(state.cards[cardUid])) moveToDiscard(state, cardUid, "roundEnd");
      }
    }
    firePassive(state, { type: "roundEnd" }, rec);
    fireRelic(state, { type: "roundEnd" }, rec);
    runRelicHook(state, "onRoundEnd");
    // 手牌里剩下的被动卡自动收进弃牌堆 —— 不计弃牌数、不触发任何弃牌联动。
    recycleHandPassives(state, rec);
    for (const uid of [...state.hand]) {
      const card = state.cards[uid];
      if (!card?.voidCard) continue;
      state.hand = state.hand.filter((handUid) => handUid !== uid);
      if (!state.exhaust.includes(uid)) state.exhaust.push(uid);
      log(state, `${card.name} 因虚无进入消耗堆`);
    }
    flushAutoPlays(state, rec);
    runEnemyFlee(state, rec);
    if (state.phase !== "player") return;
    startRound(state);
  });
}

export { resolvePendingChoice, cancelPendingChoice } from "./battleChoices";
