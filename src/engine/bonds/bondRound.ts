// 羁绊在回合边界上的结算: 回合计数重置、魔术师法力结转、隐者回合末弃牌与下回合补抽、
// 隐者 6 的「预知」选择(在当前动作结算完、没有其他待选时才弹出)。由 battle/battle.ts 等编排处调用。

import type { BattleState, DiscardRecorder } from "../types";
import { log } from "../core/ops";
import { isPassive } from "../combat/passive";
import { cardLocked } from "../ecoArk/shared";
import { moveToDiscard } from "../deck/discard";
import { bondTier, emptyBondRound } from "./bondState";

export const HERMIT_PEEK_SOURCE = "bond-hermit";
export const HANGED_SUSPEND_SOURCE = "bond-hanged";

/** 回合开始: 清空每回合计数。返回隐者上回合末弃置的张数(本回合多抽)。 */
export function startBondRound(state: BattleState): number {
  if (!state.bond) return 0;
  state.bond.round = emptyBondRound();
  state.bond.play = { touched: [], healAll: false };
  const extra = state.bond.battle.hermitExtraDraw;
  state.bond.battle.hermitExtraDraw = 0;
  return extra;
}

/** 魔术师: 上回合剩余法力可结转的点数(6 档 1 点, 12 档 2 点)。 */
export function bondManaCarry(state: BattleState, leftover: number): number {
  const tier = state.bond ? bondTier(state, "magician") : 0;
  if (tier <= 0 || leftover <= 0) return 0;
  const carry = Math.min(leftover, tier >= 2 ? 2 : 1);
  log(state, `魔术师·万能：结转 ${carry} 点法力`);
  return carry;
}

/** 隐者 3 / 9: 回合结束时从手牌最后一张开始弃置 1 / 2 张(跳过被动卡与被锁定的牌)。 */
export function hermitRoundEnd(state: BattleState, rec?: DiscardRecorder): void {
  const tier = state.bond ? bondTier(state, "hermit") : 0;
  if (tier <= 0) return;
  const want = tier >= 3 ? 2 : 1;
  const picks: string[] = [];
  for (let i = state.hand.length - 1; i >= 0 && picks.length < want; i--) {
    const uid = state.hand[i];
    const card = state.cards[uid];
    if (!card || isPassive(card) || cardLocked(state, uid)) continue;
    picks.push(uid);
  }
  for (const uid of picks) {
    log(state, `隐者·提灯：弃置 ${state.cards[uid].name}`);
    moveToDiscard(state, uid, "bond", rec);
  }
  state.bond.battle.hermitExtraDraw += picks.length;
}

/** 隐者 6: 打开「查看抽牌堆顶 3 张，选 1 张置顶」的选择。已有待选时继续等待。 */
export function openBondChoices(state: BattleState): void {
  const round = state.bond?.round;
  if (!round?.hermitPeekPending || state.pendingChoice || state.phase !== "player") return;
  round.hermitPeekPending = false;
  const options = state.draw.slice(0, 3);
  if (options.length <= 1) return;
  state.pendingChoice = { kind: "pickFromDraw", sourceCardUid: HERMIT_PEEK_SOURCE, options, toTop: true };
}
