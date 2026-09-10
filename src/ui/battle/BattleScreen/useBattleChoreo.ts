import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import type { BattleState, Card, CardAnim } from "@/engine";
import {
  ANIM,
  CINEMA,
  DISCARD,
  type HitFx,
} from "@/ui/battle/animations";
import { attackSfxCue, impactSfxCue } from "@/ui/battle/animSfx";
import { buildHitFx, impactSfxPlan } from "@/ui/battle/hitFloats";
import {
  choreograph,
  createTimeline,
  isFoeLedShot,
  type Camera,
  type ChoreoStep,
} from "@/ui/battle/camera";
import type { TelegraphKind } from "@/ui/battle/unitShell";
import { playSfx } from "@/ui/audio";
import { showBattleToast } from "@/ui/battle/battleToastStore";
import { CAMERA_SETTLE_MS, impactAxis, shouldHardCut } from "./battleCamera";
import { DEATH } from "@/ui/battle/deathChoreo";
import type { BattleCameraApi } from "./useBattleCamera";
import type { HandRenderApi } from "./useHandRender";
import type { PlaybackApi } from "./usePlayback";

export interface BattleChoreoApi {
  startBatch: (steps: ChoreoStep[], final: BattleState, enter?: Camera | null, excludeUid?: string) => void;
  attackerId: string | null;
  telegraph: { id: string; kind: TelegraphKind } | null;
  hits: Record<string, HitFx>;
  cutInCard: Card | null;
  relicId: string | null;
}

interface Options {
  battle: BattleState | null;
  battleSeq: number;
  playback: PlaybackApi;
  camera: BattleCameraApi;
  hand: HandRenderApi;
  deaths: { setImpactOffset: (ms: number) => void };
  commit: (snapshot: BattleState) => void;
  setSelectedUid: Dispatch<SetStateAction<string | null>>;
  setHandAction: Dispatch<SetStateAction<"redraw" | "discard" | null>>;
}

