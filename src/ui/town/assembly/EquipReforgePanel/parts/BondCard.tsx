import { getBondDef } from "@/data";
import { BondIcon } from "@/ui/common/BondIcon";
import { cx } from "@/ui/common/cx";
import s from "./BondCard.module.css";

interface Props {
  bondId?: string;
  selected?: boolean;
  onSelect?: () => void;
}

export function BondCard({ bondId, selected = false, onSelect }: Props) {
  const bond = bondId ? getBondDef(bondId) : undefined;
  const content = (
    <>
      <div className={s.heading}>
        {bond ? (
          <BondIcon bondId={bond.id} title={bond.name} className={s.icon} />
        ) : (
          <span className={s.iconPlaceholder} aria-hidden="true">—</span>
        )}
        <div className={s.nameBlock}>
          <strong>{bond?.name ?? "无羁绊"}</strong>
          {bond && <span>{bond.arcana}</span>}
        </div>
      </div>
      {bond ? (
        <>
          <p className={s.desc}>{bond.desc}</p>
          <ul className={s.tiers}>
            {bond.tiers.map((tier) => <li key={tier.count}>{tier.desc}</li>)}
          </ul>
        </>
      ) : (
        <p className={s.desc}>这件装备当前没有羁绊词条。</p>
      )}
    </>
  );

  if (onSelect) {
    return (
      <button
        type="button"
        className={cx(s.card, s.interactive, selected && s.selected)}
        role="radio"
        aria-checked={selected}
        aria-label={`选择${bond?.name ?? "无羁绊"}`}
        onClick={onSelect}
      >
        {content}
      </button>
    );
  }

  return <div className={s.card}>{content}</div>;
}
