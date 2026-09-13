import { useId } from "react";
import { cx } from "@/ui/common/cx";
import s from "./SortieFrame.module.css";

interface Props {
  width: number;
  height: number;
  notch?: number;
  selected?: boolean;
  metal?: boolean;
  className?: string;
}

/** 按实际设计尺寸绘制，保持切角、双描边与金属角片的线宽一致。 */
export function SortieFrame({ width: w, height: h, notch: n = 14, selected, metal = true, className }: Props) {
  const id = useId().replace(/:/g, "");
  const outline = `M ${n} 1 H ${w - n} L ${w - 1} ${n} V ${h - n} L ${w - n} ${h - 1} H ${n} L 1 ${h - n} V ${n} Z`;
  return (
    <svg className={cx(s.frame, className)} data-selected={selected || undefined}
      viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-edge`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#f0f9ff" /><stop offset=".27" stopColor="#69767f" />
          <stop offset=".52" stopColor="#c8d8e2" /><stop offset=".74" stopColor="#667681" />
          <stop offset="1" stopColor="#e9f7ff" />
        </linearGradient>
        <linearGradient id={`${id}-metal`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#fff" /><stop offset=".45" stopColor="#d8e6ee" />
          <stop offset="1" stopColor="#566773" />
        </linearGradient>
      </defs>
      <path d={outline} stroke={selected ? "#c3edff" : `url(#${id}-edge)`} strokeWidth={selected ? 2.5 : 1.25} />
      <path d={`M ${n + 5} 5 H ${w - n - 3} L ${w - 5} ${n + 3} V ${h - n - 3} L ${w - n - 3} ${h - 5} H ${n + 3} L 5 ${h - n - 3} V ${n + 5}`}
        stroke={selected ? "#81cefb" : "#a6c7db"} strokeOpacity={selected ? .48 : .13} strokeWidth=".8" />
      {metal && <g fill={`url(#${id}-metal)`}>
        <path d={`M 1 ${n} L ${n} 1 H ${n + 10} L 6 ${n + 10} V ${n + 25} H 1 Z`} />
        <path d={`M 1 ${h - n - 15} H 5 V ${h - n} L ${n} ${h - 4} H ${n + 20} V ${h - 1} H ${n} L 1 ${h - n} Z`} />
        <path d={`M ${w - 1} ${h - n - 10} V ${h - n} L ${w - n} ${h - 1} H ${w - n - 12} L ${w - 5} ${h - n - 5} Z`} />
      </g>}
      <path d={`M ${n + 20} 1 H ${n + 56} M ${w - 86} ${h - 1} H ${w - 32}`}
        stroke="#f1fbff" strokeWidth={selected ? 2.5 : 1.5} />
    </svg>
  );
}
