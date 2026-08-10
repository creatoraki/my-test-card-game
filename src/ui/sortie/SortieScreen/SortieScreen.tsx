import { useCallback, useEffect, useState } from "react";
import { MAPS } from "@/data";
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
  const startExpedition = useRunStore((state) => state.startExpedition);
  const enterTown = useRunStore((state) => state.enterTown);
  const [selectedMapId, setSelectedMapId] = useState(MAPS[0]?.id ?? "");
  const { visibleStep, exitingStep, transitioning, intro } = useSortieStepTransition(step);

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
    startExpedition(mapId, backpack);
    clear();
  }, [backpack, clear, mapId, startExpedition]);

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
          mapId={selectedMapId}
          showInfo={visibleStep === "map" || exitingStep === "map"}
          infoEntering={visibleStep === "map" && transitioning}
          infoExiting={exitingStep === "map"}
          intro={intro}
        />
        <SortieStepViewport
          visibleStep={visibleStep}
          map={
            <MapSelectStep
              active={visibleStep === "map" && !transitioning}
              entering={visibleStep === "map" && transitioning}
              intro={intro}
              selectedMapId={selectedMapId}
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
          canConfirmMap={party.length > 0}
          onBackToTown={leave}
          onBackToMap={backToMap}
          onConfirmMap={() => pickMap(selectedMapId)}
          onStartExpedition={startRun}
        />
      </main>
    </StageCanvas>
  );
}
