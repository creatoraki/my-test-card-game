import type { ReactNode } from "react";
import type { SortieStep } from "@/store/sortieStore";
import s from "./SortieStepViewport.module.css";

interface Props {
  visibleStep: SortieStep;
  map: ReactNode;
  prep: ReactNode;
}

export function SortieStepViewport({
  visibleStep,
  map,
  prep,
}: Props) {
  return (
    <section className={s.viewport} aria-label="出击步骤">
      {visibleStep === "map" ? map : prep}
    </section>
  );
}