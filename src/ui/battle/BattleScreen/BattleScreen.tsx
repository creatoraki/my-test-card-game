import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  cardCost,
  cardDamagePreview,
  cardHitChance,
  type Enemy,
} from "@/engine";
import { getEncounter, slotPlacement } from "@/data";
import { useBattleStore } from "@/store/battleStore";
import { useRunStore } from "@/store/runStore";
import { BattleToast } from "@/ui/battle/BattleToast";
import { showBattleToast } from "@/ui/battle/battleToastStore";
import { BattleActions } from "@/ui/battle/BattleActions";
import { BattleSettingsPanel } from "@/ui/battle/BattleSettingsPanel";
import { BondRail } from "@/ui/battle/BondRail";
import { ChallengeRail } from "@/ui/battle/ChallengeRail";
import { RelicRail } from "@/ui/battle/RelicRail";
import { TurnTicker } from "@/ui/battle/TurnTicker";
import { CardInfoPanel } from "@/ui/battle/CardInfoPanel";
import { VictoryPanel } from "@/ui/battle/VictoryPanel";
import { PileRail, type Pile } from "@/ui/battle/PileRail";
import { PileDrawer } from "@/ui/battle/PileDrawer";
import { SquadBuffPicker } from "@/ui/battle/SquadBuffPicker";
import { SkillCutInCard } from "@/ui/battle/SkillCutInCard";
import { resetHandHover } from "@/ui/battle/handFocusStore";
import { playSfx } from "@/ui/audio";
import { useIdleTwitch } from "@/ui/hooks/useIdleTwitch";
import { useStageScale } from "@/ui/hooks/stage";
import { DEATH, useDeathGate } from "@/ui/battle/deathChoreo";
import { CINEMA } from "@/ui/battle/animations";
import { battleBg, warmBattleBg } from "@/ui/art/battleBg";
import { warmEnemyArt } from "@/ui/art/enemyArt";
import { DEPTH_VARS } from "./battleCamera";
import { useBattleActions, type AvidyaPick } from "./useBattleActions";
import { useBattleCamera, useBattleRig } from "./useBattleCamera";
import { useBattleChoreo } from "./useBattleChoreo";
import { useFallenNotice } from "./useFallenNotice";
import { useHandRender } from "./useHandRender";
import { usePlayback } from "./usePlayback";
import { BattleStageLayer } from "./parts/BattleStageLayer";
import { BattleHudDock } from "./parts/BattleHudDock";
import { ScreenFxLayer } from "./parts/ScreenFxLayer";
import { AmbienceGrade } from "@/ui/battle/AmbienceLayer";
import s from "./BattleScreen.module.css";

