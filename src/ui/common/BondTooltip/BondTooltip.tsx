import type { BondDef, BondTier } from "@/data/bonds";
import { ArcanaIcon, getArcanaAccent } from "@/ui/common/ArcanaIcon";
import { cx } from "@/ui/common/cx";
import { PopoverHead } from "@/ui/common/RailPopover";
import s from "./BondTooltip.module.css";

export function BondTooltip({
  def,
  count,
  tierIndex,
  next = null,
}: {
  def: BondDef;
  count: number;
  tierIndex: number;
  next?: BondTier | null;
}) {
  const inactive = tierIndex < 0;
  const accent = getArcanaAccent(def.id) ?? def.color;

  return (
    <div className={s.tooltip}>
      <PopoverHead
        className={s.popHead}
        icon={<ArcanaIcon id={def.id} size={54} chrome={false} accent={accent} inactive={inactive} />}
        name={def.name}
        meta={`${count} 点 · ${inactive ? "未激活" : `Lv.${tierIndex + 1}`}`}
      />
      <p>{def.desc}</p>
      <div className={s.popTiers}>
        {def.tiers.map((tier, index) => (
          <div className={cx(index === tierIndex && s.tierActive)} key={tier.count}>
            <b>Lv.{index + 1} · {tier.count} 点</b>
            <span>{tier.desc}</span>
          </div>
        ))}
      </div>
      {inactive && next && <small>还差 {next.count - count} 点</small>}
    </div>
  );
}
