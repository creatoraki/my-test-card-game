import type { ReactNode } from "react";
import type { StepMotion } from "@/ui/sortie/SortieScreen/sortieStepTransition";
import s from "./SortieStepViewport.module.css";

interface Props {
  mapMotion: StepMotion;
  prepMotion: StepMotion;
  map: ReactNode;
  prep: ReactNode;
}

// ★ 两个步骤常驻挂载: 切换时不再付整页挂载的首帧开销。
//   不在场的那一层用 content-visibility 跳过渲染与绘制, 过场时两层同时在场各演各的。
export function SortieStepViewport({ mapMotion, prepMotion, map, prep }: Props) {
  return (
    <section className={s.viewport} aria-label="出击步骤">
      <div className={s.layer} data-motion={mapMotion} aria-hidden={mapMotion === "hidden" || undefined}>
        {map}
      </div>
      <div className={s.layer} data-motion={prepMotion} aria-hidden={prepMotion === "hidden" || undefined}>
        {prep}
      </div>
    </section>
  );
}
