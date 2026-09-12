import type { BattleState } from "./types";
import { advanceCultivate, resetCultivate } from "./cultivate";
import { gainSquadBuff } from "./squadBuff";
import { cardCost } from "./cost";
import { resolveEffects } from "./effects";
import { firePassive } from "./passive";
import { log, ops } from "./ops";
import { partyHandLimit } from "./stats";

export function resolvePendingChoice(state: BattleState, uid: string): boolean {
  const choice = state.pendingChoice;
  if (!choice) return false;
  if (choice.kind === "pickSquadBuff") {
    if (!choice.options.includes(uid) || state.squadBuffs.some((entry) => entry.id === uid)) return false;
    if (!gainSquadBuff(state, uid as Parameters<typeof gainSquadBuff>[1])) return false;
    state.pendingChoice = null;
    log(state, `获得 ${uid}`);
    return true;
  }
  if (choice.kind === "pickFromDraw") {
    if (!choice.options.includes(uid) || !state.draw.includes(uid) || state.hand.length >= partyHandLimit(state))
      return false;
    state.draw = state.draw.filter((drawUid) => drawUid !== uid);
    state.hand.push(uid);
    const card = state.cards[uid];
    if (card) {
      resetCultivate(card);
      if (choice.mark) {
        card.marks ??= [];
        if (!card.marks.includes(choice.mark)) card.marks.push(choice.mark);
      }
    }
    state.pendingChoice = null;
    log(state, `${card?.name ?? "卡牌"} 已从抽牌堆顶加入手牌`);
    return true;
  }
  if (choice.kind === "pickHandCard") {
    if (!state.hand.includes(uid)) return false;
    const card = state.cards[uid];
    let dominoMarkConsumed = false;
    if (choice.action === "cultivateTick") {
      if (!card?.cultivate || (card.cultivateLeft ?? card.cultivate.turns) <= 0) return false;
      advanceCultivate(card, 1);
      log(state, `${card.name} 的培育层数 -1`);
    } else if (choice.action === "moveToBottom") {
      state.hand = state.hand.filter((handUid) => handUid !== uid);
      state.hand.push(uid);
    } else if (choice.action === "noto") {
      if (card) card.notoPending = true;
      ops.discard(state, uid, "effect");
    } else if (choice.action === "markSource") {
      if (!card?.marks?.length) return false;
      state.markTransferSourceUid = uid;
    } else if (choice.action === "markTarget") {
      const sourceUid = state.markTransferSourceUid;
      const source = sourceUid ? state.cards[sourceUid] : undefined;
      if (!source || sourceUid === uid) return false;
      const targetMarks = new Set(card?.marks ?? []);
      for (const mark of source.marks ?? []) targetMarks.add(mark);
      if (card) card.marks = [...targetMarks];
      source.marks = [];
      state.markTransferSourceUid = null;
    } else if (choice.action === "devour") {
      if (!card) return false;
      state.chosenCardCost = cardCost(state, card);
      dominoMarkConsumed = card.marks?.includes("domino") ?? false;
      state.hand = state.hand.filter((handUid) => handUid !== uid);
      if (!state.exhaust.includes(uid)) state.exhaust.push(uid);
      card.marks = [];
      card.resonanceStacks = 0;
      resetCultivate(card);
    } else if (choice.action === "stripMarks") {
      if (!card?.marks?.length) return false;
      const stripped = card.marks.slice(0, 2);
      state.lastStrippedMarks = stripped.length;
      dominoMarkConsumed = stripped.includes("domino");
      card.marks = card.marks.slice(stripped.length);
    }
    state.pendingChoice = null;
    if (dominoMarkConsumed) firePassive(state, { type: "cardPlayed", cardUid: uid });
    if (choice.followUp?.length) resolveEffects(state, choice.followUp, choice.ownerCharId, undefined);
    log(state, `${card?.name ?? "卡牌"} 已完成选择操作`);
    return true;
  }

  if (!state.discard.includes(uid) || state.hand.length >= partyHandLimit(state)) return false;
  state.discard = state.discard.filter((id) => id !== uid);
  state.hand.push(uid);
  const card = state.cards[uid];
  if (card) resetCultivate(card);
  if (card && choice.recoverMark) {
    card.marks ??= [];
    if (!card.marks.includes(choice.recoverMark)) card.marks.push(choice.recoverMark);
  }
  if (choice.count > 1) choice.count -= 1;
  else state.pendingChoice = null;
  log(state, `${card?.name ?? "卡牌"} 已从弃牌堆回到手牌`);
  return true;
}

export function cancelPendingChoice(state: BattleState): boolean {
  if (!state.pendingChoice) return false;
  if (state.pendingChoice.kind === "pickHandCard") return false;
  state.pendingChoice = null;
  log(state, "放弃当前选择");
  return true;
}
