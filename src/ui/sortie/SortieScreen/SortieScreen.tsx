import {
  useEffect,
  useRef,
  type CSSProperties,
} from "react";
import { useRunStore } from "@/store/runStore";
import { useSortieStore } from "@/store/sortieStore";
import { useStageScale } from "@/ui/hooks/stage";
import { MapSelectStep } from "@/ui/sortie/MapSelectStep";
import { PrepStep } from "@/ui/sortie/PrepStep";
import s from "./SortieScreen.module.css";

export function SortieScreen() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const stageScale = useStageScale(viewportRef);
  const step = useSortieStore((state) => state.step);
  const open = useSortieStore((state) => state.open);
  const cancel = useSortieStore((state) => state.cancel);
  const enterTown = useRunStore((state) => state.enterTown);

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

  return (
    <div
      ref={viewportRef}
      className={s.viewport}
      style={{ "--stage-scale": stageScale } as CSSProperties}
    >
      <main className={s.stage}>
        {step === "map" ? <MapSelectStep onCancel={leave} /> : <PrepStep />}
      </main>
    </div>
  );
}
