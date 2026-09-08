import { useCallback, type Dispatch, type SetStateAction } from "react";
import type { BattleState } from "@/engine";
import { playBlockReason } from "@/engine";
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

interface Options {
  battle: BattleState | null;
  selectedUid: string | null;
  setSelectedUid: Dispatch<SetStateAction<string | null>>;
  handAction: "redraw" | "discard" | null;
  setHandAction: Dispatch<SetStateAction<"redraw" | "discard" | null>>;
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

  const triggerPlay = useCallback((uid: string, primaryId?: string) => {
    if (!battle || playback.animatingRef.current) return;
    const card = battle.cards[uid];
    if (!card) return;
    const anim = cardAnim(card);
    const plan = play(uid, primaryId);
    if (!plan) return;
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
  }, [battle, camera.aim, choreo, hand, play, playback.animatingRef]);

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
    if (!battle || !handAction) return;
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
  }, [battle, choreo, commit, discardCard, hand, handAction, redrawCard, setHandAction]);

  const onCardClick = useCallback((uid: string) => {
    if (!battle || battle.phase !== "player" || playback.animating || handAction) return;
    const block = playBlockReason(battle, uid);
    if (block) {
      if (block === "mana") showBattleToast("费用不足");
      else if (battle.cards[uid]?.cardType === "passive") showBattleToast("被动卡无法打出");
      return;
    }
    const card = battle.cards[uid];
    if (card.targeting === "foe" || card.targeting === "ally") {
      const selecting = selectedUid !== uid;
      setSelectedUid(selecting ? uid : null);
      if (selecting) playSfx("cardSelect");
    } else {
      triggerPlay(uid);
    }
  }, [battle, handAction, playback.animating, selectedUid, setSelectedUid, triggerPlay]);

  const onCombatantClick = useCallback((id: string) => {
    if (!battle || !selectedUid || playback.animating) return;
    const selectedCard = battle.cards[selectedUid];
    const target = battle.combatants[id];
    if (!selectedCard || !target?.alive) return;
    if (selectedCard.targeting === "foe" && target.team === "enemy") triggerPlay(selectedUid, id);
    else if (selectedCard.targeting === "ally" && target.team === "player") triggerPlay(selectedUid, id);
  }, [battle, playback.animating, selectedUid, triggerPlay]);

  const pickFromDiscard = useCallback((uid: string) => {
    if (!battle || battle.pendingChoice?.kind !== "recoverFromDiscard") return;
    const next = pickPendingChoice(uid);
    if (!next) return;
    commit(next);
    if (!next.pendingChoice) setOpenPile(null);
  }, [battle, commit, pickPendingChoice, setOpenPile]);

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
    if (battle?.pendingChoice?.kind === "recoverFromDiscard") {
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
    pickSquadBuff,
    cancelSquadBuff,
    closePile,
  };
}
