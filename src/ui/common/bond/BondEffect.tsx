import { Fragment } from "react";
import type { BondDef } from "@/data/roster/bonds";
import { bondEffectParts } from "./bondEffectText";
import s from "./BondEffect.module.css";

/** 仅当前生效的最高档高亮，避免将已经被替代的低档误认为叠加效果。 */
export function BondEffect({ def, tierIndex = -1 }: { def: BondDef; tierIndex?: number }) {
  const parts = bondEffectParts(def);
  const number = (value: string | number, index: number) => (
    <strong className={index === tierIndex ? s.active : s.value}>
      {value}
    </strong>
  );

  if (!parts) {
    return <span className={s.effect}>{def.tiers.map((tier, index) => (
      <Fragment key={tier.count}>
        {index > 0 && "；"}
        <span className={index === tierIndex ? s.active : undefined}>{tier.desc}</span>
        （{number(tier.count, index)}）
      </Fragment>
    ))}</span>;
  }

  return (
    <span className={s.effect}>
      {parts.prefix}
      {parts.values.map((value, index) => (
        <Fragment key={def.tiers[index].count}>
          {index > 0 && <span className={s.separator}>/</span>}
          {number(value, index)}
        </Fragment>
      ))}
      {parts.suffix}（{def.tiers.map((tier, index) => (
        <Fragment key={tier.count}>
          {index > 0 && <span className={s.separator}>/</span>}
          {number(tier.count, index)}
        </Fragment>
      ))}）
    </span>
  );
}
