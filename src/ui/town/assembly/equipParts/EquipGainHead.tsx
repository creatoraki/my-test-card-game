import { getBondDef } from "@/data";
import type { ItemDef } from "@/items/types";
import { RARITY_LABEL, SLOT_LABEL } from "@/items/types";
import { BondIcon } from "@/ui/common/BondIcon";
import { cx } from "@/ui/common/cx";
import s from "./EquipGainHead.module.css";

interface Props {
  def: ItemDef;
  nextDef: ItemDef | null;
  notice: string;
  affinityId?: string;
}

export function EquipGainHead({ def, nextDef, notice, affinityId }: Props) {
  const bond = getBondDef(affinityId ?? def.affinity ?? "");

  return (
    <header className={s.head}>
      <div className={s.title}>
        <h3 className={s.name}>{def.name}</h3>
        <p className={s.tags}>
          <span className={cx(s.rarity, s[`r-${def.rarity}`])}>{RARITY_LABEL[def.rarity]}</span>
          {def.slot && <span>{SLOT_LABEL[def.slot]}</span>}
          {nextDef && (
            <span className={s.step}>
              {RARITY_LABEL[def.rarity]}
              <b className={s.arrow}>→</b>
              <b className={cx(s.rarity, s[`r-${nextDef.rarity}`])}>{RARITY_LABEL[nextDef.rarity]}</b>
            </span>
          )}
        </p>
      </div>

      {bond && (
        <div className={s.bond}>
          <BondIcon bondId={bond.id} title={bond.name} className={s.bondIcon} />
          <span className={s.bondName}>
            {bond.name}
            <span className={s.bondArcana}>{bond.arcana}</span>
          </span>
          <span className={s.bondDesc}>{bond.desc}</span>
        </div>
      )}

      <p className={s.notice}>{notice}</p>
    </header>
  );
}
