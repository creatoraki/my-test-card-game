// 流转系: 愚者(多抽 + 随机降费) · 魔术师(法力结转) · 隐者(弃牌换抽、预知、主动弃牌触发)。
// 愚者 / 魔术师的数量部分走 squadMods; 法力结转与隐者回合末弃牌在 bonds/bondRound.ts。

import { log } from "../../core/ops";
import { isPassive } from "../../combat/passive";
import { cardLocked } from "../../ecoArk/shared";
import { cardCost } from "../../cards/cost";
import type { BondBehavior } from "../types";
import { pickRandom } from "../bondState";

export const FOOL_MARK_ID = "bondFool";

const fool: BondBehavior = {
  onRoundStart: (ctx) => {
    const { state } = ctx;
    if (ctx.tier < 2) return;
    const candidates = state.hand.filter((uid) => {
      const card = state.cards[uid];
      return card && !isPassive(card) && !cardLocked(state, uid) && cardCost(state, card) >= 1 &&
        !card.marks?.includes(FOOL_MARK_ID);
    });
    const uid = pickRandom(state, candidates);
    if (!uid) return;
    (state.cards[uid].marks ??= []).push(FOOL_MARK_ID);
    log(state, `愚者·启程：${state.cards[uid].name} 本回合费用 -1`);
  },
};

const hermit: BondBehavior = {
  // 6 档: 本回合第一次弃牌 → 记下待打开的「预知」, 等当前动作结算完再弹出选择(见 bondRound.openBondChoices)。
  onCardDiscarded: (ctx, _uid, reason) => {
    const round = ctx.state.bond.round;
    if (ctx.tier < 2 || reason === "bond" || round.hermitPeekUsed) return;
    round.hermitPeekUsed = true;
    if (ctx.state.draw.length > 0 || ctx.state.discard.length > 0) round.hermitPeekPending = true;
  },
};

export const FLOW_BOND_BEHAVIORS: Record<string, BondBehavior> = { fool, hermit, magician: {} };
