import { useCallback, useEffect, useMemo, useState } from "react";
import { isMapUnlocked, mapLockReason, visibleMaps } from "@/data";
import { useRunStore } from "@/store/runStore";
import { useSortieStore } from "@/store/sortieStore";
import { useTownStore } from "@/store/townStore";
import { StageCanvas } from "@/ui/app/StageCanvas";
import { MapSelectStep } from "@/ui/sortie/MapSelectStep";
import { PrepStep } from "@/ui/sortie/PrepStep";
import { SortieBackdrop } from "@/ui/sortie/SortieBackdrop";
import { SortieNav } from "@/ui/sortie/SortieNav";
import { SortieStepViewport } from "@/ui/sortie/SortieStepViewport";
import { useSortieStepTransition } from "@/ui/sortie/sortieStepTransition";
import s from "./SortieScreen.module.css";

export function SortieScreen() {
  const step = useSortieStore((state) => state.step);
  const mapId = useSortieStore((state) => state.mapId);
  const backpack = useSortieStore((state) => state.backpack);
  const open = useSortieStore((state) => state.open);
  const pickMap = useSortieStore((state) => state.pickMap);
  const backToMap = useSortieStore((state) => state.backToMap);
  const cancel = useSortieStore((state) => state.cancel);
  const clear = useSortieStore((state) => state.clear);
  const party = useTownStore((state) => state.party);
  const clearedMaps = useTownStore((state) => state.clearedMaps);
  const maps = useMemo(() => visibleMaps(clearedMaps), [clearedMaps]);
  const beginDescent = useRunStore((state) => state.beginDescent);
  const enterTown = useRunStore((state) => state.enterTown);
  const [selectedMapId, setSelectedMapId] = useState(() => maps[0]?.id ?? "");
  const { visibleStep, exitingStep, transitioning, intro } = useSortieStepTransition(step);
  const selectedLocked = !isMapUnlocked(selectedMapId, clearedMaps);
  const lockReason = mapLockReason(selectedMapId, clearedMaps);

  useEffect(() => {
    if (maps.some((map) => map.id === selectedMapId)) return;
    setSelectedMapId(maps[0]?.id ?? "");
  }, [maps, selectedMapId]);

  useEffect(() => {
    open();
  }, [open]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      cancel();
      enterTown();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [cancel, enterTown]);

  const leave = () => {
    cancel();
    enterTown();
  };

  const startRun = useCallback(() => {
    if (!mapId) return;
    beginDescent(mapId, backpack);
    clear();
  }, [backpack, beginDescent, clear, mapId]);

  const selectMap = useCallback((nextMapId: string) => {
    setSelectedMapId(nextMapId);
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
              clearedMaps={clearedMaps}
              onSelectMap={selectMap}
            />
          }
          prep={
            <PrepStep
              active={visibleStep === "prep" && !transitioning}
              entering={visibleStep === "prep" && transitioning}
              exiting={exitingStep === "prep"}
            />
          }
          exitingStep={exitingStep}
        />
        <SortieNav
          step={visibleStep}
          disabled={transitioning}
          canConfirmMap={party.length > 0 && !selectedLocked}
          onBackToTown={leave}
          onBackToMap={backToMap}
          onConfirmMap={() => pickMap(selectedMapId)}
          onStartExpedition={startRun}
        />
      </main>
    </StageCanvas>
  );
}
