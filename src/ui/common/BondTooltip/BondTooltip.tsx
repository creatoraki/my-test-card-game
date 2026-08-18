import type { BondDef, BondTier } from "@/data/bonds";
import { cx } from "@/ui/common/cx";
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

  return (
    <div className={s.tooltip}>
      <div className={s.popHead}>
        <strong>{def.name}</strong>
        <span>{count} 点 · {inactive ? "未激活" : `Lv.${tierIndex + 1}`}</span>
      </div>
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
