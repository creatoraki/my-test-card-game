import type { BattleState, Card, EffectDescriptor } from "./types";
import { cardCost } from "./cost";
import { counterOf } from "./counters";
import { hasDamageEffect } from "../data/cardModules/types";
import { ops, checkEnd } from "./ops";
import { rngPick } from "./rng";
import { foesOf } from "./targeting";
import { addMod, partyHandLimit } from "./stats";
import { withHitRecorder } from "./animHits";
import { currentRecorder, ensureCardFxSnapshot, recordCardTrigger, snapshotHp } from "./cardFx";
import { resolveEffects, type EffectResolution } from "./effects";

function emptyResolution(): EffectResolution {
  return { missed: [], hit: [] };
}

function randomFoeId(state: BattleState, card: Card): string | undefined {
  const owner = state.combatants[card.ownerCharId];
  const foes = owner ? foesOf(state, owner) : [];
  return foes.length ? rngPick(state, foes).id : undefined;
}

function autoPlayRevealedCard(state: BattleState, card: Card): void {
  const recorder = currentRecorder();
  if (recorder) ensureCardFxSnapshot(state);
  const beforeHp = snapshotHp(state);
  const primaryId = randomFoeId(state, card);
  const previous = {
    activeCardCost: state.activeCardCost,
    activeCardStarSpent: state.activeCardStarSpent,
    activeCardUid: state.activeCardUid,
    autoPlaySuppress: state.autoPlaySuppress,
    activeCardStacks: state.activeCardStacks,
    activeCardResonance: state.activeCardResonance,
    waterfallPlay: state.waterfallPlay,
    playValueBonusPct: state.playValueBonusPct,
    lastAimConsumed: state.lastAimConsumed,
    playStatModsLength: state.playStatMods.length,
  };
  state.activeCardCost = cardCost(state, card);
  state.activeCardStarSpent = 0;
  state.activeCardUid = card.uid;
  state.activeCardStacks = card.discardStacks ?? 0;
  state.activeCardResonance = card.resonanceStacks ?? 0;
  state.waterfallPlay = false;
  state.playValueBonusPct = 0;
  state.lastAimConsumed = 0;
  state.autoPlaySuppress = true;
  let resolution: EffectResolution = emptyResolution();
  let recorded = [] as ReturnType<typeof withHitRecorder>;
  try {
    recorded = withHitRecorder(() => {
      resolution = resolveEffects(state, card.effects, card.ownerCharId, primaryId);
    });
  } finally {
    for (const mod of state.playStatMods.slice(previous.playStatModsLength).reverse()) {
      const target = state.combatants[mod.targetId];
      if (target) addMod(target, mod.stat, -mod.amount, mod.pct);
    }
    state.playStatMods.length = previous.playStatModsLength;
    state.activeCardCost = previous.activeCardCost;
    state.activeCardStarSpent = previous.activeCardStarSpent;
    state.activeCardUid = previous.activeCardUid;
    state.autoPlaySuppress = previous.autoPlaySuppress;
    state.activeCardStacks = previous.activeCardStacks;
    state.activeCardResonance = previous.activeCardResonance;
    state.waterfallPlay = previous.waterfallPlay;
    state.playValueBonusPct = previous.playValueBonusPct;
    state.lastAimConsumed = previous.lastAimConsumed;
  }
  checkEnd(state);
  moveToDiscard(state, card.uid);
  if (recorder) recordCardTrigger(state, card, beforeHp, recorder, resolution, true, recorded);
}

function moveToDiscard(state: BattleState, uid: string): void {
  state.draw = state.draw.filter((drawUid) => drawUid !== uid);
  if (!state.discard.includes(uid)) state.discard.push(uid);
}

function revealCostChain(state: BattleState, effect: EffectDescriptor): void {
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
      autoPlayRevealedCard(state, card);
      previousCost = cost;
    } else {
      moveToDiscard(state, uid);
      break;
    }
  }
}

function revealAttackOrDraw(state: BattleState, effect: EffectDescriptor, sourceId: string): void {
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
  ops.applyStatus(state, sourceId, "zenithStar", 1);
  autoPlayRevealedCard(state, card);
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

export function applyRevealEffect(
  state: BattleState,
  effect: EffectDescriptor,
  _sourceId: string,
): EffectResolution {
  if (effect.revealMode === "costChain") revealCostChain(state, effect);
  else if (effect.revealMode === "attackOrDraw") revealAttackOrDraw(state, effect, _sourceId);
  else if (effect.revealMode === "scryPick") revealScryPick(state, effect);
  return emptyResolution();
}
