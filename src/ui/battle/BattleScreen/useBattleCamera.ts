import { useCallback, useEffect, useLayoutEffect, useRef, useState, type MutableRefObject, type RefObject } from "react";
import { effectiveTargeting, type BattleState } from "@/engine";
import { sameCamera, useCameraRig, type Camera, type CameraRigApi } from "@/ui/battle/camera";
import { computeAimCamera, computeFocusCamera, placementOf } from "./battleCamera";

// 相机目标分三类: 透视容器里的 scene/world 纵深层(可有多组, 背景组与近景组)、
// 脱离透视的敌人平面(planeRef, 同时是取景数学的查询根)及其单位包裹层。
export interface BattleRigApi {
  rig: CameraRigApi;
  sceneTargetsRef: MutableRefObject<Set<HTMLElement>>;
  worldTargetsRef: MutableRefObject<Set<HTMLElement>>;
  planeRef: RefObject<HTMLDivElement>;
  planeUnitsRef: MutableRefObject<Set<HTMLElement>>;
  stageRef: RefObject<HTMLDivElement>;
  dofTargetsRef: MutableRefObject<Set<HTMLElement>>;
}

export function useBattleRig(): BattleRigApi {
  const sceneTargetsRef = useRef<Set<HTMLElement>>(new Set());
  const worldTargetsRef = useRef<Set<HTMLElement>>(new Set());
  const planeRef = useRef<HTMLDivElement>(null);
  const planeUnitsRef = useRef<Set<HTMLElement>>(new Set());
  const stageRef = useRef<HTMLDivElement>(null);
  const dofTargetsRef = useRef<Set<HTMLElement>>(new Set());
  const rig = useCameraRig({ sceneTargetsRef, worldTargetsRef, planeRef, planeUnitsRef, dofTargetsRef });
  return { rig, sceneTargetsRef, worldTargetsRef, planeRef, planeUnitsRef, stageRef, dofTargetsRef };
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
  battle,
  battleSeq,
  selectedUid,
  animating,
  stageScale,
  ...rigApi
}: Options): BattleCameraApi {
  const { rig, planeRef, stageRef } = rigApi;
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
    return computeFocusCamera(planeRef.current, stageRef.current, battle, focusIds, preset);
  }, [battle, planeRef, stageRef]);

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
    const on = !!battle && battle.phase === "player" && !animating && card != null && effectiveTargeting(card) === "foe";
    const next = on
      ? computeAimCamera(
          planeRef.current,
          stageRef.current,
          aimFoeId,
          aimFoeId && battle ? placementOf(battle, aimFoeId) : undefined,
        )
      : null;
    if (!animating) setCameraTarget(next);
    setAim((previous) => (sameCamera(previous, next) ? previous : next));
  }, [aimFoeId, animating, battle, selectedUid, setCameraTarget, planeRef, stageScale, stageRef]);

  return {
    ...rigApi,
    aim,
    setAimFoeId,
    setCameraTarget,
    snapCameraTarget,
    focusCamera,
  };
}
