import type { CSSProperties } from "react";
import { cx } from "@/ui/common/cx";
import {
  FallbackArcanaArt,
  getArcana,
  type ArcanaId,
} from "./arcanaArt";
import s from "./ArcanaIcon.module.css";

export interface ArcanaIconProps {
  id: ArcanaId | string;
  size?: number;
  chrome?: boolean;
  bare?: boolean;
  inactive?: boolean;
  accent?: string;
  className?: string;
  ariaLabel?: string;
}

export function ArcanaIcon({
  id,
  size = 256,
  chrome = true,
  bare = false,
  inactive = false,
  accent,
  className,
  ariaLabel,
}: ArcanaIconProps) {
  const meta = getArcana(id);
  const style = {
    "--icon-size": `${size}px`,
    "--arcana-accent": accent ?? meta?.accent ?? "#8fa4a6",
  } as CSSProperties;
  const name = meta?.name ?? "未知羁绊";
  const latin = meta?.latin ?? "UNKNOWN ARCANA";
  const art = meta?.art ?? <FallbackArcanaArt />;

  return (
    <div
      className={cx(s.root, className)}
      style={style}
      data-chrome={chrome}
      data-bare={bare}
      data-inactive={inactive}
      role="img"
      aria-label={ariaLabel ?? `${name} ${latin}`}
    >
      <div
        className={s.icon}
        data-chrome={chrome}
        data-bare={bare}
        data-inactive={inactive}
        aria-hidden="true"
      >
        {!bare && <div className={s.grid} />}
        {!bare && <div className={s.halo} />}
        {chrome && meta && <div className={s.numeral}>{meta.numeral}</div>}
        <svg className={s.art} viewBox="0 0 100 100">
          {art}
        </svg>
        {chrome && meta && (
          <div className={s.tag}>
            <span>{meta.code}</span>
            <span>ARCANA<br />ARCHIVE</span>
          </div>
        )}
        {chrome && meta && (
          <div className={s.caption}>
            <span>{meta.latin}</span>
            <strong>{meta.name}</strong>
          </div>
        )}
      </div>
    </div>
  );
}

