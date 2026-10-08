// 时序系: 命运之轮(推进时刻的里程碑) · 星星(速攻) · 倒吊人(待机)。
// 星星 9 的回手在 bonds/bondPlay.ts; 倒吊人 3 的待机次数走 squadMods; 悬置区的出牌在 bonds/bondAutoPlay.ts。

import { RULES } from "../../core/battleRules";
import { log, ops } from "../../core/ops";
import { ticksThisRound } from "../../hexer/hexGate";
import { isPassive } from "../../combat/passive";
import { cardLocked } from "../../ecoArk/shared";
import type { BondBehavior } from "../types";
import { pickRandom } from "../bondState";
import { autoPlayDrawTop } from "../bondAutoPlay";

export const STAR_MARK_ID = "bondStar";

const wheel: BondBehavior = {
  onTickAdvanced: (ctx) => {
    const { state } = ctx;
    const round = state.bond.round;
    const ticks = ticksThisRound(state);
    if (ticks >= 3 && !round.wheelDraw) {
      round.wheelDraw = true;
      log(state, "命运之轮·轮转：推进满 3 时刻，抽 1 张牌");
      ops.draw(state, 1);
    }
    if (ctx.tier >= 2 && ticks >= 5 && !round.wheelMana) {
      round.wheelMana = true;
      state.resources[RULES.resource.name] = (state.resources[RULES.resource.name] ?? 0) + 1;
      log(state, "命运之轮·轮转：推进满 5 时刻，获得 1 点法力");
    }
    if (ctx.tier >= 3 && ticks >= 6 && !round.wheelGift) {
      round.wheelGift = true;
      log(state, "命运之轮·轮转：命运馈赠");
      autoPlayDrawTop(state);
    }
  },
};

const star: BondBehavior = {
  onRoundStart: (ctx) => {
    const { state } = ctx;
    const candidates = state.hand.filter((uid) => {
      const card = state.cards[uid];
      return card && !isPassive(card) && card.cardType === "normal" && card.cost === 1 &&
        !cardLocked(state, uid) && !card.marks?.includes(STAR_MARK_ID);
    });
    const uid = pickRandom(state, candidates);
    if (!uid) return;
    (state.cards[uid].marks ??= []).push(STAR_MARK_ID);
    log(state, `星星·指引：${state.cards[uid].name} 本回合视为速攻`);
  },
  onCardPlayRecorded: (ctx, played) => {
    if (ctx.tier < 2 || played.cardType !== "fast") return;
    const fastPlays = ctx.state.playedThisRound.filter((entry) => entry.cardType === "fast").length;
    if (fastPlays !== 2) return;
    log(ctx.state, "星星·指引：第 2 张速攻牌，抽 1 张牌");
    ops.draw(ctx.state, 1);
  },
};

const hanged: BondBehavior = {
  onWait: (ctx) => {
    const { state } = ctx;
    if (ctx.tier >= 2 && state.waitsThisRound === 1) {
      log(state, "倒吊人·悬停：待机抽 1 张牌");
      ops.draw(state, 1);
    }
    if (ctx.tier >= 3 && !state.bond.round.hangedSuspendUsed && !state.pendingChoice) {
      const hasCandidate = state.hand.some((uid) => suspendable(state, uid));
      if (!hasCandidate) return;
      state.pendingChoice = {
        kind: "pickHandCard",
        sourceCardUid: "bond-hanged",
        ownerCharId: state.playerIds.find((id) => state.combatants[id]?.alive) ?? "",
        action: "bondSuspend",
        remaining: 1,
      };
    }
  },
};

/** 可悬置: 手牌中非被动、未被锁定、所属角色存活的牌。 */
export function suspendable(state: import("../../types").BattleState, uid: string): boolean {
  const card = state.cards[uid];
  return Boolean(card && state.hand.includes(uid) && !isPassive(card) && !cardLocked(state, uid) &&
    state.combatants[card.ownerCharId]?.alive);
}

export const CHRONO_BOND_BEHAVIORS: Record<string, BondBehavior> = { wheel, star, hanged };
