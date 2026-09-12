import { useId, type ReactNode } from "react";
import { cx } from "@/ui/common/cx";
import type { TechnologyState } from "@/ui/common/techTree/TechnologyTree/types";
import s from "./TechnologyMedallion.module.css";

interface Props {
  icon: ReactNode;
  state?: TechnologyState;
  selected?: boolean;
  detail?: boolean;
  className?: string;
}

export function TechnologyMedallion({ icon, state = "done", selected, detail, className }: Props) {
  const id = useId();
  const locked = state === "locked";
  return (
    <span className={cx(s.medallion, className)} data-state={state} data-selected={selected || undefined} data-detail={detail || undefined} aria-hidden="true">
      <svg className={s.rings} viewBox="0 0 180 180">
        <defs>
          <linearGradient id={`${id}-gold`} x1="0" y1="0" x2=".8" y2="1">
            <stop stopColor="#fffbd0" /><stop offset=".25" stopColor="#ffdf84" />
            <stop offset=".53" stopColor="#92632b" /><stop offset=".76" stopColor="#ffe79a" /><stop offset="1" stopColor="#a47835" />
          </linearGradient>
          <linearGradient id={`${id}-steel`} x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#d6e7ee" /><stop offset=".4" stopColor="#7798af" /><stop offset=".65" stopColor="#354b5e" /><stop offset="1" stopColor="#97bbd1" />
          </linearGradient>
          <radialGradient id={`${id}-plate`} cx=".35" cy=".25" r=".8">
            <stop stopColor="#29343a" /><stop offset=".55" stopColor="#101a22" /><stop offset="1" stopColor="#040a0f" />
          </radialGradient>
        </defs>
        {locked && !detail ? (
          <g fill={`url(#${id}-plate)`} stroke={`url(#${id}-steel)`}>
            <path d="M90 8 160 48V129L90 170 20 129V48Z" strokeWidth="4" />
            <path d="M90 17 152 53V125L90 161 28 125V53Z" strokeWidth="1.5" />
            <path d="M90 29 142 59V119L90 149 38 119V59Z" strokeWidth="2" opacity=".55" />
          </g>
        ) : (
          <g fill="none" stroke={detail ? "#76e2ff" : `url(#${id}-gold)`}>
            <circle cx="90" cy="90" r="74" fill={`url(#${id}-plate)`} strokeWidth="4" />
            <circle cx="90" cy="90" r="65" strokeWidth="2" />
            <circle cx="90" cy="90" r="80" strokeWidth="2" strokeDasharray="112 10 32 8 70 17" />
            <path d="m80 10 10-6 10 6M10 80 0 90 10 100M170 80l10 10-10 10" fill={detail ? "#76e2ff" : "#ffe497"} stroke="none" />
          </g>
        )}
        {selected && !detail && <path className={s.selection} d="M90 1 166 44V134L90 178 14 134V44Z" />}
      </svg>
      <span className={s.artwork}>{icon}</span>
      {locked && !detail && <svg className={s.lock} viewBox="0 0 48 56">
        <path d="M12 23V15a12 12 0 0 1 24 0v8" fill="none" stroke="#aec7d9" strokeWidth="5" />
        <rect x="4" y="22" width="40" height="31" rx="4" fill="#9cb7cd" stroke="#233746" strokeWidth="2" />
        <path d="M24 31a4 4 0 0 0-2 7v7h4v-7a4 4 0 0 0-2-7" fill="#08121b" />
      </svg>}
      {state === "done" && !detail && <svg className={s.check} viewBox="0 0 36 36">
        <circle cx="18" cy="18" r="15" fill="#665021" stroke="#ffe9a3" strokeWidth="2" />
        <path d="m10 18 6 6 11-13" fill="none" stroke="#fff5c3" strokeWidth="3" />
      </svg>}
    </span>
  );
}
