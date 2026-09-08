import { useCallback, useEffect, useLayoutEffect, useRef, useState, type MutableRefObject, type RefObject } from "react";
import type { BattleState } from "@/engine";
import { sameCamera, useCameraRig, type Camera, type CameraRigApi } from "@/ui/battle/camera";
import { computeAimCamera, computeFocusCamera, placementOf } from "./battleCamera";

export interface BattleRigApi {
  rig: CameraRigApi;
  sceneRef: RefObject<HTMLDivElement>;
  worldRef: RefObject<HTMLDivElement>;
  stageRef: RefObject<HTMLDivElement>;
  dofTargetsRef: MutableRefObject<Set<HTMLElement>>;
}

export function useBattleRig(): BattleRigApi {
  const sceneRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const dofTargetsRef = useRef<Set<HTMLElement>>(new Set());
  const rig = useCameraRig({ sceneRef, worldRef, dofTargetsRef });
  return { rig, sceneRef, worldRef, stageRef, dofTargetsRef };
}

export interface BattleCameraApi extends BattleRigApi {
  aim: Camera | null;
  setAimFoeId: (id: string | null) => void;
  setCameraTarget: (next: Camera | null) => void;
  snapCameraTarget: (next: Camera | null) => void;
  focusCamera: (focusIds: string[], preset: Parameters<typeof computeFocusCamera>[4]) => Camera | null;
}

interface Options extends BattleRigApi {
  battle: BattleState | null;
  battleSeq: number;
  selectedUid: string | null;
  animating: boolean;
  stageScale: number;
}

export function useBattleCamera({
  rig,
  sceneRef,
  worldRef,
  stageRef,
  dofTargetsRef,
  battle,
  battleSeq,
  selectedUid,
  animating,
  stageScale,
}: Options): BattleCameraApi {
  const [aimFoeId, setAimFoeId] = useState<string | null>(null);
  const [aim, setAim] = useState<Camera | null>(null);

  const setCameraTarget = useCallback((next: Camera | null) => {
    rig.setCamera(next);
  }, [rig]);

  const snapCameraTarget = useCallback((next: Camera | null) => {
    rig.snap(next);
  }, [rig]);

  const focusCamera = useCallback((focusIds: string[], preset: Parameters<typeof computeFocusCamera>[4]) => {
    if (!battle) return null;
    return computeFocusCamera(worldRef.current, stageRef.current, battle, focusIds, preset);
  }, [battle, stageRef, worldRef]);

  useEffect(() => {
    setAimFoeId(null);
    setAim(null);
    snapCameraTarget(null);
  }, [battleSeq, snapCameraTarget]);

  // 瞄准相机的驱动: "选中了一张指向敌人的卡 且 不在分镜里" ⇒ 推近(并朝锁存的目标偏移),
  // 否则退出瞄准态。分镜期间恒不生效 —— startBatch 会清 selectedUid 并上锁, 这里只是二重保险。
  // 用 useLayoutEffect: 与首帧同步测量, 避免瞄准态先渲染一帧全景再跳。
  // stageScale 进依赖: 窗口尺寸变了要重测(结果虽是设计 px, 但 DOM 矩形已变)。
  useLayoutEffect(() => {
    const card = battle && selectedUid ? battle.cards[selectedUid] : null;
    const on = !!battle && battle.phase === "player" && !animating && card?.targeting === "foe";
    const next = on
      ? computeAimCamera(
          worldRef.current,
          stageRef.current,
          aimFoeId,
          aimFoeId && battle ? placementOf(battle, aimFoeId) : undefined,
        )
      : null;
    if (!animating) setCameraTarget(next);
    setAim((previous) => (sameCamera(previous, next) ? previous : next));
  }, [aimFoeId, animating, battle, selectedUid, setCameraTarget, stageScale, stageRef, worldRef]);

  return {
    rig,
    sceneRef,
    worldRef,
    stageRef,
    dofTargetsRef,
    aim,
    setAimFoeId,
    setCameraTarget,
    snapCameraTarget,
    focusCamera,
  };
}
