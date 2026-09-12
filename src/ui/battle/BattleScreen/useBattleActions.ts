import { useCallback, type Dispatch, type SetStateAction } from "react";
import type { BattleState } from "@/engine";
import { avidyaPickCount, effectiveTargeting, playBlockReason } from "@/engine";
import { cardAnim } from "@/ui/battle/animations";
import { useBattleStore } from "@/store/battleStore";
import { playSfx } from "@/ui/audio";
import { resetHandHover } from "@/ui/battle/handFocusStore";
import { showBattleToast } from "@/ui/battle/battleToastStore";
import type { Pile } from "@/ui/battle/PileRail";
import { stepFromFx, fxTargets } from "./choreoSteps";
import type { ChoreoStep } from "@/ui/battle/camera";
import type { BattleCameraApi } from "./useBattleCamera";
import type { BattleChoreoApi } from "./useBattleChoreo";
import type { HandRenderApi } from "./useHandRender";
import type { PlaybackApi } from "./usePlayback";
import type { HandAction } from "@/ui/battle/HandTools";

export interface AvidyaPick {
  uid: string;
  primaryId?: string;
  need: number;
  picked: string[];
}

interface Options {
  battle: BattleState | null;
  selectedUid: string | null;
  setSelectedUid: Dispatch<SetStateAction<string | null>>;
  handAction: HandAction;
  setHandAction: Dispatch<SetStateAction<HandAction>>;
  avidyaPick: AvidyaPick | null;
  setAvidyaPick: Dispatch<SetStateAction<AvidyaPick | null>>;
  setOpenPile: Dispatch<SetStateAction<Pile | null>>;
  choreo: BattleChoreoApi;
  camera: BattleCameraApi;
  hand: HandRenderApi;
  playback: PlaybackApi;
}

export interface BattleActionsApi {
  triggerEndTurn: () => void;
  triggerWait: () => void;
  runHandAction: (uid: string) => void;
  onCardClick: (uid: string) => void;
  onCombatantClick: (id: string) => void;
  pickFromDiscard: (uid: string) => void;
  pickFromDraw: (uid: string) => void;
  pickHandCard: (uid: string) => void;
  pickSquadBuff: (id: string) => void;
  cancelSquadBuff: () => void;
  closePile: () => void;
}