export function useBattleChoreo({
  battle,
  battleSeq,
  playback,
  camera,
  hand,
  deaths,
  commit,
  setSelectedUid,
  setHandAction,
}: Options): BattleChoreoApi {
  const [attackerId, setAttackerId] = useState<string | null>(null);
  const [telegraph, setTelegraph] = useState<{ id: string; kind: TelegraphKind } | null>(null);
  const [hits, setHits] = useState<Record<string, HitFx>>({});
  const [cutInCard, setCutInCard] = useState<Card | null>(null);
  const [relicId, setRelicId] = useState<string | null>(null);
  const hitSeqRef = useRef(0);

  useEffect(() => {
    setAttackerId(null);
    setTelegraph(null);
    setHits({});
    setCutInCard(null);
    setRelicId(null);
    hitSeqRef.current = 0;
  }, [battleSeq]);

  function runSteps(steps: ChoreoStep[], final: BattleState, seq: number, enter: Camera | null, excludeUid?: string) {
    if (!battle) return;
    const plans = choreograph(steps, battle);
    const handSeen = new Set(battle.hand);
    if (excludeUid) handSeen.delete(excludeUid);
    const marksAt: string[][] = [];
    for (const [index, plan] of plans.entries()) {
      const gone = [...handSeen].filter((uid) => !plan.step.snapshot.hand.includes(uid));
      marksAt[index] = gone;
      gone.forEach((uid) => handSeen.delete(uid));
    }
    const endMarks = [...handSeen].filter((uid) => !final.hand.includes(uid));
    const finishBatch = () => {
      if (playback.seqRef.current !== seq) return;
      commit(final);
      hand.scheduleAfterDiscard(() => {
        if (playback.seqRef.current === seq) hand.clearDiscarding();
      });
      camera.rig.setTimeScale(1);
      camera.snapCameraTarget(null);
      camera.rig.setTuning(null);
      playback.setPlaybackRate(1, false);
      setAttackerId(null);
      setTelegraph(null);
      setHits({});
      setCutInCard(null);
      setRelicId(null);
      playback.setHitstop(false);
      playback.timelineRef.current = null;
      playback.unlock();
    };

    if (plans.length === 0) {
      endMarks.forEach(hand.markDiscarding);
      if (endMarks.length === 0) {
        finishBatch();
        return;
      }
      hand.scheduleAfterDiscard(finishBatch);
      return;
    }

    const timeline = createTimeline(seq, () => camera.rig.getTimeScale(), finishBatch);
    playback.timelineRef.current?.cancel();
    playback.timelineRef.current = timeline;

    let at = 0;
    let lastActor = "";
    let lastAnim: CardAnim | null = null;
    plans.forEach(({ step, preset, targetIds, focusIds, keepCamera }, index) => {
      if (step.kind === "reveal") {
        const selfMark = Boolean(step.discardUid && marksAt[index]?.includes(step.discardUid));
        const stepMarks = (marksAt[index] ?? []).filter((uid) => !selfMark || uid !== step.discardUid);
        const discardLead = selfMark ? DISCARD.total : 0;
        const cutIn = CINEMA.cardIn + CINEMA.cardHold + CINEMA.cardOut;
        timeline.add({
          at,
          run: () => {
            if (selfMark) hand.markDiscarding(step.discardUid!);
            stepMarks.forEach(hand.markDiscarding);
          },
        });
        timeline.add({ at: at + discardLead, run: () => setCutInCard(step.card ?? null) });
        timeline.add({
          at: at + discardLead + cutIn,
          run: () => {
            setCutInCard(null);
            commit(step.snapshot);
          },
        });
        at += discardLead + cutIn + 40;
        lastActor = "";
        lastAnim = null;
        return;
      }

      const repeat = lastActor === step.actorId && lastAnim === step.anim ? 1 : 0;
      const fx = ANIM[step.anim];
      const impactMs = fx.proc?.impactMs ?? 0;
      const deathHold = step.kind === "flee"
        ? DEATH.flee + 40
        : preset.kind === "kill"
          ? impactMs + DEATH.drain + DEATH.vanish + 40
          : 0;
      const holdFloor = Math.max(
        fx.hold,
        deathHold,
      );
      const hold = Math.max(preset.hold * Math.max(0.55, 0.78 ** repeat), holdFloor);
      const cutIn = step.card ? CINEMA.cardIn + CINEMA.cardHold + CINEMA.cardOut : 0;
      const telegraphKind: TelegraphKind = ANIM[step.anim].kind === "support" ? "buff" : "attack";
      const isSupportTrigger = step.kind === "tempo" || step.kind === "relic";
      const focus = () => (preset.kind === "none" ? null : camera.focusCamera(focusIds, preset));
      // 敌人攻击必须先完成聚焦再进入蓄力, 否则 telegraph 会和镜头同时启动, 命中时镜头才刚到位。
      const focusLead = isFoeLedShot(preset) ? CAMERA_SETTLE_MS : 0;
      const selfMark = Boolean(step.discardUid && marksAt[index]?.includes(step.discardUid));
      const stepMarks = (marksAt[index] ?? []).filter((uid) => !selfMark || uid !== step.discardUid);
      const markStepDiscards = () => stepMarks.forEach(hand.markDiscarding);
      const discardLead = selfMark ? DISCARD.total : 0;
      const actionAt = at + discardLead + focusLead;
      const hitAt = actionAt + preset.lead + cutIn;
      const attackCue = attackSfxCue(step.anim);
      const impactCue = impactSfxCue(step.anim);
      if (attackCue) {
        timeline.add({
          at: Math.max(actionAt, hitAt + impactMs - attackCue.leadMs),
          run: () => playSfx(attackCue.id, { pitch: attackCue.pitch, volume: attackCue.volume }),
        });
      }
      timeline.add({
        at,
        run: () => {
          if (selfMark) hand.markDiscarding(step.discardUid!);
          if (step.kind === "flee") showBattleToast("宝箱怪卷着战利品溜走了");
          if (step.kind === "relic") setRelicId(step.relicId ?? null);
          camera.rig.setTuning(preset.rig);
          if (isFoeLedShot(preset)) {
            camera.setCameraTarget(focus());
          } else {
            if (!isSupportTrigger) {
              setAttackerId(step.actorId);
              setTelegraph(
                battle.enemyIds.includes(step.actorId) && preset.kind !== "none"
                  ? { id: step.actorId, kind: telegraphKind }
                  : null,
              );
            }
            if (index === 0 && enter) camera.setCameraTarget(enter);
            else if (index === 0) camera.setCameraTarget(null);
          }
        },
      });
      if (isFoeLedShot(preset) && !isSupportTrigger) {
        timeline.add({
          at: actionAt,
          run: () => {
            setAttackerId(step.actorId);
            setTelegraph({ id: step.actorId, kind: telegraphKind });
          },
        });
      }
      timeline.add({
        at: actionAt + preset.lead,
        run: () => {
          const previous = index > 0 ? plans[index - 1] : null;
          const nextFocus = focus();
          if (isFoeLedShot(preset) || step.kind === "relic") return;
          if (!previous || index === 0) {
            camera.setCameraTarget(nextFocus);
            return;
          }
          const previousFocus = previous.preset.kind === "none"
            ? null
            : camera.focusCamera(previous.focusIds, previous.preset);
          const hardCut = previous.preset.kind === "kill"
            || shouldHardCut(battle, previous.step, step, previousFocus, nextFocus);
          if (hardCut) camera.snapCameraTarget(nextFocus);
          else if (!keepCamera) camera.setCameraTarget(nextFocus);
        },
      });
      if (step.card) {
        timeline.add({ at: actionAt + preset.lead, run: () => setCutInCard(step.card ?? null) });
        timeline.add({ at: hitAt, run: () => setCutInCard(null) });
      }
      timeline.add({
        at: hitAt,
        run: () => {
          setTelegraph(null);
          const proc = ANIM[step.anim].proc;
          deaths.setImpactOffset(0);
          if (!proc?.damageAtImpact) {
            markStepDiscards();
            commit(step.snapshot);
          }
          const hitSeq = ++hitSeqRef.current;
          setHits(buildHitFx(step.hits, step.anim, hitSeq));
          timeline.schedule(impactMs, () => {
            if (impactCue) {
              // 必须走 unscaled(墙钟)排期: 下一句就要开顿帧(timeScale=0), 走缩放时间轴的话
              // 后续几声会被冻在顿帧里, 顿帧结束才补出来。采样本身也不会随慢镜变慢。
              for (const tick of impactSfxPlan(step.hits, impactCue, step.anim)) {
                const play = () => playSfx(impactCue.id, {
                  damage: tick.damage,
                  pitch: impactCue.pitch,
                  volume: tick.volume,
                });
                if (tick.delayMs === 0) play();
                else timeline.schedule(tick.delayMs, play, true);
              }
            }
            if (proc?.damageAtImpact) {
              markStepDiscards();
              commit(step.snapshot);
            }
            playback.setHitstop(preset.hitstop > 0);
            if (preset.hitstop > 0) camera.rig.setTimeScale(0);
            const axis = impactAxis(camera.worldRef.current, battle, step, targetIds);
            camera.rig.punch(preset.punch);
            camera.rig.impact(axis, preset.shake, -axis.x * preset.roll * 0.35);
            if (preset.creep > 0) {
              timeline.schedule(Math.round(hold * 0.35), () => {
                const current = focus();
                if (current) camera.setCameraTarget({ ...current, dy: current.dy - preset.creep });
              });
            }
            if (preset.hitstop > 0) {
              timeline.schedule(preset.hitstop, () => {
                playback.setHitstop(false);
                const slow = preset.slowmo?.scale ?? 1;
                playback.setPlaybackRate(slow, false);
                if (preset.slowmo) {
                  timeline.schedule(preset.slowmo.ms, () => playback.setPlaybackRate(playback.playbackRateRef.current), true);
                } else {
                  playback.setPlaybackRate(playback.playbackRateRef.current);
                }
              }, true);
            }
          });
        },
      });
      timeline.add({ at: hitAt + hold, run: () => { setHits({}); setAttackerId(null); setTelegraph(null); if (step.kind === "relic") setRelicId(null); } });
      at = hitAt + hold + 40;
      lastActor = step.actorId;
      lastAnim = step.anim;
    });
    timeline.add({ at, run: () => endMarks.forEach(hand.markDiscarding) });
    timeline.add({ at: at + 260, run: () => camera.setCameraTarget(null) });
    timeline.add({ at: at + DISCARD.total + 40, run: () => undefined });
    timeline.start();
  }

  function startBatch(steps: ChoreoStep[], final: BattleState, enter: Camera | null = null, excludeUid?: string) {
    const seq = playback.bumpSeq();
    playback.lock();
    setSelectedUid(null);
    setHandAction(null);
    camera.setAimFoeId(null);
    runSteps(steps, final, seq, enter, excludeUid);
  }

  return { startBatch, attackerId, telegraph, hits, cutInCard, relicId };
}
