// 手牌操作效果 —— 从 effects.ts 拆出的牌堆、手牌与卡牌实例操作。

import type { Ally, BattleState, Card, EffectDescriptor } from "./types";
import type { EffectResolution } from "./effects";
import { resolveEffects } from "./effects";
import { ops } from "./ops";
import { drawCards, addCardCopyToHand } from "./deck";
import { partyHandLimit } from "./stats";
import { rngPick } from "./rng";
import { counterOf } from "./counters";
import { cardCost, starPayable } from "./cost";
import { CARD_MARK_DEFS } from "./cardMarks";
import { isPassive, playableHandUids } from "./passiveCards";
import { advanceCultivate, resetCultivate } from "./cultivate";
import { makeCard } from "../data";

function emptyResolution(): EffectResolution {
  return { missed: [], hit: [] };
}

function markCard(state: BattleState, card: Card, markId: string): void {
  card.marks ??= [];
  if (card.marks.includes(markId)) return;
  card.marks.push(markId);
  ops.log(state, `${card.name} 被标记为${CARD_MARK_DEFS[markId]?.name ?? markId}`);
}

function recoverMark(card: Card | undefined, markId: string | undefined): void {
  if (!card || !markId) return;
  card.marks ??= [];
  if (!card.marks.includes(markId)) card.marks.push(markId);
}

function takePendingDiscardPicks(state: BattleState, amount: number): string[] {
  const selected: string[] = [];
  const remaining: string[] = [];
  for (const uid of state.pendingDiscardPicks) {
    if (selected.length < amount && state.hand.includes(uid) && !selected.includes(uid)) selected.push(uid);
    else remaining.push(uid);
  }
  state.pendingDiscardPicks = remaining;
  return selected;
}

function selectDiscardUids(
  state: BattleState,
  amount: number,
  pick: NonNullable<EffectDescriptor["discardPick"]>,
): string[] {
  if (pick === "handAll") return [...state.hand];
  if (pick === "handRandom") {
    const selected: string[] = [];
    const pool = [...state.hand];
    for (let i = 0; i < amount && pool.length > 0; i++) {
      const uid = rngPick(state, pool);
      selected.push(uid);
      pool.splice(pool.indexOf(uid), 1);
    }
    return selected;
  }

  const selected = takePendingDiscardPicks(state, amount);
  const rest = state.hand.filter((uid) => !selected.includes(uid));
  const fallback = pick === "handBottom" ? rest.slice(-Math.max(0, amount - selected.length)) : rest.slice(0, amount - selected.length);
  return [...selected, ...fallback];
}

function applyDiscard(state: BattleState, effect: EffectDescriptor): void {
  const amountToDiscard = Math.max(0, Math.floor(effect.amount ?? 0));
  const pick = effect.discardPick ?? "handTop";
  if (amountToDiscard === 0 && pick !== "handAll") return;
  const selected = selectDiscardUids(state, amountToDiscard, pick);
  const selectedFastCount = selected.filter((uid) => state.cards[uid]?.cardType === "fast").length;
  const selectedCost = selected.reduce((sum, uid) => {
    const card = state.cards[uid];
    return sum + (card ? cardCost(state, card) : 0);
  }, 0);
  for (const uid of selected) ops.discard(state, uid, "effect");
  state.lastDiscardBatch = selected.length;
  state.lastDiscardBatchFast = selectedFastCount;
  state.lastDiscardBatchCost = selectedCost;
}

function applyRecover(state: BattleState, effect: EffectDescriptor, sourceId: string): void {
  const limit = partyHandLimit(state);
  const count = Math.min(
    Math.max(1, Math.floor(effect.amount ?? 1)),
    state.discard.length,
    limit - state.hand.length,
  );
  if (count <= 0 || state.pendingChoice) {
    state.lastRecoverBatchFast = 0;
    ops.log(state, "弃牌堆为空或手牌已满，无法回收牌");
    return;
  }
  if (effect.recoverPick === "random") {
    const pool = [...state.discard];
    let recoveredFastCount = 0;
    let recovered = 0;
    for (let i = 0; i < count && pool.length > 0; i++) {
      const uid = rngPick(state, pool);
      const card = state.cards[uid];
      if (card?.cardType === "fast") recoveredFastCount += 1;
      recoverMark(card, effect.recoverMark);
      state.discard = state.discard.filter((id) => id !== uid);
      state.hand.push(uid);
      if (card) resetCultivate(card);
      pool.splice(pool.indexOf(uid), 1);
      recovered += 1;
    }
    state.lastRecoverBatchFast = recoveredFastCount;
    ops.log(state, `从弃牌堆随机回收 ${recovered} 张牌`);
    return;
  }
  state.pendingChoice = {
    kind: "recoverFromDiscard",
    sourceCardUid: sourceId,
    count,
    recoverMark: effect.recoverMark,
  };
  ops.log(state, "请选择一张弃牌堆中的牌回到手牌");
}

