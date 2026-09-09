import type { CSSProperties } from "react";
import { cx } from "@/ui/common/cx";
import s from "./RouteEntry.module.css";

// 与 RouteBoard 共用 --tile-size / --tile-matrix / --tile-depth，保持起点与线路对齐。
const LANE_LABELS = ["一", "二", "三", "四", "五"];

interface RouteEntryProps {
  lane: number;
  center: { x: number; y: number };
  usable: boolean;
  active: boolean;
  blocked: boolean;
  generating: boolean;
  className?: string;
  onHover: (hovered: boolean) => void;
  onPick: () => void;
}

export function RouteEntry({
  lane, center, usable, active, blocked, generating, className, onHover, onPick,
}: RouteEntryProps) {
  const label = LANE_LABELS[lane] ?? String(lane + 1);
  const status = blocked ? "已封锁" : active ? "已选择" : usable ? "点击出发" : "待激活";

  return (
    <button
      type="button"
      className={cx(s.entry, className)}
      style={{ left: center.x, top: center.y, "--lane": lane } as CSSProperties}
      data-ready={usable || undefined}
      data-selected={active || undefined}
      data-blocked={blocked || undefined}
      data-generating={generating || undefined}
      disabled={!usable}
      aria-label={`起点${label}，${status}`}
      onPointerEnter={() => usable && onHover(true)}
      onPointerLeave={() => onHover(false)}
      onFocus={() => usable && onHover(true)}
      onBlur={() => onHover(false)}
      onClick={onPick}
    >
      <span className={s.halo} aria-hidden />
      <span className={s.beacon} aria-hidden />
      <span className={s.slab} aria-hidden />
      <span className={s.face} aria-hidden>
        <span className={s.inset} />
      </span>
      <span className={s.marker} aria-hidden>
        <svg className={s.cue} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="3">
          {blocked ? (
            <path d="m9 9 14 14M23 9 9 23" />
          ) : active ? (
            <path d="m7 16 6 6L25 9" strokeLinecap="round" strokeLinejoin="round" />
          ) : (
            <path d="m7 7 9 8 9-8M7 17l9 8 9-8" strokeLinecap="round" strokeLinejoin="round" />
          )}
        </svg>
        <span className={s.label}>起点 {label}</span>
        <span className={s.status}>{status}</span>
      </span>
    </button>
  );
}
