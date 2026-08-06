import * as React from "react";
import { cx } from "@/ui/common/cx";
import s from "./TechCard.module.css";

export type TechCardTheme = "blue" | "purple" | "gold";

export interface TechCardStat {
  /** Icon character, such as "⚔", "🛡", or "⚡". */
  icon: string;
  value: string | number;
}

export interface TechCardProps {
  /** Card name; the style applies uppercase to Latin text. */
  name: string;
  /** Number shown in the energy orb. */
  cost: string | number;
  /** Text shown in the type bar, such as "单位 · 机械". */
  typeLabel: string;
  /** Card description, allowing highlighted strong text. */
  description: React.ReactNode;
  /** Footer stats, rendered in order with dividers between items. */
  stats?: TechCardStat[];
  /** Image source for the art zone. */
  artSrc?: string;
  /** Card color theme. */
  theme?: TechCardTheme;
  /** Additional class for the outer wrapper. */
  className?: string;
}

const DEFAULT_STATS: TechCardStat[] = [
  { icon: "⚔", value: 7 },
  { icon: "🛡", value: 5 },
  { icon: "⚡", value: 3 },
];

export function TechCard({
  name,
  cost,
  typeLabel,
  description,
  stats = DEFAULT_STATS,
  artSrc,
  theme = "blue",
  className,
}: TechCardProps) {
  return (
    <div className={cx(s["tc-wrapper"], s[`theme-${theme}`], className)}>
      <div className={s["card"]}>
        <div className={s["card-thickness"]} />
        <div className={s["card-surface"]}>
          <div className={s["card-highlight"]} />
          <div className={cx(s["data-stream"], s["data-stream-h"])} />
          <div className={cx(s["data-stream"], s["data-stream-v1"])} />
          <div className={cx(s["data-stream"], s["data-stream-v2"])} />
          <div className={cx(s["edge-node"], s["node-t"])} />
          <div className={cx(s["edge-node"], s["node-r"])} />
          <div className={cx(s["edge-node"], s["node-b"])} />
          <div className={cx(s["edge-node"], s["node-l"])} />
          <div className={s["energy-orb"]}>{cost}</div>
          <div className={s["card-header"]}>
            <div className={s["header-icon"]} />
            <span className={s["card-name"]}>{name}</span>
          </div>
          <div className={s["card-art-zone"]}>
            <div className={cx(s["art-corner"], s["art-corner-tl"])} />
            <div className={cx(s["art-corner"], s["art-corner-tr"])} />
            <div className={cx(s["art-corner"], s["art-corner-bl"])} />
            <div className={cx(s["art-corner"], s["art-corner-br"])} />
            {artSrc ? (
              <img className={s["art-image"]} src={artSrc} alt={name} />
            ) : (
              <>
                <div className={s["art-placeholder"]}>
                  <div className={s["art-placeholder-inner"]} />
                </div>
                <span className={s["art-label"]}>◆ 插画区域 ◆</span>
              </>
            )}
          </div>
          <div className={s["card-type-bar"]}>
            <div className={s["type-dot"]} />
            <div className={s["type-line"]} />
            <span className={s["type-label"]}>{typeLabel}</span>
            <div className={s["type-line"]} />
            <div className={s["type-dot"]} />
          </div>
          <div className={s["card-description"]}>
            <p>{description}</p>
          </div>
          <div className={s["card-footer"]}>
            {stats.map((stat, index) => (
              <React.Fragment key={`${stat.icon}-${index}`}>
                {index > 0 && <div className={s["footer-divider"]} />}
                <div className={s["footer-stat"]}>
                  <div className={s["footer-stat-icon"]}>{stat.icon}</div>
                  <span>{stat.value}</span>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}