function applyMarkCards(state: BattleState, effect: EffectDescriptor): void {
  if (!effect.mark || !effect.markPick) return;
  if (effect.markUnique && Object.values(state.cards).some((card) => card.marks?.includes(effect.mark!))) return;
  const markable = playableHandUids(state);
  if (effect.markPick === "eventCard") {
    const uid = state.passiveEventCardUid;
    const target = uid ? state.cards[uid] : undefined;
    if (target && !isPassive(target) && state.hand.includes(target.uid)) markCard(state, target, effect.mark);
    return;
  }
  if (effect.markPick === "handAll") {
    for (const uid of markable) {
      const card = state.cards[uid];
      if (card) markCard(state, card, effect.mark);
    }
    return;
  }
  if (effect.markPick === "handBottom") {
    const bottomUid = markable[markable.length - 1];
    const card = bottomUid ? state.cards[bottomUid] : undefined;
    if (card) markCard(state, card, effect.mark);
    return;
  }
  const amountToMark = Math.max(0, Math.floor(effect.amount ?? 0));
  if (effect.markPick === "handHighestCostRandom") {
    const candidates = markable.map((uid) => state.cards[uid]).filter((card): card is Card => card != null);
    const highestCost = Math.max(...candidates.map((card) => cardCost(state, card)), -Infinity);
    const highest = candidates.filter((card) => cardCost(state, card) === highestCost);
    const card = highest.length > 0 ? rngPick(state, highest) : undefined;
    if (card) markCard(state, card, effect.mark);
    return;
  }
  const pool = markable.filter((uid) => {
    const card = state.cards[uid];
    if (!card) return false;
    if (effect.markPick === "handRandomUnmarked") return (card.marks?.length ?? 0) === 0;
    return effect.markPick !== "handRandomNonStarPay" || !starPayable(card);
  });
  for (let i = 0; i < amountToMark && pool.length > 0; i++) {
    const uid = rngPick(state, pool);
    const card = state.cards[uid];
    if (card) markCard(state, card, effect.mark);
    pool.splice(pool.indexOf(uid), 1);
  }
}

function applyTransform(state: BattleState, effect: EffectDescriptor): void {
  if (!effect.cardId) return;
  const pool = [...playableHandUids(state)];
  const amount = Math.max(0, Math.floor(effect.amount ?? 1));
  for (let i = 0; i < amount && pool.length > 0; i++) {
    const uid = rngPick(state, pool);
    const original = state.cards[uid];
    if (original) {
      const transformed = makeCard(effect.cardId);
      state.cards[uid] = { ...transformed, uid, ownerCharId: original.ownerCharId };
      ops.log(state, `${original.name} 变为 ${transformed.name}`);
    }
    pool.splice(pool.indexOf(uid), 1);
  }
}

function applyCopyToHand(state: BattleState): void {
  const uid = state.passiveEventCardUid;
  const source = uid ? state.cards[uid] : undefined;
  if (source) addCardCopyToHand(state, source);
}

function applyAddCard(state: BattleState, effect: EffectDescriptor, sourceId: string): void {
  if (!effect.cardId) return;
  const source = state.combatants[sourceId];
  const allies = source
    ? (state.playerIds.map((id) => state.combatants[id]).filter((ally): ally is Ally => ally?.alive && ally.team === "player"))
    : [];
  if (effect.cardOwner === "randomAlly" && allies.length === 0) return;
  const rawAmount = effect.amountFrom ? counterOf(state, effect.amountFrom) : effect.amount ?? 1;
  const amount = Math.min(effect.maxAmount ?? Infinity, Math.max(0, Math.floor(rawAmount)));
  for (let i = 0; i < amount && state.hand.length < partyHandLimit(state); i++) {
    const ownerCharId = effect.cardOwner === "randomAlly" ? rngPick(state, allies).charId : undefined;
    ops.addCardToHand(state, effect.cardId, ownerCharId);
  }
}

