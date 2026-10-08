// 羁绊的自动出牌 —— 命运之轮 9(命运馈赠)与倒吊人 9(悬置牌)共用。
// 口径: 0 费、不推进时刻、不计入本回合出牌记录; 攻击指向随机敌人, 治疗 / 护盾指向生命比例最低的队友。
// 结算完的牌按正常出牌去向: 消耗牌进消耗堆, 其余进弃牌堆(不算弃牌)。

import type { AnimHit, BattleState, Card } from "../types";
import { resolveEffects, type EffectResolution } from "../effects/effects";
import { activeEffectsOf } from "../cards/cardEffects";
import { checkEnd, log } from "../core/ops";
import { shuffle } from "../core/rng";
import { withHitRecorder } from "../core/animHits";
import { currentRecorder, ensureCardFxSnapshot, recordCardTrigger, snapshotHp } from "../cards/cardFx";
import { validFoeTargetIds } from "../combat/targeting";
import { partyHandLimit } from "../combat/stats";
import { isPassive } from "../combat/passive";
import { effectiveTargeting } from "../deck/cultivate";
import { exhaustCard } from "../deck/exhaust";
import { runRelicHook } from "../relics/types";
import { aliveAllies, hpRatio, pickRandom } from "./bondState";

function autoTarget(state: BattleState, card: Card): string | undefined {
  const targeting = effectiveTargeting(card);
  if (targeting === "foe" || targeting === "any") return pickRandom(state, validFoeTargetIds(state, "player"));
  if (targeting === "ally") {
    const allies = aliveAllies(state).filter((ally) => !(card.excludeSelfTarget && ally.id === card.ownerCharId));
    return allies.sort((a, b) => hpRatio(a) - hpRatio(b))[0]?.id;
  }
  if (targeting === "self") return card.ownerCharId;
  return undefined;
}

/** 让一张已经离开手牌 / 牌堆的牌免费结算一次, 然后按出牌去向归位。 */
export function bondAutoPlay(state: BattleState, uid: string, label: string): void {
  const card = state.cards[uid];
  if (!card || state.phase !== "player") return;
  const settle = () => {
    if (card.exhaust) exhaustCard(state, uid);
    else if (!state.discard.includes(uid)) state.discard.push(uid);
  };
  if (!state.combatants[card.ownerCharId]?.alive) {
    settle();
    return;
  }
  const targeting = effectiveTargeting(card);
  const primaryId = autoTarget(state, card);
  if ((targeting === "foe" || targeting === "ally" || targeting === "any") && !primaryId) {
    settle();
    return;
  }

  log(state, `${label}：${card.name} 自动打出`);
  const recorder = currentRecorder();
  if (recorder) ensureCardFxSnapshot(state);
  const beforeHp = snapshotHp(state);
  const previous = {
    uid: state.activeCardUid,
    primary: state.activeCardPrimaryId,
    cost: state.activeCardCost,
    type: state.activeCardType,
  };
  state.activeCardUid = uid;
  state.activeCardPrimaryId = primaryId ?? null;
  state.activeCardCost = 0;
  state.activeCardType = card.cardType;
  state.bond.play = { touched: [], healAll: false };
  let resolution: EffectResolution = { missed: [], hit: [] };
  let recorded: AnimHit[] = [];
  try {
    recorded = withHitRecorder(() => {
      resolution = resolveEffects(state, activeEffectsOf(card), card.ownerCharId, primaryId);
    });
  } finally {
    state.activeCardUid = previous.uid;
    state.activeCardPrimaryId = previous.primary;
    state.activeCardCost = previous.cost;
    state.activeCardType = previous.type;
    state.bond.play = { touched: [], healAll: false };
  }
  settle();
  checkEnd(state);
  if (recorder) recordCardTrigger(state, card, beforeHp, recorder, resolution, true, recorded);
}

/** 命运馈赠: 翻开抽牌堆顶; 被动卡放入手牌(满了则进弃牌堆)再翻下一张。 */
export function autoPlayDrawTop(state: BattleState): void {
  for (let guard = 0; guard < 16; guard++) {
    if (state.draw.length === 0) {
      if (state.discard.length === 0) return;
      state.draw = shuffle(state, state.discard);
      state.discard = [];
      log(state, "🔀 弃牌堆洗回抽牌堆");
      runRelicHook(state, "onShuffle");
    }
    const uid = state.draw.shift();
    if (!uid) return;
    const card = state.cards[uid];
    if (!card) continue;
    if (isPassive(card)) {
      if (state.hand.length < partyHandLimit(state)) state.hand.push(uid);
      else state.discard.push(uid);
      continue;
    }
    bondAutoPlay(state, uid, "命运之轮·命运馈赠");
    return;
  }
}

/** 倒吊人 9: 回合开始时依次打出悬置区的牌。 */
export function playSuspendedCards(state: BattleState): void {
  if (!state.bond?.suspended.length) return;
  const queue = [...state.bond.suspended];
  state.bond.suspended = [];
  for (const uid of queue) {
    if (state.phase !== "player") return;
    bondAutoPlay(state, uid, "倒吊人·悬停");
  }
}
