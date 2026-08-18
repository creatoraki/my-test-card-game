import type { CSSProperties } from "react";
import type { BondDef, BondTier } from "@/data/bonds";
import { ArcanaIcon, getArcanaAccent } from "@/ui/common/ArcanaIcon";
import { BondTooltip } from "@/ui/common/BondTooltip";
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

/** detail：方形图标 + 名称 + 层级刻度；compact：只留方形图标与点数角标，其余信息进详情浮层 */
export type BondSlotVariant = "detail" | "compact";

export interface BondSlotProps {
  def: BondDef;
  count: number;
  tierIndex: number;
  next?: BondTier | null;
  iconSize?: number;
  popoverSide?: RailPopoverSide;
  variant?: BondSlotVariant;
  className?: string;
}

export function BondSlot({
  def,
  count,
  tierIndex,
  next = null,
  iconSize = 48,
  popoverSide = "bottom",
  variant = "detail",
  className,
}: BondSlotProps) {
  const inactive = tierIndex < 0;
  const compact = variant === "compact";
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
      data-variant={variant}
      data-rail-item
      tabIndex={0}
      role="group"
      aria-label={`${def.name}，${count} 点${inactive ? "，未激活" : `，Lv.${tierIndex + 1}`}`}
    >
      <div className={s.frame}>
        <ArcanaIcon id={def.id} size={iconSize} chrome={false} inactive={inactive} accent={accent} />
        <span className={s.count} aria-hidden="true">{count}</span>
      </div>
      {!compact && <span className={s.name}>{def.name}</span>}
      {!compact && (
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
      )}
      <RailPopover side={popoverSide} className={s.popover}>
        <BondTooltip def={def} count={count} tierIndex={tierIndex} next={next} />
      </RailPopover>
    </div>
  );
}
