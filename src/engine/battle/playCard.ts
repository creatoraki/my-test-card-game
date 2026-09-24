// ============================================================================
// 打出一张牌 —— 从 battle.ts 拆出的出牌编排: 可打出判定、费用支付、效果结算、标记与后续推进。
// 所有函数直接修改传入的 BattleState(store 层负责克隆后再调用, 保证不可变更新)。
// ============================================================================

import type { AnimHit, BattleState, Card, FxRecorder } from "../types";
import { RULES } from "../core/battleRules";
import { addMod, partyHandLimit } from "../combat/stats";
import { applyStatus, checkEnd, ctxFor, log, ops } from "../core/ops";
import { STATUS_DEFS } from "../statuses";
import { resolveEffects } from "../effects/effects";
import { baseEffectsOf } from "../cards/cardEffects";
import { cardCost, manaCostOf, starlightPayment } from "../cards/cost";
import { advanceTick } from "./scheduler";
import { runRelicHook } from "../relics/types";
import { noteChallengePlay } from "../challenges";
import { flushAutoPlays, moveToDiscard, takeDiscardSnapshot, withDiscardRecorder } from "../deck/discard";
import { KEYWORD_DEFS } from "../cards/keywords";
import { CARD_MARK_DEFS, isPersistentMark } from "../cards/cardMarks";
import { firePassive, isPassive, playableHandUids } from "../combat/passive";
import { fireRelic } from "../relics/relics";
import { validFoeTargetIds } from "../combat/targeting";
import { cultivateReady, effectiveTargeting, resetCultivate } from "../deck/cultivate";
import { bloomExtraEffects, graftBonusPct } from "./cultivatePlay";
import { emptyFullDraw, resolveFullDraw } from "../deck/fullDraw";
import { withHitRecorder } from "../core/animHits";
import { prophetIdOf } from "../prophet/prophetUnit";
import {
  consumeZenithStar,
  evaluateCascade,
  fireWaterfallHooks,
  prepareWaterfallEncore,
  resolveWaterfallEncore,
  waterfallHolds,
} from "./waterfall";

// 出牌记录器: 收集出牌后触发的敌人行动动画帧, 并回传"出牌后/敌人行动前"的快照。
export interface PlayRecorder {
  steps: FxRecorder["steps"];
  cardMissedTargets: string[];
  cardFullDraw?: number;
  cardKeywordTriggers?: Record<string, number>;
  cardSnapshot?: BattleState;
  // 本次出牌真实影响到的单位与逐段明细(见 animHits.ts)。UI 据此飘字与播音效 ——
  // 不要再从卡牌定义反推目标: lowestHpAlly / randomAlly / 培育追加效果都推不出来。
  cardHits?: AnimHit[];
}

