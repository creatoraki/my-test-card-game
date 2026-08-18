import type { CSSProperties } from "react";
import type { BondDef, BondTier } from "@/data/bonds";
import { ArcanaIcon, getArcanaAccent } from "@/ui/common/ArcanaIcon";
import { BondTooltip } from "@/ui/common/BondTooltip";
import { RailPopover } from "@/ui/common/RailPopover";
import type { RailPopoverSide } from "@/ui/common/BondSlot";
import { cx } from "@/ui/common/cx";
import s from "./BondShowcase.module.css";

export interface BondShowcaseProps {
  def: BondDef;
  count: number;
  tierIndex: number;
  next?: BondTier | null;
  iconSize?: number;
  popoverSide?: RailPopoverSide;
  className?: string;
}

export function BondShowcase({
  def,
  count,
  tierIndex,
  next = null,
  iconSize = 96,
  popoverSide = "bottom",
  className,
}: BondShowcaseProps) {
  const inactive = tierIndex < 0;
  const accent = getArcanaAccent(def.id) ?? def.color;
  const style = {
    "--slot-icon": `${iconSize}px`,
    "--slot-accent": accent,
  } as CSSProperties;

  return (
    <div
      className={cx(s.showcase, className)}
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
      <span className={s.tier} aria-hidden="true">
        {inactive ? "未激活" : `Lv.${tierIndex + 1}`}
      </span>
      <RailPopover side={popoverSide} className={s.popover}>
        <BondTooltip def={def} count={count} tierIndex={tierIndex} next={next} />
      </RailPopover>
    </div>
  );
}
