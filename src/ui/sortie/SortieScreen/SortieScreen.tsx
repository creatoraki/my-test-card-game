import { useCallback, useEffect, useMemo, useState } from "react";
import {
  difficultyKey,
  isDifficultyUnlocked,
  isMapUnlocked,
  mapLockReason,
  visibleMaps,
  type MapDifficulty,
} from "@/data";
import { useRunStore } from "@/store/runStore";
import { useSortieStore } from "@/store/sortieStore";
import { useTownStore } from "@/store/townStore";
import { StageCanvas } from "@/ui/app/StageCanvas";
import { MapSelectStep } from "@/ui/sortie/MapSelectStep";
import { PrepStep } from "@/ui/sortie/PrepStep";
import { SortieBackdrop } from "@/ui/sortie/SortieBackdrop";
import { SortieNav } from "@/ui/sortie/SortieNav";
import { SortieRelicPanel } from "@/ui/sortie/SortieRelicPanel";
import { SortieStepViewport } from "@/ui/sortie/SortieStepViewport";
import { useSortieStepTransition } from "@/ui/sortie/sortieStepTransition";
import { usePanelMorph, type Rect } from "@/ui/common/panelMorph";
import s from "./SortieScreen.module.css";

const isTest = import.meta.env.isTest === "true";
const RELIC_PANEL_RECT: Record<"relic", Rect> = {
  relic: { x: 360, y: 130, w: 1200, h: 760 },
};

export function SortieScreen() {
  const step = useSortieStore((state) => state.step);
  const mapId = useSortieStore((state) => state.mapId);
  const sortieDifficulty = useSortieStore((state) => state.difficulty);
  const backpack = useSortieStore((state) => state.backpack);
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
  const { visibleStep, exitingStep, transitioning, intro } = useSortieStepTransition(step);
  const relicMorph = usePanelMorph<"relic">({ rects: RELIC_PANEL_RECT });
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
    return () => cancel();
  }, [open, cancel, syncDailyClear]);

  useEffect(() => {
    if (relicMorph.panel !== null) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      cancel();
      enterTown();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [cancel, enterTown, relicMorph.panel]);

  const leave = () => {
    cancel();
    enterTown();
  };

  const startRun = useCallback(() => {
    if (!mapId) return;
    beginDescent(mapId, backpack, sortieDifficulty);
    clear();
  }, [backpack, beginDescent, clear, mapId, sortieDifficulty]);

  const selectMap = useCallback((nextMapId: string) => {
    setSelectedMapId(nextMapId);
  }, []);

  const selectDifficulty = useCallback((difficulty: MapDifficulty) => {
    setSelectedDifficulty(difficulty);
  }, []);

  return (
    <StageCanvas
      viewportClassName={s.viewport}
      className={s.stage}
    >
      <main className={s.stageContent}>
        <SortieBackdrop
          maps={maps}
          mapId={selectedMapId}
          showInfo={visibleStep === "map" || exitingStep === "map"}
          infoEntering={visibleStep === "map" && transitioning}
          infoExiting={exitingStep === "map"}
          intro={intro}
          lockReason={lockReason}
        />
        <SortieStepViewport
          visibleStep={visibleStep}
          map={
            <MapSelectStep
              maps={maps}
              active={visibleStep === "map" && !transitioning}
              entering={visibleStep === "map" && transitioning}
              intro={intro}
              selectedMapId={selectedMapId}
              difficulty={selectedDifficulty}
              clearedMaps={clearedMaps}
              clearedKeys={clearedDifficulties}
              dailyRewards={dailyClearRewards[difficultyKey(selectedMapId, selectedDifficulty)] ?? []}
              onSelectMap={selectMap}
              onSelectDifficulty={selectDifficulty}
            />
          }
          prep={
            <PrepStep
              active={visibleStep === "prep" && !transitioning}
              entering={visibleStep === "prep" && transitioning}
              exiting={exitingStep === "prep"}
              onOpenRelics={(entry) => relicMorph.openPanel("relic", entry)}
            />
          }
          exitingStep={exitingStep}
        />
        <SortieNav
          step={visibleStep}
          disabled={transitioning}
          canConfirmMap={party.length > 0 && !selectedLocked && selectedDifficultyUnlocked}
          onBackToTown={leave}
          onBackToMap={backToMap}
          onConfirmMap={() => pickMap(selectedMapId, selectedDifficulty)}
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