export function useBattleActions({
  battle,
  selectedUid,
  setSelectedUid,
  handAction,
  setHandAction,
  avidyaPick,
  setAvidyaPick,
  setOpenPile,
  choreo,
  camera,
  hand,
  playback,
}: Options): BattleActionsApi {
  const play = useBattleStore((state) => state.play);
  const redrawCard = useBattleStore((state) => state.redrawCard);
  const discardCard = useBattleStore((state) => state.discardCard);
  const pickPendingChoice = useBattleStore((state) => state.pickPendingChoice);
  const cancelPendingChoice = useBattleStore((state) => state.cancelPendingChoice);
  const end = useBattleStore((state) => state.end);
  const wait = useBattleStore((state) => state.wait);
  const commit = useBattleStore((state) => state.commit);

  const triggerPlay = useCallback((uid: string, primaryId?: string, discardPicks?: string[]) => {
    if (!battle || playback.animatingRef.current) return;
    const card = battle.cards[uid];
    if (!card) return;
    if (discardPicks == null) {
      const need = avidyaPickCount(battle, card);
      if (need > 0) {
        setAvidyaPick({ uid, primaryId, need, picked: [] });
        setSelectedUid(null);
        showBattleToast(`无明：请选择 ${need} 张要丢弃的手牌`);
        return;
      }
    }
    const plan = play(uid, primaryId, discardPicks);
    if (!plan) return;
    const anim = cardAnim(card, plan.cardKeywordTriggers);
    hand.setPlayingOutUid(uid);
    const hitIds = new Set(plan.cardHits.map((hit) => hit.id));
    const cardHits = [
      ...plan.cardHits,
      ...fxTargets(battle, uid, primaryId)
        .filter((id) => !hitIds.has(id))
        .map((id) => ({ id, hpDelta: 0, missed: plan.cardMissedTargets.includes(id) })),
    ];
    const steps: ChoreoStep[] = [
      { actorId: card.ownerCharId, anim, snapshot: plan.cardSnapshot, hits: cardHits, card },
      ...plan.steps.map((step) => stepFromFx(battle, step)),
    ];
    const enter = camera.aim ? { ...camera.aim, yaw: 0, pitch: 0 } : null;
    choreo.startBatch(steps, plan.final, enter, uid);
  }, [battle, camera.aim, choreo, hand, play, playback.animatingRef, setAvidyaPick, setHandAction, setSelectedUid]);

  const pickAvidyaCard = useCallback((uid: string) => {
    if (!battle || !avidyaPick || uid === avidyaPick.uid || !battle.hand.includes(uid)) return;
    const picked = avidyaPick.picked.includes(uid)
      ? avidyaPick.picked.filter((pickedUid) => pickedUid !== uid)
      : [...avidyaPick.picked, uid];
    if (picked.length < avidyaPick.need) {
      setAvidyaPick((current) => current ? { ...current, picked } : current);
      showBattleToast(`无明：已选择 ${picked.length} / ${avidyaPick.need} 张`);
      return;
    }
    const next = { ...avidyaPick, picked };
    setAvidyaPick(null);
    setHandAction(null);
    resetHandHover();
    triggerPlay(next.uid, next.primaryId, next.picked);
  }, [avidyaPick, battle, setAvidyaPick, setHandAction, triggerPlay]);

  const triggerEndTurn = useCallback(() => {
    if (!battle || playback.animatingRef.current) return;
    const plan = end();
    if (!plan) return;
    choreo.startBatch(plan.steps.map((step) => stepFromFx(battle, step)), plan.final);
  }, [battle, choreo, end, playback.animatingRef]);

  const triggerWait = useCallback(() => {
    if (!battle || playback.animatingRef.current) return;
    const plan = wait();
    if (!plan) return;
    choreo.startBatch(plan.steps.map((step) => stepFromFx(battle, step)), plan.final);
  }, [battle, choreo, playback.animatingRef, wait]);

  const runHandAction = useCallback((uid: string) => {
    if (!battle) return;
    if (avidyaPick) {
      pickAvidyaCard(uid);
      return;
    }
    if (battle.pendingChoice?.kind === "pickHandCard") {
      const next = pickPendingChoice(uid);
      if (next) {
        commit(next);
        setHandAction(null);
        resetHandHover();
      }
      return;
    }
    if (!handAction) return;
    if (handAction === "redraw") {
      const next = redrawCard(uid);
      if (next) {
        commit(next);
        setHandAction(null);
        resetHandHover();
      }
      return;
    }
    const plan = discardCard(uid);
    if (!plan) return;
    if (plan.steps.length > 0) {
      choreo.startBatch(plan.steps.map((step) => stepFromFx(battle, step)), plan.final);
    } else {
      hand.markDiscarding(uid);
      choreo.startBatch([], plan.final);
    }
    setHandAction(null);
    resetHandHover();
  }, [avidyaPick, battle, choreo, commit, discardCard, hand, handAction, pickAvidyaCard, pickPendingChoice, setHandAction, redrawCard]);

  const onCardClick = useCallback((uid: string) => {
    if (!battle || battle.phase !== "player" || playback.animating) return;
    if (avidyaPick) {
      pickAvidyaCard(uid);
      return;
    }
    if (battle.pendingChoice?.kind === "pickHandCard") {
      const next = pickPendingChoice(uid);
      if (next) {
        commit(next);
        setHandAction(null);
        resetHandHover();
      }
      return;
    }
    if (handAction) return;
    const block = playBlockReason(battle, uid);
    if (block) {
      if (block === "mana") showBattleToast("费用不足");
      else if (battle.cards[uid]?.cardType === "passive") showBattleToast("被动卡无法打出");
      return;
    }
    const card = battle.cards[uid];
    const targeting = effectiveTargeting(card);
    if (targeting === "foe" || targeting === "ally") {
      const selecting = selectedUid !== uid;
      setSelectedUid(selecting ? uid : null);
      if (selecting) playSfx("cardSelect");
    } else {
      triggerPlay(uid);
    }
  }, [avidyaPick, battle, commit, handAction, pickAvidyaCard, pickPendingChoice, playback.animating, selectedUid, setHandAction, setSelectedUid, triggerPlay]);

  const onCombatantClick = useCallback((id: string) => {
    if (!battle || !selectedUid || playback.animating) return;
    const selectedCard = battle.cards[selectedUid];
    const target = battle.combatants[id];
    if (!selectedCard || !target?.alive) return;
    const targeting = effectiveTargeting(selectedCard);
    if (targeting === "foe" && target.team === "enemy") triggerPlay(selectedUid, id);
    else if (targeting === "ally" && target.team === "player") triggerPlay(selectedUid, id);
  }, [battle, playback.animating, selectedUid, triggerPlay]);

  const pickFromDiscard = useCallback((uid: string) => {
    if (!battle || battle.pendingChoice?.kind !== "recoverFromDiscard") return;
    const next = pickPendingChoice(uid);
    if (!next) return;
    commit(next);
    if (!next.pendingChoice) setOpenPile(null);
  }, [battle, commit, pickPendingChoice, setOpenPile]);

  const pickFromDraw = useCallback((uid: string) => {
    if (!battle || battle.pendingChoice?.kind !== "pickFromDraw") return;
    const next = pickPendingChoice(uid);
    if (!next) return;
    commit(next);
    setOpenPile(null);
  }, [battle, commit, pickPendingChoice, setOpenPile]);

  const pickHandCard = useCallback((uid: string) => {
    if (!battle || battle.pendingChoice?.kind !== "pickHandCard") return;
    const next = pickPendingChoice(uid);
    if (!next) return;
    commit(next);
    setHandAction(null);
    resetHandHover();
  }, [battle, commit, pickPendingChoice, setHandAction]);

  const pickSquadBuff = useCallback((id: string) => {
    if (!battle || battle.pendingChoice?.kind !== "pickSquadBuff") return;
    const next = pickPendingChoice(id);
    if (next) commit(next);
  }, [battle, commit, pickPendingChoice]);

  const cancelSquadBuff = useCallback(() => {
    if (!battle || battle.pendingChoice?.kind !== "pickSquadBuff") return;
    const next = cancelPendingChoice();
    if (next) commit(next);
  }, [battle, cancelPendingChoice, commit]);

  const closePile = useCallback(() => {
    if (battle?.pendingChoice?.kind === "recoverFromDiscard" || battle?.pendingChoice?.kind === "pickFromDraw") {
      const next = cancelPendingChoice();
      if (next) commit(next);
    }
    setOpenPile(null);
  }, [battle, cancelPendingChoice, commit, setOpenPile]);

  return {
    triggerEndTurn,
    triggerWait,
    runHandAction,
    onCardClick,
    onCombatantClick,
    pickFromDiscard,
    pickFromDraw,
    pickHandCard,
    pickSquadBuff,
    cancelSquadBuff,
    closePile,
  };
}
