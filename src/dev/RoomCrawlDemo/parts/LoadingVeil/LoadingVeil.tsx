import { useRef } from "react";
import type { LoadingState } from "../../types";
import s from "./LoadingVeil.module.css";

/**
 * 房间加载黑幕: 虹膜收拢后盖在舞台上, 显示「正在进入 · 房名」与细进度条。
 * 出现带短延迟(快速切换时不闪), 结束时淡出; 淡出期间沿用最后一次的房名与进度。
 */
export function LoadingVeil({ state }: { state: LoadingState | null }) {
  const lastRef = useRef<LoadingState>({ name: "", progress: 0 });
  if (state) lastRef.current = state;
  const shown = lastRef.current;
  return <div className={s.veil} data-visible={state !== null} role="status" aria-live="polite">
    <div className={s.box}>
      <span className={s.caption}>正在进入</span>
      <span className={s.name}>{shown.name}</span>
      <span className={s.track}>
        <span className={s.bar} style={{ transform: `scaleX(${Math.max(0.02, shown.progress)})` }} />
      </span>
    </div>
  </div>;
}
