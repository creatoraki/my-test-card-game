import * as React from "react";
import { cx } from "@/ui/common/cx";
import s from "./TechCard.module.css";

export type TechCardTheme = "normal" | "fast";

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

export function TechCard({
  name,
  cost,
  description,
  stats,
  artSrc,
  theme = "normal",
  className,
}: TechCardProps) {
  return (
    <div className={cx(s["tc-wrapper"], s[`theme-${theme}`], className)}>
      <div className={s["card"]}>
        <div className={s["card-thickness"]} />
        <div className={cx(s["card-surface"], !stats?.length && s["no-footer"])}>
          <div className={s["card-highlight"]} />
          <div className={cx(s["data-stream"], s["data-stream-h"])} />
          <div className={cx(s["data-stream"], s["data-stream-v1"])} />
          <div className={cx(s["data-stream"], s["data-stream-v2"])} />
          <div className={cx(s["edge-node"], s["node-t"])} />
          <div className={cx(s["edge-node"], s["node-r"])} />
          <div className={cx(s["edge-node"], s["node-b"])} />
          <div className={cx(s["edge-node"], s["node-l"])} />
          <div className={s["energy-orb"]}>{cost}</div>
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
          <div className={s["card-name-bar"]}>
            <div className={s["name-bar-dot"]} />
            <div className={s["name-bar-line"]} />
            <span className={s["card-name"]}>{name}</span>
            <div className={s["name-bar-line"]} />
            <div className={s["name-bar-dot"]} />
          </div>
          <div className={s["card-description"]}>
            <p>{description}</p>
          </div>
          {stats?.length ? (
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
          ) : null}
        </div>
      </div>
    </div>
  );
}