function isValidPrimary(state: BattleState, card: Card, primaryId?: string): boolean {
  if (!primaryId) return false;
  const t = state.combatants[primaryId];
  if (!t || !t.alive) return false;
  const targeting = effectiveTargeting(card);
  if (targeting === "foe") {
    if (t.team !== "enemy") return false;
    const owner = state.combatants[card.ownerCharId];
    return owner?.team !== "player" || validFoeTargetIds(state, "player").includes(primaryId);
  }
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

// 撤回本次出牌期间写进面板的 PLAY_STAT_BONUS。★ 逐条按相反数写回 mods 再清台账,
// 与写入端严格对称 —— 出牌开始与出牌结束各调一次(后者兜底异常路径)。
function revertPlayStatMods(state: BattleState): void {
  for (const entry of state.playStatMods) {
    const target = state.combatants[entry.targetId];
    if (target) addMod(target, entry.stat, -entry.amount, entry.pct);
  }
  state.playStatMods = [];
}

// 卡牌标记效果的结算来源: 星印一律以预言家为来源(预言家阵亡则不结算收益), 其他标记以牌的所属者为来源。
function markSourceId(state: BattleState, card: Card, markId: string): string | undefined {
  return CARD_MARK_DEFS[markId]?.starSeal ? prophetIdOf(state) : card.ownerCharId;
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
  // 流光: 本次出牌视为速攻(不推进时刻, 出牌记录按速攻计入)。
  const playedType = cardMarksAtPlay.some((markId) => CARD_MARK_DEFS[markId]?.playsAsFast)
    ? "fast"
    : card.cardType;
  // 倒泻每次出牌都要判定: 递减则保留, 否则移除 —— 与这张牌有没有瀑布效果无关。
  const cascadeHolds = evaluateCascade(state, faceCost);
  // 瀑布只看"能打出的手牌" —— 被动卡无费用, 不参与任何费用比较。天顶星放在最后, 前两者成立时不消耗。
  const hasWaterfallEffect = baseEffectsOf(card).some((effect) => effect.condition === "waterfall");
  state.waterfallPlay = hasWaterfallEffect &&
    (waterfallHolds(state, card) || cascadeHolds || consumeZenithStar(state, card));
  state.activeCardStarSpent = starPayment;
  if (starPayment > 0) applyStatus(state, owner.id, "starlight", -starPayment);
  state.resources[RULES.resource.name] -= manaPayment;
  state.hand = state.hand.filter((x) => x !== uid);
  state.pendingDiscardPicks = [...(playOptions?.discardPicks ?? [])];
  state.activeCardUid = uid;
  state.activeCardPrimaryId = primaryId ?? null;
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
      // 嫁接加成与本卡数值同一乘区; 须在 resetCultivate 之前读取培育阶段。
      state.playValueBonusPct = graftBonusPct(state, card);
      revertPlayStatMods(state);
      state.activeCardCost = faceCost;
      state.activeCardType = playedType;
      state.activeCardStacks = card.discardStacks ?? 0;
      state.activeCardResonance = card.resonanceStacks ?? 0;
      state.fullDraw = emptyFullDraw();
      try {
        // 天启计数: 放在本卡效果之前 —— 本卡自己新施加的预言不会吃到这次支付。
        if (starPayment > 0) ops.prophecyEvent(state, { type: "starlightSpent", amount: starPayment });
        runRelicHook(state, "beforeCardEffects", card, primaryId);
        for (const markId of cardMarksAtPlay) {
          const preEffects = CARD_MARK_DEFS[markId]?.preEffects;
          if (preEffects?.length) mergeCardResolution(resolveEffects(state, preEffects, card.ownerCharId, primaryId));
        }
        resolveFullDraw(state, card, primaryId);
        if (rec) rec.cardFullDraw = state.fullDraw.hitIds.length;
        const cultivated = cultivateReady(card);
        const cultivateMode = card.cultivate?.mode ?? "append";
        const baseEffects = baseEffectsOf(card);
        const bloomEffects = bloomExtraEffects(state, card);
        mergeCardResolution(prepareWaterfallEncore(state, card, primaryId));
        mergeCardResolution(resolveEffects(state, baseEffects, card.ownerCharId, primaryId));
        if (state.waterfallPlay) {
          mergeCardResolution(resolveWaterfallEncore(state, card, primaryId));
          fireWaterfallHooks(state);
        }

        if (cultivated && cultivateMode !== "replace")
          mergeCardResolution(resolveEffects(state, card.cultivate!.effects, card.ownerCharId, primaryId));
        // 盛放(花期): 成熟牌的培育效果 / 过熟牌的过熟效果再结算一次。
        if (bloomEffects.length)
          mergeCardResolution(resolveEffects(state, bloomEffects, card.ownerCharId, primaryId));
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
          const sourceId = markSourceId(state, card, markId);
          if (mark?.effects.length && sourceId)
            mergeCardResolution(resolveEffects(state, mark.effects, sourceId, primaryId));
        }
        // 常驻增益(星契)打出后保留, 其他标记全部结算后移除。
        card.marks = (card.marks ?? []).filter(isPersistentMark);
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
        state.activeCardType = null;
        state.activeCardStarSpent = 0;
        state.activeCardStacks = 0;
        state.activeCardResonance = 0;
        state.activeCardUid = null;
        state.activeCardPrimaryId = null;
        state.pendingDiscardPicks = [];
      }
    });
  });
  // 只吃护盾/状态、没有 HP 变化的目标不在这里补 —— 它们由 UI 侧的 fxTargets 兜底闪特效。
  if (rec) rec.cardHits = cardHits;

  const played = {
    uid: card.uid,
    cost: faceCost,
    cardType: playedType,
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
      playedType === "normal" ? RULES.timeline.normalCardAdvance : RULES.timeline.fastCardAdvance;
    if (adv > 0) withDiscardRecorder(rec, () => advanceTick(state, adv, rec));
  }

  return true;
}