export function BattleScreen() {
  const battle = useBattleStore((state) => state.battle);
  const battleMeta = useBattleStore((state) => state.meta);
  const battleSeq = useBattleStore((state) => state.seq);
  const commit = useBattleStore((state) => state.commit);
  const resolveBattle = useRunStore((state) => state.resolveBattle);
  const restartBattle = useRunStore((state) => state.restartBattle);
  const retreatFromBattle = useRunStore((state) => state.retreatFromBattle);
  const battleSettled = useRunStore((state) => state.battleSettled);
  const mapId = useRunStore((state) => state.mapId);
  const bg = battleBg(mapId);

  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [handAction, setHandAction] = useState<"redraw" | "discard" | null>(null);
  const [avidyaPick, setAvidyaPick] = useState<AvidyaPick | null>(null);
  const [openPile, setOpenPile] = useState<Pile | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);
  const defeatSoundPlayedRef = useRef(false);
  const { scale: stageScale, padX, padY } = useStageScale(viewportRef);

  const viewportStyle = useMemo(
    () => ({
      "--stage-scale": stageScale,
      "--stage-pad-x": `${padX}px`,
      "--stage-pad-y": `${padY}px`,
      "--perspective": `${CINEMA.perspective}px`,
    }) as CSSProperties,
    [padX, padY, stageScale],
  );

  const rig = useBattleRig();
  const playback = usePlayback(rig.rig, battleSeq);
  const camera = useBattleCamera({
    ...rig,
    battle,
    battleSeq,
    selectedUid,
    animating: playback.animating,
    stageScale,
  });
  const hand = useHandRender({ battle, battleSeq });
  const deaths = useDeathGate(battle, { seq: battleSeq, rateRef: playback.playbackRateRef });
  useFallenNotice({ battle, battleSeq, phaseOf: deaths.phaseOf });
  const choreo = useBattleChoreo({
    battle,
    battleSeq,
    playback,
    camera,
    hand,
    deaths,
    commit,
    setSelectedUid,
    setHandAction,
  });
  const actions = useBattleActions({
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
  });

  const worldStyle = useMemo(
    () => ({
      "--fx-rate": playback.fxRate,
      "--death-rate": playback.playbackRateRef.current,
      ...DEPTH_VARS,
    }) as CSSProperties,
    [playback.fxRate, playback.speed2x],
  );

  const aliveEnemyIds = useMemo(
    () => (battle ? battle.enemyIds.filter((id) => battle.combatants[id].alive) : []),
    [battle],
  );
  const twitchId = useIdleTwitch(aliveEnemyIds, !playback.animating);

  useEffect(() => {
    setSelectedUid(null);
    resetHandHover();
    setHandAction(null);
    setAvidyaPick(null);
    setOpenPile(null);
    setSettingsOpen(false);
  }, [battleSeq]);

  useEffect(() => {
    warmEnemyArt();
    warmBattleBg();
  }, []);

  useEffect(() => {
    if (!battle || battle.phase !== "won" || battleSettled || deaths.pending) return;
    resolveBattle();
  }, [battle, battleSettled, deaths.pending, resolveBattle]);

  useEffect(() => {
    if (!battle || battle.phase !== "lost") {
      defeatSoundPlayedRef.current = false;
      return;
    }
    if (!deaths.pending && !defeatSoundPlayedRef.current) {
      defeatSoundPlayedRef.current = true;
      playSfx("defeat");
    }
  }, [battle, deaths.pending]);

  useEffect(() => {
    if (battle?.pendingChoice?.kind === "recoverFromDiscard") setOpenPile("discard");
  }, [battle?.pendingChoice]);

  useEffect(() => {
    if (battle?.pendingChoice?.kind === "pickHandCard") showBattleToast("请选择一张手牌");
  }, [battle?.pendingChoice]);

  useEffect(() => {
    if (!avidyaPick) return;
    const cancel = () => {
      setAvidyaPick(null);
      setHandAction(null);
      resetHandHover();
      showBattleToast("已取消出牌");
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") cancel();
    };
    const onContextMenu = (event: MouseEvent) => {
      event.preventDefault();
      cancel();
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("contextmenu", onContextMenu);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("contextmenu", onContextMenu);
    };
  }, [avidyaPick]);

  if (!battle) return <div className={s.loading}>加载中…</div>;

  const isPlayerTurn = battle.phase === "player";
  const selectedCard = selectedUid ? battle.cards[selectedUid] ?? null : null;
  const needsFoe = selectedCard?.targeting === "foe";
  const needsAlly = selectedCard?.targeting === "ally";
  const enemies = battle.enemyIds.map((id) => battle.combatants[id] as Enemy);
  const allies = battle.playerIds.map((id) => battle.combatants[id]);
  const hitPreview = needsFoe && selectedCard
    ? Object.fromEntries(battle.enemyIds.map((id) => [id, cardHitChance(battle, selectedCard, id)]))
    : null;
  const damagePreview = needsFoe && selectedCard
    ? Object.fromEntries(battle.enemyIds.map((id) => [id, cardDamagePreview(battle, selectedCard, id)]))
    : null;
  const placements = getEncounter(battle.encounterId).enemies.map(slotPlacement);
  const playerActing = !!choreo.attackerId && battle.playerIds.includes(choreo.attackerId);
  const handDisplayAction = avidyaPick || battle.pendingChoice?.kind === "pickHandCard" ? "choose" : handAction;

  return (
    <div className={s["battle-viewport"]} ref={viewportRef} style={viewportStyle}>
      <div
        className={s.battle}
        data-hitstop={playback.hitstop ? "" : undefined}
        data-stage-canvas=""
        onClick={() => setSelectedUid(null)}
      >
        <img className={s["battle-bg-spill"]} src={bg} alt="" aria-hidden="true" />

        {/* 场景由 rig 直接写入 transform；aim 只作为瞄准态与出牌分镜的交接目标。 */}
        <BattleStageLayer
          sceneRef={camera.sceneRef}
          worldRef={camera.worldRef}
          stageRef={camera.stageRef}
          dofTargetsRef={camera.dofTargetsRef}
          worldStyle={worldStyle}
          bg={bg}
          mapId={mapId}
          hitstop={playback.hitstop}
          fxRate={playback.fxRate}
          enemies={enemies}
          placements={placements}
          battle={battle}
          isPlayerTurn={isPlayerTurn}
          needsFoe={needsFoe}
          hitPreview={hitPreview}
          damagePreview={damagePreview}
          attackerId={choreo.attackerId}
          telegraph={choreo.telegraph}
          hits={choreo.hits}
          phaseOf={deaths.phaseOf}
          twitchId={twitchId}
          onCombatantClick={actions.onCombatantClick}
          onAimHover={camera.setAimFoeId}
        />

        <AmbienceGrade mapId={mapId} />
        <ScreenFxLayer hits={choreo.hits} playerIds={battle.playerIds} />

        {battle && <ChallengeRail challenges={battle.challenges} />}
        <TurnTicker round={battle.round} tick={battle.tick} />
        <div className={s.topRight}>
          <RelicRail battle={battle} activeRelicId={choreo.relicId} />
          {battleMeta && <BondRail bonds={battleMeta.bonds} />}
          <BattleActions
            canEndTurn={isPlayerTurn && !playback.animating && !battle.pendingChoice}
            onEndTurn={actions.triggerEndTurn}
            speed2x={playback.speed2x}
            onToggleSpeed={playback.togglePlaybackSpeed}
            onOpenSettings={() => setSettingsOpen(true)}
          />
        </div>

        <BattleHudDock
          battle={battle}
          handAction={handAction}
          handDisplayAction={handDisplayAction}
          setHandAction={setHandAction}
          setSelectedUid={setSelectedUid}
          isPlayerTurn={isPlayerTurn}
          animating={playback.animating}
          onWait={actions.triggerWait}
          playerActing={playerActing}
          allies={allies}
          hits={choreo.hits}
          attackerId={choreo.attackerId}
          selectedCard={selectedCard}
          needsAlly={needsAlly}
          deathPhaseOf={deaths.phaseOf}
          deathRate={playback.playbackRateRef.current}
          deathVanishMs={DEATH.vanish}
          renderHand={hand.renderHand}
          discardingUids={hand.discardingUidSet}
          selectedUid={selectedUid}
          playingOutUid={hand.playingOutUid}
          onCardClick={actions.onCardClick}
          onCombatantClick={actions.onCombatantClick}
          onCardAction={actions.runHandAction}
          onCardExited={hand.onCardExited}
        />

        <PileRail battle={battle} onOpenPile={(pile) => !battle.pendingChoice && setOpenPile(pile)} />
        <PileDrawer
          battle={battle}
          pile={openPile}
          choiceMode={battle.pendingChoice?.kind === "recoverFromDiscard"}
          onPick={actions.pickFromDiscard}
          onClose={actions.closePile}
        />
        <SquadBuffPicker
          battle={battle}
          onPick={actions.pickSquadBuff}
          onCancel={actions.cancelSquadBuff}
        />

        <BattleSettingsPanel
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          battle={battle}
          battleSettled={battleSettled}
          onRetreat={retreatFromBattle}
          onRestart={restartBattle}
        />
        <CardInfoPanel
          battle={battle}
          fallbackCard={selectedCard}
          fallbackCost={selectedCard ? cardCost(battle, selectedCard) : undefined}
        />
        <BattleToast />

        {battle.phase === "lost" && !deaths.pending && (
          <div className={s.overlay}>
            <div className={s["overlay-card"]}>
              <h2>💀 战斗失败</h2>
              <button className="primary" onClick={() => resolveBattle()}>继续</button>
            </div>
          </div>
        )}

        <VictoryPanel />
        <SkillCutInCard card={choreo.cutInCard} fxRate={playback.fxRate} />
      </div>
    </div>
  );
}
