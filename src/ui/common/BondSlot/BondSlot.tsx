import type { CSSProperties } from "react";
import type { BondDef, BondTier } from "@/data/bonds";
import { ArcanaIcon, getArcanaAccent } from "@/ui/common/ArcanaIcon";
import { RailPopover } from "@/ui/common/RailPopover";
import { cx } from "@/ui/common/cx";
import s from "./BondSlot.module.css";

export type RailPopoverSide =
  | "left"
  | "right"
  | "bottom"
  | "bottom-left"
  | "bottom-right"
  | "top"
  | "top-left"
  | "top-right";

export interface BondSlotProps {
  def: BondDef;
  count: number;
  tierIndex: number;
  next?: BondTier | null;
  iconSize?: number;
  popoverSide?: RailPopoverSide;
  className?: string;
}

export function BondSlot({
  def,
  count,
  tierIndex,
  next = null,
  iconSize = 48,
  popoverSide = "bottom",
  className,
}: BondSlotProps) {
  const inactive = tierIndex < 0;
  const accent = getArcanaAccent(def.id) ?? def.color;
  const style = {
    "--slot-icon": `${iconSize}px`,
    "--slot-accent": accent,
    "--bond-color": accent,
  } as CSSProperties;

  return (
    <div
      className={cx(s.slot, className)}
      style={style}
      data-inactive={inactive}
      data-rail-item
      tabIndex={0}
      role="group"
      aria-label={`${def.name}，${count} 点${inactive ? "，未激活" : `，Lv.${tierIndex + 1}`}`}
    >
      <div className={s.frame}>
        <ArcanaIcon id={def.id} size={iconSize} chrome={false} inactive={inactive} accent={accent} />
        <span className={s.count} aria-hidden="true">{count}</span>
      </div>
      <span className={s.name}>{def.name}</span>
      <div className={s.tiers} aria-hidden="true">
        {def.tiers.map((tier, index) => (
          <span
            className={cx(
              index < tierIndex && s.passed,
              index === tierIndex && s.current,
              index > tierIndex && s.locked,
              index > tierIndex && next?.count === tier.count && s.nextTarget,
            )}
            key={tier.count}
          >
            {tier.count}
          </span>
        ))}
      </div>
      <RailPopover side={popoverSide} className={s.popover}>
        <div className={s.popHead}>
          <strong>{def.name}</strong>
          <span>{count} 点 · {inactive ? "未激活" : `Lv.${tierIndex + 1}`}</span>
        </div>
        <p>{def.desc}</p>
        <div className={s.popTiers}>
          {def.tiers.map((tier, index) => (
            <div className={index === tierIndex ? s.tierActive : ""} key={tier.count}>
              <b>Lv.{index + 1} · {tier.count} 点</b>
              <span>{tier.desc}</span>
            </div>
          ))}
        </div>
        {inactive && next && <small>还差 {next.count - count} 点</small>}
      </RailPopover>
    </div>
  );
}
