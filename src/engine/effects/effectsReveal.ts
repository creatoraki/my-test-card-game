import type { BattleState, Card, EffectDescriptor } from "../types";
import { cardCost } from "../cards/cost";
import { counterOf } from "../combat/counters";
import { hasDamageEffect } from "@/data/cardModules/types";
import { checkEnd } from "../core/ops";
import { rngPick } from "../core/rng";
import { foesOf } from "../combat/targeting";
import { addMod, partyHandLimit } from "../combat/stats";
import { withHitRecorder } from "../core/animHits";
import { currentRecorder, ensureCardFxSnapshot, recordCardTrigger, snapshotHp } from "../cards/cardFx";
import type { EffectResolution, ResolveEffectsFn } from "./effects";
import { baseEffectsOf } from "../cards/cardEffects";
import { resolveFullDraw } from "../deck/fullDraw";

function emptyResolution(): EffectResolution {
  return { missed: [], hit: [] };
}

function randomFoeId(state: BattleState, card: Card): string | undefined {
  const owner = state.combatants[card.ownerCharId];
  const foes = owner ? foesOf(state, owner) : [];
  return foes.length ? rngPick(state, foes).id : undefined;
}

function autoPlayRevealedCard(state: BattleState, card: Card, resolve: ResolveEffectsFn): void {
  const recorder = currentRecorder();
  if (recorder) ensureCardFxSnapshot(state);
  const beforeHp = snapshotHp(state);
  const primaryId = randomFoeId(state, card);
  const previous = {
    activeCardCost: state.activeCardCost,
    activeCardType: state.activeCardType,
    activeCardStarSpent: state.activeCardStarSpent,
    activeCardUid: state.activeCardUid,
    autoPlaySuppress: state.autoPlaySuppress,
    activeCardStacks: state.activeCardStacks,
    activeCardResonance: state.activeCardResonance,
    waterfallPlay: state.waterfallPlay,
    playValueBonusPct: state.playValueBonusPct,
    fullDraw: state.fullDraw,
    activeCardPrimaryId: state.activeCardPrimaryId,
    playStatModsLength: state.playStatMods.length,
  };
  state.activeCardCost = cardCost(state, card);
  state.activeCardStarSpent = 0;
  state.activeCardType = card.cardType;
  state.activeCardUid = card.uid;
  state.activeCardStacks = card.discardStacks ?? 0;
  state.activeCardResonance = card.resonanceStacks ?? 0;
  state.waterfallPlay = false;
  state.playValueBonusPct = 0;
  state.activeCardPrimaryId = primaryId ?? null;
  resolveFullDraw(state, card, primaryId);
  state.autoPlaySuppress = true;
  let resolution: EffectResolution = emptyResolution();
  let recorded = [] as ReturnType<typeof withHitRecorder>;
  try {
    recorded = withHitRecorder(() => {
      resolution = resolve(state, baseEffectsOf(card), card.ownerCharId, primaryId);
    });
  } finally {
    for (const mod of state.playStatMods.slice(previous.playStatModsLength).reverse()) {
      const target = state.combatants[mod.targetId];
      if (target) addMod(target, mod.stat, -mod.amount, mod.pct);
    }
    state.playStatMods.length = previous.playStatModsLength;
    state.activeCardCost = previous.activeCardCost;
    state.activeCardType = previous.activeCardType;
    state.activeCardStarSpent = previous.activeCardStarSpent;
    state.activeCardUid = previous.activeCardUid;
    state.autoPlaySuppress = previous.autoPlaySuppress;
    state.activeCardStacks = previous.activeCardStacks;
    state.activeCardResonance = previous.activeCardResonance;
    state.waterfallPlay = previous.waterfallPlay;
    state.playValueBonusPct = previous.playValueBonusPct;
    state.fullDraw = previous.fullDraw;
    state.activeCardPrimaryId = previous.activeCardPrimaryId;
  }
  checkEnd(state);
  moveToDiscard(state, card.uid);
  if (recorder) recordCardTrigger(state, card, beforeHp, recorder, resolution, true, recorded);
}

function moveToDiscard(state: BattleState, uid: string): void {
  state.draw = state.draw.filter((drawUid) => drawUid !== uid);
  if (!state.discard.includes(uid)) state.discard.push(uid);
}

function revealCostChain(state: BattleState, effect: EffectDescriptor, resolve: ResolveEffectsFn): void {
  const amount = effect.amountFrom ? counterOf(state, effect.amountFrom) : effect.amount ?? 0;
  const limit = Math.min(Math.max(0, Math.floor(amount)), effect.maxAmount ?? Infinity);
  let previousCost = state.activeCardCost ?? 0;
  for (let i = 0; i < limit && state.draw.length > 0 && state.phase === "player"; i++) {
    const uid = state.draw[0];
    const card = state.cards[uid];
    if (!card) {
      state.draw.shift();
      continue;
    }
    const cost = cardCost(state, card);
    state.draw.shift();
    if (cost < previousCost) {
      autoPlayRevealedCard(state, card, resolve);
      previousCost = cost;
    } else {
      moveToDiscard(state, uid);
      break;
    }
  }
}

function revealAttackOrDraw(
  state: BattleState,
  effect: EffectDescriptor,
  resolve: ResolveEffectsFn,
): void {
  const uid = state.draw[0];
  const card = uid ? state.cards[uid] : undefined;
  if (!uid || !card) return;
  if (!hasDamageEffect(card)) {
    if (state.hand.length >= partyHandLimit(state)) return;
    state.draw.shift();
    state.hand.push(uid);
    if (effect.mark) {
      card.marks ??= [];
      if (!card.marks.includes(effect.mark)) card.marks.push(effect.mark);
    }
    return;
  }
  state.draw.shift();
  autoPlayRevealedCard(state, card, resolve);
}

function revealScryPick(state: BattleState, effect: EffectDescriptor): void {
  if (state.pendingChoice) return;
  const amount = Math.max(0, Math.floor(effect.amount ?? 0));
  const options = state.draw.slice(0, amount);
  if (options.length === 0) return;
  state.pendingChoice = {
    kind: "pickFromDraw",
    sourceCardUid: state.activeCardUid ?? "",
    options,
    mark: effect.mark,
  };
}

// ⚠ resolve 由 effects.ts 注入(就是 resolveEffects 本身): 本文件若直接 import 它, 会与 effects.ts 形成运行时环。
export function applyRevealEffect(
  state: BattleState,
  effect: EffectDescriptor,
  sourceId: string,
  resolve: ResolveEffectsFn,
): EffectResolution {
  if (effect.revealMode === "costChain") revealCostChain(state, effect, resolve);
  else if (effect.revealMode === "attackOrDraw") revealAttackOrDraw(state, effect, resolve);
  else if (effect.revealMode === "scryPick") revealScryPick(state, effect);
  return emptyResolution();
}
