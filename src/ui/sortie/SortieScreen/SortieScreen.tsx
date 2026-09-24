import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  difficultyKey,
  isDifficultyUnlocked,
  isMapUnlocked,
  mapLockReason,
  visibleMaps,
  type MapDifficulty,
} from "@/data";
import type { ItemStack } from "@/items/types";
import { useRunStore } from "@/store/run/runStore";
import { useSortieStore } from "@/store/sortie/sortieStore";
import { useTownStore } from "@/store/town/townStore";
import { StageCanvas } from "@/ui/app/StageCanvas";
import { MapSelectStep } from "@/ui/sortie/MapSelectStep";
import { PrepStep } from "@/ui/sortie/PrepStep";
import { SortieBackdrop } from "@/ui/sortie/SortieBackdrop";
import { SortieNav } from "@/ui/sortie/SortieNav";
import { SortieRelicPanel } from "@/ui/sortie/SortieRelicPanel";
import { SortieStepViewport } from "@/ui/sortie/SortieStepViewport";
import {
  sortieMotionVars,
  stepMotion,
  useSortieStepTransition,
} from "@/ui/sortie/SortieScreen/sortieStepTransition";
import { usePanelMorph, type Rect } from "@/ui/common/frame/panelMorph";
import s from "./SortieScreen.module.css";

const isTest = import.meta.env.isTest === "true";
const RELIC_PANEL_RECT: Record<"relic", Rect> = {
  relic: { x: 360, y: 130, w: 1200, h: 760 },
};
const MOTION_VARS = sortieMotionVars();
const EMPTY_REWARDS: ItemStack[] = [];

export function SortieScreen() {
  // ★ 只订阅驱动画面的字段。背包/已选地图/难度只在出击那一刻用, 从 getState 读 ——
  //   订阅它们会让物资准备里每买一件东西都整页重渲染。
  const step = useSortieStore((state) => state.step);
  const open = useSortieStore((state) => state.open);
  const pickMap = useSortieStore((state) => state.pickMap);
  const backToMap = useSortieStore((state) => state.backToMap);
  const cancel = useSortieStore((state) => state.cancel);
  const clear = useSortieStore((state) => state.clear);
  const party = useTownStore((state) => state.party);
  const clearedMaps = useTownStore((state) => state.clearedMaps);
  const clearedDifficulties = useTownStore((state) => state.clearedDifficulties);
  const dailyClearRewards = useTownStore((state) => state.dailyClear.rewards);
  const syncDailyClear = useTownStore((state) => state.syncDailyClear);
  const maps = useMemo(() => visibleMaps(clearedMaps), [clearedMaps]);
  const beginDescent = useRunStore((state) => state.beginDescent);
  const enterTown = useRunStore((state) => state.enterTown);
  const [selectedMapId, setSelectedMapId] = useState(() => maps[0]?.id ?? "");
  const [selectedDifficulty, setSelectedDifficulty] = useState<MapDifficulty>("normal");
  // 出击后界面还要在 ScreenTransition 里演完出场: 这段时间锁住导航与 Esc。
  const [launching, setLaunching] = useState(false);
  const launchedRef = useRef(false);
  const transition = useSortieStepTransition(step);
  const { visibleStep, exitingStep, transitioning } = transition;
  const mapMotion = stepMotion("map", transition);
  const prepMotion = stepMotion("prep", transition);
  const relicMorph = usePanelMorph<"relic">({ rects: RELIC_PANEL_RECT });
  const openRelicPanel = relicMorph.openPanel;
  const selectedLocked = !isTest && !isMapUnlocked(selectedMapId, clearedMaps);
  const selectedDifficultyUnlocked = !selectedMapId || isDifficultyUnlocked(
    selectedMapId,
    selectedDifficulty,
    clearedDifficulties,
  );
  const lockReason = isTest ? null : mapLockReason(selectedMapId, clearedMaps);

  useEffect(() => {
    if (maps.some((map) => map.id === selectedMapId)) return;
    setSelectedMapId(maps[0]?.id ?? "");
  }, [maps, selectedMapId]);

  useEffect(() => {
    if (!selectedMapId || isDifficultyUnlocked(selectedMapId, selectedDifficulty, clearedDifficulties)) return;
    setSelectedDifficulty("normal");
  }, [selectedMapId, selectedDifficulty, clearedDifficulties]);

  useEffect(() => {
    open();
    syncDailyClear();
    // ★ 出击成功的会话要等界面真正卸载时才 clear(): 出场动画期间若提前清空,
    //   step 会被重置回 "map"(闪一下选层入场)、背包也会当场变空。其余出口一律全量回滚。
    return () => {
      if (launchedRef.current) clear();
      else cancel();
    };
  }, [open, cancel, clear, syncDailyClear]);

  useEffect(() => {
    if (relicMorph.panel !== null || launching) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      cancel();
      enterTown();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [cancel, enterTown, launching, relicMorph.panel]);

  const leave = useCallback(() => {
    cancel();
    enterTown();
  }, [cancel, enterTown]);

  const startRun = useCallback(() => {
    const { mapId, backpack, difficulty } = useSortieStore.getState();
    if (!mapId || launchedRef.current) return;
    launchedRef.current = true;
    setLaunching(true);
    beginDescent(mapId, backpack, difficulty);
  }, [beginDescent]);

  const confirmMap = useCallback(() => {
    pickMap(selectedMapId, selectedDifficulty);
  }, [pickMap, selectedDifficulty, selectedMapId]);

  const openRelics = useCallback(
    (entry: HTMLElement) => openRelicPanel("relic", entry),
    [openRelicPanel],
  );

  return (
    <StageCanvas
      viewportClassName={s.viewport}
      className={s.stage}
    >
      <main className={s.stageContent} style={MOTION_VARS}>
        <SortieBackdrop
          maps={maps}
          mapId={selectedMapId}
          depth={visibleStep}
          infoMotion={mapMotion}
          lockReason={lockReason}
        />
        <SortieStepViewport
          mapMotion={mapMotion}
          prepMotion={prepMotion}
          map={
            <MapSelectStep
              maps={maps}
              motion={mapMotion}
              selectedMapId={selectedMapId}
              difficulty={selectedDifficulty}
              clearedMaps={clearedMaps}
              clearedKeys={clearedDifficulties}
              dailyRewards={dailyClearRewards[difficultyKey(selectedMapId, selectedDifficulty)] ?? EMPTY_REWARDS}
              onSelectMap={setSelectedMapId}
              onSelectDifficulty={setSelectedDifficulty}
            />
          }
          prep={<PrepStep motion={prepMotion} onOpenRelics={openRelics} />}
        />
        <SortieNav
          step={visibleStep}
          exitingStep={exitingStep}
          transitioning={transitioning}
          disabled={launching}
          canConfirmMap={party.length > 0 && !selectedLocked && selectedDifficultyUnlocked}
          onBackToTown={leave}
          onBackToMap={backToMap}
          onConfirmMap={confirmMap}
          onStartExpedition={startRun}
        />
        {relicMorph.panel === "relic" && (
          <SortieRelicPanel
            closing={relicMorph.phase === "closing"}
            onClose={relicMorph.closePanel}
            className={s.relicModal}
            morph={{
              ref: relicMorph.panelRef,
              rect: RELIC_PANEL_RECT.relic,
              ready: relicMorph.ready,
              seedLabel: "遗物携带",
            }}
          />
        )}
      </main>
    </StageCanvas>
  );
}
