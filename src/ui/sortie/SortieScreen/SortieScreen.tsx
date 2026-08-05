import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { MAPS } from "@/data";
import { useRunStore } from "@/store/runStore";
import { useSortieStore } from "@/store/sortieStore";
import { useTownStore } from "@/store/townStore";
import { useStageScale } from "@/ui/hooks/stage";
import { MapSelectStep } from "@/ui/sortie/MapSelectStep";
import { PrepStep } from "@/ui/sortie/PrepStep";
import { SortieBackdrop } from "@/ui/sortie/SortieBackdrop";
import { SortieNav } from "@/ui/sortie/SortieNav";
import { SortieStepViewport } from "@/ui/sortie/SortieStepViewport";
import s from "./SortieScreen.module.css";

export function SortieScreen() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const stageScale = useStageScale(viewportRef);
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
  const [isStepTransitioning, setIsStepTransitioning] = useState(false);

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
    <div
      ref={viewportRef}
      className={s.viewport}
      style={{ "--stage-scale": stageScale } as CSSProperties}
    >
      <main className={s.stage}>
        <SortieBackdrop mapId={selectedMapId} />
        <SortieStepViewport
          step={step}
          onTransitioningChange={setIsStepTransitioning}
          map={
            <MapSelectStep
              active={step === "map" && !isStepTransitioning}
              selectedMapId={selectedMapId}
              onSelectMap={selectMap}
            />
          }
          prep={<PrepStep />}
        />
        <SortieNav
          step={step}
          disabled={isStepTransitioning}
          canConfirmMap={party.length > 0}
          onBackToTown={leave}
          onBackToMap={backToMap}
          onConfirmMap={() => pickMap(selectedMapId)}
          onStartExpedition={startRun}
        />
      </main>
    </div>
  );
}
