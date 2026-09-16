import { useId, type ReactNode } from "react";
import { cx } from "@/ui/common/cx";
import type { TechnologyState } from "@/ui/common/techTree/TechnologyTree/types";
import s from "./TechnologyMedallion.module.css";

/* 四种状态共用同一套尖顶六边形几何，中心 (90, 89)，viewBox 180×180。 */
const HEX_OUTER = "M90 8 160 48V129L90 170 20 129V48Z";
const HEX_MID = "M90 17 152 53V125L90 161 28 125V53Z";
const HEX_INNER = "M90 29 142 59V119L90 149 38 119V59Z";
const HEX_RIM = "M90 1 166 44V134L90 178 14 134V44Z";
/** 贴着外沿六边形顶点与左右竖边的三枚小三角。 */
const HEX_MARKS = "M80 8 90 2 100 8M15 80 5 90 15 100M165 80 175 90 165 100";

interface Props {
  icon: ReactNode;
  state?: TechnologyState;
  selected?: boolean;
  detail?: boolean;
  /** 多级节点的等级进度 0~1；缺省不画进度环。 */
  progress?: number;
  className?: string;
}

export function TechnologyMedallion({ icon, state = "done", selected, detail, progress, className }: Props) {
  const id = useId();
  const locked = state === "locked";
  const ratio = progress === undefined ? null : Math.min(1, Math.max(0, progress));
  return (
    <span className={cx(s.medallion, className)} data-state={state} data-selected={selected || undefined} data-detail={detail || undefined} aria-hidden="true">
      <svg className={s.rings} viewBox="0 0 180 180">
        <defs>
          <linearGradient id={`${id}-gold`} x1="0" y1="0" x2=".8" y2="1">
            <stop stopColor="var(--tech-medal-1, #fffbd0)" /><stop offset=".25" stopColor="var(--tech-medal-2, #ffdf84)" />
            <stop offset=".53" stopColor="var(--tech-medal-3, #92632b)" /><stop offset=".76" stopColor="var(--tech-medal-4, #ffe79a)" /><stop offset="1" stopColor="var(--tech-medal-5, #a47835)" />
          </linearGradient>
          <linearGradient id={`${id}-steel`} x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#d6e7ee" /><stop offset=".4" stopColor="#7798af" /><stop offset=".65" stopColor="#354b5e" /><stop offset="1" stopColor="#97bbd1" />
          </linearGradient>
          <radialGradient id={`${id}-plate`} cx=".35" cy=".25" r=".8">
            <stop stopColor="var(--tech-medal-plate-1, #29343a)" /><stop offset=".55" stopColor="var(--tech-medal-plate-2, #101a22)" /><stop offset="1" stopColor="var(--tech-medal-plate-3, #040a0f)" />
          </radialGradient>
        </defs>
        {locked && !detail ? (
          <g fill={`url(#${id}-plate)`} stroke={`url(#${id}-steel)`}>
            <path d={HEX_OUTER} strokeWidth="4" />
            <path d={HEX_MID} strokeWidth="1.5" />
            <path d={HEX_INNER} strokeWidth="2" opacity=".55" />
          </g>
        ) : (
          <g fill="none" stroke={detail ? "var(--tech-medal-detail, #76e2ff)" : `url(#${id}-gold)`}>
            <path d={HEX_OUTER} fill={`url(#${id}-plate)`} strokeWidth="4" />
            <path d={HEX_MID} strokeWidth="2" />
            {!selected && <path d={HEX_RIM} strokeWidth="2" strokeDasharray="119 11 34 8 74 18" />}
            <path d={HEX_MARKS} fill={detail ? "var(--tech-medal-detail, #76e2ff)" : "var(--tech-medal-mark, #ffe497)"} stroke="none" />
          </g>
        )}
        {/* 多级节点的等级进度环：沿外沿六边形顺时针填充。 */}
        {ratio !== null && !detail && <>
          <path className={s.levelTrack} d={HEX_RIM} pathLength={100} />
          <path className={s.levelProgress} d={HEX_RIM} pathLength={100} strokeDasharray="100" strokeDashoffset={100 - ratio * 100} />
        </>}
        {selected && !detail && <path className={s.selection} d={HEX_RIM} />}
      </svg>
      <span className={s.artwork}>{icon}</span>
      {locked && !detail && <svg className={s.lock} viewBox="0 0 48 56">
        <path d="M12 23V15a12 12 0 0 1 24 0v8" fill="none" stroke="#aec7d9" strokeWidth="5" />
        <rect x="4" y="22" width="40" height="31" rx="4" fill="#9cb7cd" stroke="#233746" strokeWidth="2" />
        <path d="M24 31a4 4 0 0 0-2 7v7h4v-7a4 4 0 0 0-2-7" fill="#08121b" />
      </svg>}
      {state === "done" && !detail && <svg className={s.check} viewBox="0 0 36 36">
        <circle cx="18" cy="18" r="15" fill="var(--tech-medal-check-fill, #665021)" stroke="var(--tech-medal-check-edge, #ffe9a3)" strokeWidth="2" />
        <path d="m10 18 6 6 11-13" fill="none" stroke="var(--tech-medal-check-tick, #fff5c3)" strokeWidth="3" />
      </svg>}
    </span>
  );
}
