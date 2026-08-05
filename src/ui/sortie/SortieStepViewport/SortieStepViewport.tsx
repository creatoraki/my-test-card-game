import type { ReactNode } from "react";
import type { SortieStep } from "@/store/sortieStore";
import s from "./SortieStepViewport.module.css";

interface Props {
  visibleStep: SortieStep;
  exitingStep: SortieStep | null;
  map: ReactNode;
  prep: ReactNode;
}

export function SortieStepViewport({
  visibleStep,
  exitingStep,
  map,
  prep,
}: Props) {
  return (
    <section className={s.viewport} aria-label="出击步骤">
      {visibleStep === "map" && <div className={s.currentLayer}>{map}</div>}
      {visibleStep === "prep" && <div className={s.currentLayer}>{prep}</div>}
      {visibleStep === "map" && exitingStep === "prep" && (
        <div className={s.exitingLayer}>{prep}</div>
      )}
    </section>
  );
}