function applyConvert(state: BattleState, effect: EffectDescriptor): void {
  const convertTo = effect.convertTo ?? "fast";
  const logConvert = (card: Card) => ops.log(state, `${card.name} 转换为${card.cardType === "fast" ? "速攻" : "普通"}牌`);
  if (effect.convertPick === "handAllFast") {
    const targets = playableHandUids(state).filter((uid) => state.cards[uid]?.cardType === "fast");
    for (const uid of targets) {
      const card = state.cards[uid];
      if (!card) continue;
      card.cardType = convertTo;
      logConvert(card);
    }
    state.lastConvertBatch = targets.length;
    return;
  }
  if (effect.convertPick !== "handRandomNormal") return;
  const amountToConvert = Math.max(0, Math.floor(effect.amount ?? 1));
  const pool = playableHandUids(state).filter((uid) => state.cards[uid]?.cardType === "normal");
  let converted = 0;
  for (let i = 0; i < amountToConvert && pool.length > 0; i++) {
    const uid = rngPick(state, pool);
    const card = state.cards[uid];
    if (card) {
      card.cardType = convertTo;
      logConvert(card);
      converted += 1;
    }
    pool.splice(pool.indexOf(uid), 1);
  }
  state.lastConvertBatch = converted;
}

function applyCultivateTick(state: BattleState, effect: EffectDescriptor): void {
  const rawAmount = effect.amountFrom ? counterOf(state, effect.amountFrom) : effect.amount ?? 1;
  const amountToTick = Math.min(effect.maxAmount ?? Infinity, Math.max(0, Math.floor(rawAmount)));
  if (amountToTick <= 0) return;
  const pool = state.hand.filter((uid) => {
    const card = state.cards[uid];
    return card?.cultivate != null && (card.cultivateLeft ?? card.cultivate.turns) > 0;
  });
  for (let i = 0; i < amountToTick && pool.length > 0; i++) {
    const uid = rngPick(state, pool);
    const card = state.cards[uid];
    if (card) {
      advanceCultivate(card, 1);
      ops.log(state, `${card.name} 的培育层数 -1`);
    }
    pool.splice(pool.indexOf(uid), 1);
  }
}

function applyResonate(state: BattleState, effect: EffectDescriptor): void {
  const amountToResonate = Math.max(0, Math.floor(effect.amount ?? 1));
  const activeCost = state.activeCardCost ?? Infinity;
  const targets = state.hand.filter((uid) => {
    const card = state.cards[uid];
    return card?.resonance === true && (effect.resonatePick === "handAll" || card.cost < activeCost);
  });
  for (const uid of targets) {
    const card = state.cards[uid];
    if (card) card.resonanceStacks = (card.resonanceStacks ?? 0) + amountToResonate;
  }
}

export function applyHandEffect(
  state: BattleState,
  effect: EffectDescriptor,
  sourceId: string,
  _targetIds: string[],
): EffectResolution {
  switch (effect.type) {
    case "DISCARD":
      applyDiscard(state, effect);
      break;
    case "RECOVER_FROM_DISCARD":
      applyRecover(state, effect, sourceId);
      break;
    case "MARK_CARDS":
      applyMarkCards(state, effect);
      break;
    case "CONVERT_CARD_TYPE":
      applyConvert(state, effect);
      break;
    case "ADD_CARD_TO_HAND":
      applyAddCard(state, effect, sourceId);
      break;
    case "CULTIVATE_TICK":
      applyCultivateTick(state, effect);
      break;
    case "RESONATE":
      applyResonate(state, effect);
      break;
    case "TRANSFORM_CARD":
      applyTransform(state, effect);
      break;
    case "COPY_CARD_TO_HAND":
      applyCopyToHand(state);
      break;
    case "CHOOSE_HAND_CARD": {
      const candidates = playableHandUids(state).filter((uid) => {
        if (effect.handChoiceAction === "markTarget" && uid === state.markTransferSourceUid) return false;
        if (effect.handChoiceAction === "markSource" || effect.handChoiceAction === "stripMarks") {
          if ((state.cards[uid]?.marks?.length ?? 0) === 0) return false;
        }
        if (effect.handChoiceAction !== "cultivateTick") return true;
        const card = state.cards[uid];
        return card?.cultivate != null && (card.cultivateLeft ?? card.cultivate.turns) > 0;
      });
      if (candidates.length === 0) {
        if (effect.handChoiceAction === "devour") state.chosenCardCost = 0;
        if (effect.handChoiceAction === "stripMarks") state.lastStrippedMarks = 0;
        if (effect.handChoiceAction === "markTarget") state.markTransferSourceUid = null;
        if (["markSource", "markTarget", "devour", "stripMarks"].includes(effect.handChoiceAction ?? ""))
          return emptyResolution();
        return effect.followUp?.length ? resolveEffects(state, effect.followUp, sourceId, undefined) : emptyResolution();
      }
      if (effect.handChoiceAction) {
        state.pendingChoice = {
          kind: "pickHandCard",
          sourceCardUid: state.activeCardUid ?? "",
          ownerCharId: sourceId,
          action: effect.handChoiceAction,
          followUp: effect.followUp,
        };
      }
      break;
    }
    default:
      return emptyResolution();
  }
  return emptyResolution();
}
